#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BIN="$ROOT/target/debug/i13"
WORK="${TMPDIR:-/tmp}/i13-compiler-torture-003"
rm -rf "$WORK"
mkdir -p "$WORK"

# Re-run all 24 prior attacks. Pass 002 intentionally exits 93 when no break is found.
set +e
bash scripts/compiler_torture_002.sh
prior=$?
set -e
if [[ $prior -eq 0 ]]; then
  echo "PRIOR PASS DISCOVERED A BREAK; stop before pass 003"
  exit 0
fi
if [[ $prior -ne 93 ]]; then
  echo "unexpected pass-002 exit=$prior"
  exit "$prior"
fi

cargo build --quiet --bin i13
pass_count=24

make_case() {
  local name="$1" source="$2"
  printf '%s\n' "$source" > "$WORK/$name.i13"
}

wasm_probe() {
  local wasm="$1" global="$2"
  node - "$wasm" "$global" <<'NODE'
const fs = require('fs');
const [wasmPath, globalName] = process.argv.slice(2);
try {
  const instance = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmPath)), {});
  try {
    instance.exports.i13_run();
    const value = instance.exports[`i13.global.${globalName}`].value;
    const kind = instance.exports[`i13.kind.${globalName}`].value;
    console.log(`OK|${value}|${kind}`);
  } catch (error) {
    if (error instanceof WebAssembly.RuntimeError) console.log(`TRAP|${error.message}`);
    else console.log(`JS_ERROR|${error.name}|${error.message}`);
  }
} catch (error) {
  console.log(`MODULE_ERROR|${error.name}|${error.message}`);
}
NODE
}

first_break() {
  local name="$1" reason="$2"
  echo "FIRST BREAK 003: $name"
  echo "reason=$reason"
  echo "passed_before_break=$pass_count"
  echo "BREAK_ID=I13-WASM-LIMIT-002"
  exit 0
}

# Generic differential attack: the VM decides whether the program succeeds or fails;
# Wasm must make the same decision. On success, numeric OUT must match exactly.
attack_case() {
  local name="$1" source="$2"
  make_case "$name" "$source"
  local vm_status vm_out wasm_file probe wstatus wvalue wkind vm_value
  set +e
  vm_out="$($BIN run "$WORK/$name.i13" 2>"$WORK/$name.vm.err")"
  vm_status=$?
  set -e

  wasm_file="$WORK/$name.wasm"
  $BIN build "$WORK/$name.i13" -o "$wasm_file" >/dev/null
  probe="$(wasm_probe "$wasm_file" OUT)"
  IFS='|' read -r wstatus wvalue wkind _ <<< "$probe"

  if [[ $vm_status -eq 0 ]]; then
    vm_value="$(printf '%s\n' "$vm_out" | awk -F' = ' '$1=="OUT" {print $2; exit}')"
    if [[ -z "$vm_value" ]]; then
      echo "HARNESS INVALID: $name VM succeeded without numeric OUT"
      echo "$vm_out"
      exit 97
    fi
    if [[ "$wstatus" != "OK" ]]; then
      first_break "$name" "VM succeeded OUT=$vm_value but Wasm returned $probe"
    fi
    if [[ "$wkind" != "0" || "$wvalue" != "$vm_value" ]]; then
      first_break "$name" "VM OUT=$vm_value NUMBER; Wasm value=$wvalue kind=$wkind"
    fi
    pass_count=$((pass_count + 1))
    echo "PASS[$pass_count] $name · success parity OUT=$vm_value"
  else
    if [[ "$wstatus" != "TRAP" ]]; then
      first_break "$name" "VM failed ($(tr '\n' ' ' < "$WORK/$name.vm.err")) but Wasm returned $probe"
    fi
    pass_count=$((pass_count + 1))
    echo "PASS[$pass_count] $name · failure parity VM error = Wasm trap"
  fi
}

# Exact frame fence: 4094 succeeded. 4095 requires one more recursive push and
# crosses the reference VM's default 4096-frame limit including main.
attack_case "recursion_4095_frame_fence" 'def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }
I OUT <- count(4095)'
attack_case "recursion_4096_past_fence" 'def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }
I OUT <- count(4096)'

# Step-budget attack with shallow call depth. explode(n) has exponential work but
# only O(n) depth, so it isolates the 8,000,000-step VM budget from frame depth.
for depth in 16 17 18 19 20 21 22; do
  attack_case "step_budget_explode_${depth}" "def explode(I n) { if n <= 0 { -> 1 } -> explode(n - 1) + explode(n - 1) }
I OUT <- explode(${depth})"
done

echo "NO BREAK 003 FOUND · $pass_count total attacks passed"
exit 98
