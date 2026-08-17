#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BIN="$ROOT/target/debug/i13"
WORK="${TMPDIR:-/tmp}/i13-compiler-torture-002"
rm -rf "$WORK"
mkdir -p "$WORK"

cargo build --quiet --bin i13

# First prove the frozen 8-case known-good boundary still holds.
bash scripts/compiler_torture.sh

pass_count=8

make_case() {
  local name="$1"
  local source="$2"
  printf '%s\n' "$source" > "$WORK/$name.i13"
}

wasm_probe() {
  local wasm="$1"
  local global="$2"
  node - "$wasm" "$global" <<'NODE'
const fs = require('fs');
const [wasmPath, globalName] = process.argv.slice(2);
const bytes = fs.readFileSync(wasmPath);
let instance;
try {
  instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
} catch (error) {
  console.log(`MODULE_ERROR|${error.name}|${error.message}`);
  process.exit(0);
}
try {
  instance.exports.i13_run();
  const value = instance.exports[`i13.global.${globalName}`].value;
  const kind = instance.exports[`i13.kind.${globalName}`].value;
  instance.exports.i13_run();
  const value2 = instance.exports[`i13.global.${globalName}`].value;
  const kind2 = instance.exports[`i13.kind.${globalName}`].value;
  if (!Object.is(value, value2) || kind !== kind2) {
    console.log(`NONDETERMINISTIC|${value}|${kind}|${value2}|${kind2}`);
  } else {
    console.log(`OK|${value}|${kind}`);
  }
} catch (error) {
  if (error instanceof WebAssembly.RuntimeError) {
    console.log(`TRAP|${error.message}`);
  } else {
    console.log(`JS_ERROR|${error.name}|${error.message}`);
  }
}
NODE
}

first_break() {
  local name="$1"
  local reason="$2"
  echo "FIRST BREAK 002: $name"
  echo "reason=$reason"
  echo "passed_before_break=$pass_count"
  echo "BREAK_ID=I13-WASM-DEPTH-OR-SEMANTIC-002"
  exit 0
}

expect_value_parity() {
  local name="$1"
  local source="$2"
  local global="$3"
  local expected="$4"
  make_case "$name" "$source"
  local vm_out wasm_file probe status value kind
  if ! vm_out="$($BIN run "$WORK/$name.i13" 2>"$WORK/$name.vm.err")"; then
    echo "HARNESS INVALID: $name expected VM success"
    cat "$WORK/$name.vm.err"
    exit 94
  fi
  echo "$vm_out" | grep -Fq "$global = $expected" || {
    echo "HARNESS INVALID: $name VM value did not match expected $global=$expected"
    echo "$vm_out"
    exit 95
  }
  wasm_file="$WORK/$name.wasm"
  $BIN build "$WORK/$name.i13" -o "$wasm_file" >/dev/null
  probe="$(wasm_probe "$wasm_file" "$global")"
  IFS='|' read -r status value kind _ <<< "$probe"
  if [[ "$status" != "OK" ]]; then
    first_break "$name" "reference VM completed with $global=$expected but generated Wasm returned: $probe"
  fi
  if [[ "$kind" != "0" || "$value" != "$expected" ]]; then
    first_break "$name" "value/kind divergence: VM $global=$expected NUMBER; Wasm value=$value kind=$kind"
  fi
  pass_count=$((pass_count + 1))
  echo "PASS[$pass_count] $name · $global=$expected · VM=WASM"
}

expect_runtime_error_parity() {
  local name="$1"
  local source="$2"
  make_case "$name" "$source"
  local wasm_file probe
  if $BIN run "$WORK/$name.i13" >/dev/null 2>"$WORK/$name.vm.err"; then
    echo "HARNESS INVALID: $name expected VM runtime error"
    exit 96
  fi
  wasm_file="$WORK/$name.wasm"
  $BIN build "$WORK/$name.i13" -o "$wasm_file" >/dev/null
  probe="$(wasm_probe "$wasm_file" OUT)"
  if [[ "$probe" != TRAP\|* ]]; then
    first_break "$name" "reference VM errored but generated Wasm did not trap: $probe; VM=$(tr '\n' ' ' < "$WORK/$name.vm.err")"
  fi
  pass_count=$((pass_count + 1))
  echo "PASS[$pass_count] $name · VM error = Wasm trap"
}

# 9: tagged FUNCTION must also be rejected as an If condition.
expect_runtime_error_parity "function_as_condition" 'def f() { -> 7 }
if f { I OUT <- 1 }
I OUT <- 0'

# 10: static call identity must not bypass runtime value identity after rebinding.
expect_runtime_error_parity "function_rebound_then_called" 'def f() { -> 7 }
f <- 3
I OUT <- f()'

# 11: nested calls reuse Wasm scratch locals; operand-stack values must survive.
expect_value_parity "nested_calls" 'def add(I a, I b) { -> a + b }
def twice(I x) { -> x * 2 }
I OUT <- add(twice(3), twice(4))' OUT 14

# 12: a later global declaration makes the slot addressable, but not bound early.
expect_runtime_error_parity "global_assign_before_declare" 'OUT <- 1
I OUT <- 2'

# 13: same boundary for function-local declaration state.
expect_runtime_error_parity "local_assign_before_declare" 'def bad() { x <- 1 I x <- 2 -> x }
I OUT <- bad()'

# 14: falling off a value-returning function must fail on both engines.
expect_runtime_error_parity "function_fallthrough" 'def bad() { I x <- 1 }
I OUT <- bad()'

# 15: nested structured control with an early tagged return.
expect_value_parity "nested_return" 'def choose(I x) { if x == 1 { if x == 1 { -> 42 } } -> 0 }
I OUT <- choose(1)' OUT 42

# 16: stress tagged argument ABI and call_indirect type generation at arity 16.
expect_value_parity "arity_16" 'def sum16(I a,I b,I c,I d,I e,I f,I g,I h,I i,I j,I k,I l,I m,I n,I o,I p) { -> a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p }
I OUT <- sum16(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1)' OUT 16

# 17+: explicit VM frames are known-good to a configured maximum of 4096.
# Ramp toward that boundary and stop on the first host-Wasm disagreement.
for depth in 512 1024 1536 2048 2560 3072 3584 4094; do
  expect_value_parity "recursion_${depth}" "def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }
I OUT <- count(${depth})" OUT "$depth"
done

echo "NO BREAK 002 FOUND · $pass_count total attacks passed"
echo "extend compiler_torture_002 beyond recursion_4094"
exit 93
