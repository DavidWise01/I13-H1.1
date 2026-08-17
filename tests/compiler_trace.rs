#[path = "../src/compiler/mod.rs"]
mod compiler;

use std::{fs, process::Command};

use compiler::{ivm::Op, trace, vm, DiagnosticCode, SourceFile, TraceEvent};

fn sample() -> SourceFile {
    SourceFile::new(
        "trace.i13",
        "def add(I a, I b) { -> a + b }\nI x <- 1\nx.p <- 2\nI OUT <- add(x, 3)\n",
    )
}

fn capture(source: SourceFile) -> (compiler::CompileOutput, vm::VmResult, Vec<TraceEvent>) {
    let output = compiler::compile(source).unwrap();
    let mut events = Vec::new();
    let mut observer = |event: &TraceEvent| events.push(event.clone());
    let execution = vm::run_observed(&output.ivm, vm::VmConfig::default(), &mut observer).unwrap();
    (output, execution, events)
}

#[test]
fn observed_execution_is_identical_to_unobserved_execution() {
    let output = compiler::compile(sample()).unwrap();
    let plain = vm::run(&output.ivm, vm::VmConfig::default()).unwrap();

    let mut events = Vec::new();
    let mut observer = |event: &TraceEvent| events.push(event.clone());
    let observed = vm::run_observed(&output.ivm, vm::VmConfig::default(), &mut observer).unwrap();

    assert_eq!(plain, observed);
    assert_eq!(events.len() as u64, observed.steps);
    assert_eq!(observed.global_number(&output.ivm, "OUT"), Some(6.0));
}

#[test]
fn trace_is_deterministic_and_exposes_runtime_transitions() {
    let (output, first_execution, first_events) = capture(sample());
    let (_, second_execution, second_events) = capture(sample());

    assert_eq!(first_execution, second_execution);
    assert_eq!(first_events, second_events);

    let rendered = first_events
        .iter()
        .map(|event| trace::render_event(&output.ivm, event))
        .collect::<Vec<_>>()
        .join("\n");

    assert!(rendered.contains("depth=1 scope=main"));
    assert!(rendered.contains("bind g0000:add <- Function(fn0000:add)"));
    assert!(rendered.contains("declare g0001:x <- Number(1)"));
    assert!(rendered.contains("assign g0001:x <- Number(3)"));
    assert!(rendered.contains("call Function(fn0000:add) argc=2"));
    assert!(rendered.contains("depth=2 scope=fn0000:add"));
    assert!(rendered.contains("return Number(6)"));
    assert!(first_events.iter().any(|event| event.op == Op::Call && event.effect.need == 3 && event.effect.net == -2));
}

#[test]
fn trace_reaches_the_real_failing_instruction_without_changing_the_error() {
    let source = SourceFile::new("fault.i13", "I OUT <- 1 / 0\n");
    let output = compiler::compile(source).unwrap();

    let plain_error = vm::run(&output.ivm, vm::VmConfig::default()).unwrap_err();
    let mut events = Vec::new();
    let mut observer = |event: &TraceEvent| events.push(event.clone());
    let traced_error = vm::run_observed(&output.ivm, vm::VmConfig::default(), &mut observer).unwrap_err();

    assert_eq!(plain_error, traced_error);
    assert_eq!(traced_error.code, DiagnosticCode::VmRuntime);
    let last = events.last().expect("failing instruction must be observed");
    assert_eq!(last.op, Op::Bin);
    assert_eq!(last.detail, "Number(1) Div Number(0)");
}

#[test]
fn cli_streams_trace_and_finishes_with_normal_result() {
    let path = std::env::temp_dir().join(format!("i13-trace-{}.i13", std::process::id()));
    fs::write(&path, sample().text).unwrap();

    let output = Command::new(env!("CARGO_BIN_EXE_i13"))
        .arg("trace")
        .arg(&path)
        .output()
        .unwrap();

    let _ = fs::remove_file(path);
    assert!(output.status.success(), "trace failed: {}", String::from_utf8_lossy(&output.stderr));
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.starts_with("I13 TRACE v0.1\nstep_limit 8000000\nframe_limit 4096\n"));
    assert!(stdout.contains("scope=main"));
    assert!(stdout.contains("scope=fn0000:add"));
    assert!(stdout.contains("TRACE OK"));
    assert!(stdout.contains("OUT = 6"));
}
