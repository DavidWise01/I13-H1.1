#[path = "../src/compiler/mod.rs"]
mod compiler;

use compiler::{compile, DiagnosticCode, SourceFile};
use compiler::ivm::I13_FRAME_LIMIT;
use compiler::vm::{self, VmConfig};

const PROBE_STEP_LIMIT: u64 = 100_000_000;

fn explode_source(depth: u32) -> String {
    format!(
        "def explode(I n) {{ if n <= 0 {{ -> 1 }} -> explode(n - 1) + explode(n - 1) }}\nI OUT <- explode({depth})\n"
    )
}

fn run_steps(name: &str, source: &str, step_limit: u64) -> Result<(u64, f64), compiler::Diagnostic> {
    let output = compile(SourceFile::new(name, source)).expect("probe source must compile");
    let result = vm::run(
        &output.ivm,
        VmConfig {
            step_limit,
            frame_limit: I13_FRAME_LIMIT,
        },
    )?;
    let out = result
        .global_number(&output.ivm, "OUT")
        .expect("probe must expose numeric OUT");
    Ok((result.steps, out))
}

#[test]
fn characterize_exponential_step_growth_and_default_fence() {
    let mut measured = Vec::new();

    for depth in 16..=20 {
        let source = explode_source(depth);
        let first = run_steps("explode.i13", &source, PROBE_STEP_LIMIT).unwrap();
        let second = run_steps("explode.i13", &source, PROBE_STEP_LIMIT).unwrap();
        assert_eq!(first, second, "step meter must be deterministic for explode({depth})");
        assert_eq!(first.1, 2f64.powi(depth as i32));
        println!("I13_STEP_PROBE explode({depth}) steps={} out={}", first.0, first.1);
        measured.push((depth, first.0));
    }

    for pair in measured.windows(2) {
        assert!(pair[1].1 > pair[0].1, "step count must increase with this workload");
    }

    let depth18 = explode_source(18);
    let ok18 = run_steps("explode18.i13", &depth18, 8_000_000).unwrap();
    assert_eq!(ok18.1, 262_144.0);

    let depth19 = explode_source(19);
    let output19 = compile(SourceFile::new("explode19.i13", &depth19)).unwrap();
    let err19 = vm::run(
        &output19.ivm,
        VmConfig {
            step_limit: 8_000_000,
            frame_limit: I13_FRAME_LIMIT,
        },
    )
    .unwrap_err();
    assert_eq!(err19.code, DiagnosticCode::VmStepLimit);
}

#[test]
fn step_limit_fence_is_exact_but_tracks_execution_shape() {
    let compact = "I OUT <- 1 + 2\n";
    let expanded = "I a <- 1\nI b <- 2\nI OUT <- a + b\n";

    let compact_probe = run_steps("compact.i13", compact, PROBE_STEP_LIMIT).unwrap();
    let expanded_probe = run_steps("expanded.i13", expanded, PROBE_STEP_LIMIT).unwrap();

    assert_eq!(compact_probe.1, 3.0);
    assert_eq!(expanded_probe.1, 3.0);
    assert!(expanded_probe.0 > compact_probe.0);

    let exact = run_steps("compact.i13", compact, compact_probe.0).unwrap();
    assert_eq!(exact, compact_probe, "exact measured budget must still pass");

    let output = compile(SourceFile::new("compact.i13", compact)).unwrap();
    let err = vm::run(
        &output.ivm,
        VmConfig {
            step_limit: compact_probe.0 - 1,
            frame_limit: I13_FRAME_LIMIT,
        },
    )
    .unwrap_err();
    assert_eq!(err.code, DiagnosticCode::VmStepLimit);

    println!(
        "I13_STEP_SHAPE compact_steps={} expanded_steps={} same_out=3",
        compact_probe.0, expanded_probe.0
    );
}
