#[path = "../src/compiler/mod.rs"]
mod compiler;

use std::{
    fs,
    io::Write,
    process::{Command, Stdio},
};

use compiler::{compile, debugger, SourceFile};
use compiler::vm::{DebugControl, DebugRunResult, DebugSnapshot, VmConfig};

fn sample() -> SourceFile {
    SourceFile::new(
        "debug.i13",
        "def add(I a, I b) {\n  -> a + b\n}\nI x <- 1\nI OUT <- add(x, 3)\n",
    )
}

#[test]
fn debugger_observer_preserves_exact_vm_result() {
    let output = compile(sample()).unwrap();
    let plain = compiler::vm::run(&output.ivm, VmConfig::default()).unwrap();

    let mut snapshots = Vec::<DebugSnapshot>::new();
    let mut observer = |snapshot: &DebugSnapshot| {
        snapshots.push(snapshot.clone());
        DebugControl::Continue
    };
    let debugged = compiler::vm::run_debugged(&output.ivm, VmConfig::default(), &mut observer).unwrap();

    let DebugRunResult::Completed(debugged) = debugged else { panic!("debugger unexpectedly quit") };
    assert_eq!(plain, debugged);
    assert_eq!(snapshots.len() as u64, plain.steps);
    assert!(!snapshots.is_empty());
    assert_eq!(snapshots[0].event.frame_depth, 1);
}

#[test]
fn debugger_snapshots_expose_tagged_bindings_frames_and_stack() {
    let output = compile(sample()).unwrap();
    let mut saw_function_frame = false;
    let mut saw_tagged_function = false;
    let mut saw_bound_x = false;

    let mut observer = |snapshot: &DebugSnapshot| {
        if snapshot.frames.len() > 1 {
            saw_function_frame = true;
        }
        if snapshot.globals.iter().flatten().any(|value| matches!(value, compiler::vm::Value::Function(_))) {
            saw_tagged_function = true;
        }
        if let Some(slot) = output.ivm.globals.iter().position(|name| name == "x") {
            if matches!(snapshot.globals.get(slot).copied().flatten(), Some(compiler::vm::Value::Number(1.0))) {
                saw_bound_x = true;
            }
        }
        DebugControl::Continue
    };

    let result = compiler::vm::run_debugged(&output.ivm, VmConfig::default(), &mut observer).unwrap();
    assert!(matches!(result, DebugRunResult::Completed(_)));
    assert!(saw_function_frame);
    assert!(saw_tagged_function);
    assert!(saw_bound_x);
}

#[test]
fn debugger_breakpoint_is_suppressed_until_source_line_changes() {
    let output = compile(sample()).unwrap();
    let source = sample();
    let mut session = compiler::Debugger::new();
    let mut pauses = Vec::new();
    let mut phase = 0usize;

    let mut observer = |snapshot: &DebugSnapshot| {
        if let Some(reason) = session.should_pause(snapshot) {
            pauses.push((reason, snapshot.event.span.line, snapshot.event.frame_depth));
            match phase {
                0 => {
                    assert!(matches!(reason, debugger::PauseReason::Entry));
                    assert!(matches!(
                        session.command("break 5", &output.ivm, &source, snapshot),
                        debugger::CommandEffect::Stay(_)
                    ));
                    assert!(matches!(
                        session.command("continue", &output.ivm, &source, snapshot),
                        debugger::CommandEffect::Resume(_)
                    ));
                    phase = 1;
                }
                1 => {
                    assert!(matches!(reason, debugger::PauseReason::Breakpoint(5)));
                    assert!(matches!(
                        session.command("continue", &output.ivm, &source, snapshot),
                        debugger::CommandEffect::Resume(_)
                    ));
                    phase = 2;
                }
                _ => panic!("breakpoint re-fired before leaving source line: {reason:?}"),
            }
        }
        DebugControl::Continue
    };

    let result = compiler::vm::run_debugged(&output.ivm, VmConfig::default(), &mut observer).unwrap();
    assert!(matches!(result, DebugRunResult::Completed(_)));
    assert_eq!(pauses.len(), 2);
}

#[test]
fn real_cli_debugger_supports_break_inspect_next_and_continue() {
    let path = std::env::temp_dir().join(format!("i13-debugger-{}.i13", std::process::id()));
    fs::write(&path, sample().text).unwrap();

    let mut child = Command::new(env!("CARGO_BIN_EXE_i13"))
        .arg("debug")
        .arg(&path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();

    child
        .stdin
        .as_mut()
        .unwrap()
        .write_all(b"break 5\ncontinue\nbindings\nstack\nframes\nnext\ncontinue\n")
        .unwrap();

    let output = child.wait_with_output().unwrap();
    let _ = fs::remove_file(path);

    assert!(output.status.success(), "{}", String::from_utf8_lossy(&output.stderr));
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("I13 DEBUGGER v0.1"));
    assert!(stdout.contains("BREAKPOINT 5 SET"));
    assert!(stdout.contains("PAUSE breakpoint:5"));
    assert!(stdout.contains("GLOBALS"));
    assert!(stdout.contains("STACK"));
    assert!(stdout.contains("FRAMES root→current"));
    assert!(stdout.contains("NEXT"));
    assert!(stdout.contains("DEBUG OK"));
    assert!(stdout.contains("OUT = 4"));
}
