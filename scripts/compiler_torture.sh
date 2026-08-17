#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BIN="$ROOT/target/debug/i13"
WORK="${TMPDIR:-/tmp}/i13-compiler-torture"
rm -rf "$WORK"
mkdir -p "$WORK"

cargo build --quiet --bin i13

pass_count=0

make_case() {
  local name="$1"
  local source="$2"
  printf '%s\n' "$source" > "$WORK/$name.i13"
}

wasm_number() {
  local wasm="$1"
  local global="$2"
  node - "$wasm" "$global" <<'NODE'
const fs = require('fs');
const [wasmPath, globalName] = process.argv.slice(2);
const bytes = fs.readFileSync(wasmPath);
const module = new WebAssembly.Module(bytes);
const instance = new WebAssembly.Instance(module, {});
instance.exports.i13_run();
const first = instance.exports[`i13.global.${globalName}`].value;
const firstKind = instance.exports[`i13.kind.${globalName}`].value;
instance.exports.i13_run();
const second = instance.exports[`i13.global.${globalName}`].value;
const secondKind = instance.exports[`i13.kind.${globalName}`].value;
if (!Object.is(first, second) || firstKind !== secondKind) {
  console.error(`NONDETERMINISTIC ${globalName}: first=${first}/${firstKind} second=${second}/${secondKind}`);
  process.exit(42);
}
if (firstKind !== 0) {
  console.error(`EXPECTED NUMBER ${globalName}, got kind=${firstKind}`);
  process.exit(43);
}
process.stdout.write(String(first));
NODE
}

wasm_traps() {
  local wasm="$1"
  node - "$wasm" <<'NODE'
const fs = require('fs');
const wasmPath = process.argv[2];
const bytes = fs.readFileSync(wasmPath);
const module = new WebAssembly.Module(bytes);
const instance = new WebAssembly.Instance(module, {});
try {
  instance.exports.i13_run();
  process.exit(1);
} catch (error) {
  if (error instanceof WebAssembly.RuntimeError) process.exit(0);
  console.error(error);
  process.exit(2);
}
NODE
}

expect_value() {
  local name="$1"
  local source="$2"
  local global="$3"
  local expected="$4"
  make_case "$name" "$source"
  local vm_out wasm_out wasm_file="$WORK/$name.wasm"
  vm_out="$($BIN run "$WORK/$name.i13")"
  echo "$vm_out" | grep -Fq "$global = $expected"
  $BIN build "$WORK/$name.i13" -o "$wasm_file" >/dev/null
  wasm_out="$(wasm_number "$wasm_file" "$global")"
  if [[ "$wasm_out" != "$expected" ]]; then
    echo "BREAK: $name"
    echo "reason=value divergence"
    echo "expected=$expected"
    echo "wasm=$wasm_out"
    exit 90
  fi
  pass_count=$((pass_count + 1))
  echo "PASS[$pass_count] $name · $global=$expected · VM=WASM · tagged NUMBER · repeat deterministic"
}

expect_runtime_error_both() {
  local name="$1"
  local source="$2"
  make_case "$name" "$source"
  local wasm_file="$WORK/$name.wasm"
  if $BIN run "$WORK/$name.i13" >/dev/null 2>"$WORK/$name.vm.err"; then
    echo "BREAK: $name"
    echo "reason=reference VM unexpectedly accepted runtime-invalid program"
    exit 91
  fi
  $BIN build "$WORK/$name.i13" -o "$wasm_file" >/dev/null
  if ! wasm_traps "$wasm_file"; then
    echo "BREAK: $name"
    echo "reason=VM runtime error but generated Wasm completed"
    echo "vm_error=$(tr '\n' ' ' < "$WORK/$name.vm.err")"
    node - "$wasm_file" <<'NODE'
const fs = require('fs');
const instance = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(process.argv[2])), {});
instance.exports.i13_run();
for (const [name, value] of Object.entries(instance.exports)) {
  if (name.startsWith('i13.global.') || name.startsWith('i13.kind.')) {
    console.log(`wasm_${name}=${value.value}`);
  }
}
NODE
    exit 92
  fi
  pass_count=$((pass_count + 1))
  echo "PASS[$pass_count] $name · VM error = Wasm trap"
}

expect_value "arith_precedence" 'I OUT <- 4 + 2 * 3' OUT 10
expect_value "control_false_path" 'def pick(I x) { if x == 0 { -> 7 } -> 9 }
I OUT <- pick(1)' OUT 9
expect_value "recursion_256" 'def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }
I OUT <- count(256)' OUT 256
expect_runtime_error_both "division_zero" 'I OUT <- 1 / 0'

# I13-WASM-TYPE-001 regression: function identity must survive lowering.
expect_runtime_error_both "function_as_number" 'def f() { -> 7 }
I OUT <- f + 1'

# Carry FUNCTION through a tagged argument before the numeric boundary.
expect_runtime_error_both "function_through_argument" 'def f() { -> 7 }
def bad(I x) { -> x + 1 }
I OUT <- bad(f)'

# Carry FUNCTION through return + global assignment before the numeric boundary.
expect_runtime_error_both "function_through_return" 'def f() { -> 7 }
def identity(I x) { -> x }
I HANDLE <- identity(f)
I OUT <- HANDLE + 1'

# Compare uses the same numeric-only IVM law as Bin.
expect_runtime_error_both "function_as_compare_operand" 'def f() { -> 7 }
I OUT <- f == 0'

echo "TORTURE PASS · $pass_count attack(s)"
echo "I13-WASM-TYPE-001 regression closed across direct, argument, return, and compare paths"
