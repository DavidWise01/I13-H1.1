//! I13 compiler construction spine.
//!
//! Canonical authority: SPEC -> HIR -> IVM.
//! This module intentionally does not depend on E1, corpus, UI, or other
//! referent-only subsystems.

pub mod ast;
pub mod bignum;
pub mod debugger;
pub mod diagnostic;
pub mod hir;
pub mod introspect;
pub mod ivm;
pub mod lexer;
pub mod lower_ivm;
pub mod parser;
pub mod semantic;
pub mod source;
pub mod spotlog;
pub mod token;
pub mod trace;
pub mod validator;
pub mod vm;
pub mod wasm;

pub use debugger::{Debugger, PauseReason};
pub use diagnostic::{Diagnostic, DiagnosticCode};
pub use hir::HirProgram;
pub use introspect::{dump as dump_compiler, DumpKind};
pub use parser::parse;
pub use semantic::check;
pub use source::{SourceFile, Span};
pub use trace::{TraceEvent, TraceScope};

#[derive(Debug, Clone, PartialEq)]
pub struct CompileOutput {
    pub hir: HirProgram,
    pub ivm: ivm::IvmProgram,
    pub validation: validator::ValidationReport,
}

/// Front-end authority: source -> tokens -> AST -> HIR -> semantic check.
pub fn front_end(source: SourceFile) -> Result<HirProgram, Vec<Diagnostic>> {
    let tokens = lexer::lex(&source)?;
    let ast = parser::parse_tokens(&source, tokens)?;
    let hir = hir::lower(ast);
    semantic::check(&hir)?;
    Ok(hir)
}

/// Canonical checked compiler slice: source -> HIR -> IVM -> single-pass validation.
pub fn compile(source: SourceFile) -> Result<CompileOutput, Vec<Diagnostic>> {
    let hir = front_end(source)?;
    let ivm = lower_ivm::lower(&hir)?;
    let validation = validator::validate(&ivm)?;
    Ok(CompileOutput { hir, ivm, validation })
}

/// Reference execution: compile first, then run the validated IVM on the explicit-frame VM.
pub fn run(source: SourceFile, config: vm::VmConfig) -> Result<(CompileOutput, vm::VmResult), Vec<Diagnostic>> {
    let output = compile(source)?;
    let result = vm::run(&output.ivm, config).map_err(|error| vec![error])?;
    Ok((output, result))
}

/// Compiler-owned Wasm backend. The backend consumes validated IVM, never HIR directly.
pub fn build_wasm(source: SourceFile) -> Result<(CompileOutput, Vec<u8>), Vec<Diagnostic>> {
    let output = compile(source)?;
    let bytes = wasm::emit(&output.ivm).map_err(|error| vec![error])?;
    Ok((output, bytes))
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::hir::{HirExprKind, HirStmtKind};
    use super::ivm::{Op, I13_FRAME_LIMIT, OPCODE_COUNT};

    #[test]
    fn declaration_lowers_to_assign_name_constant() {
        let hir = front_end(SourceFile::new("test.i13", "I x <- 4\n")).unwrap();
        match &hir.statements[0].kind {
            HirStmtKind::Assign { declare, target, value, .. } => {
                assert!(*declare);
                assert_eq!(target, "x");
                assert!(matches!(&value.kind, HirExprKind::Constant(v) if *v == 4.0));
            }
            other => panic!("unexpected HIR: {other:?}"),
        }
    }

    #[test]
    fn arg_is_real_hir() {
        let hir = front_end(SourceFile::new(
            "test.i13",
            "def f(I a, I b) { -> a }\nI x <- f(1, 2)\n",
        )).unwrap();
        match &hir.statements[0].kind {
            HirStmtKind::FunctionDef { args, .. } => assert_eq!(args.len(), 2),
            other => panic!("unexpected HIR: {other:?}"),
        }
    }

    #[test]
    fn bad_arity_fails_before_execution() {
        let err = front_end(SourceFile::new(
            "test.i13",
            "def f(I a) { -> a }\nI x <- f(1, 2)\n",
        )).unwrap_err();
        assert!(err.iter().any(|d| d.code == DiagnosticCode::SemanticArityMismatch));
    }

    #[test]
    fn p_assignment_is_osmotic_not_attribute() {
        let output = compile(SourceFile::new("test.i13", "I x <- 1\nx.p <- 4\n")).unwrap();
        match &output.hir.statements[1].kind {
            HirStmtKind::Assign { osmotic, target, .. } => {
                assert!(*osmotic);
                assert_eq!(target, "x");
            }
            other => panic!("unexpected HIR: {other:?}"),
        }
        assert!(output.ivm.main.iter().any(|inst| inst.op == Op::Bin));
    }

    #[test]
    fn ordinary_attribute_fails_explicitly() {
        let err = front_end(SourceFile::new("test.i13", "I x <- y.a\n")).unwrap_err();
        assert!(err.iter().any(|d| d.code == DiagnosticCode::SemanticUnsupportedAttribute));
    }

    #[test]
    fn canonical_ivm_has_nineteen_ops_and_one_effect_law() {
        // 15 scalar ops + 3 aggregate ops (array) + 1 promotion op (ToBig, for bignum).
        assert_eq!(OPCODE_COUNT, 19);
        assert_eq!(Op::ToBig.effect(0).need, 1);
        assert_eq!(Op::ToBig.effect(0).net, 0);
        assert_eq!(Op::Const.effect(0).need, 0);
        assert_eq!(Op::Const.effect(0).net, 1);
        assert_eq!(Op::Call.effect(2).need, 3);
        assert_eq!(Op::Call.effect(2).net, -2);
        // the aggregate ops obey the same single effect law:
        assert_eq!(Op::MakeArray.effect(3).need, 3);
        assert_eq!(Op::MakeArray.effect(3).net, -2);
        assert_eq!(Op::Index.effect(0).need, 2);
        assert_eq!(Op::Index.effect(0).net, -1);
        assert_eq!(Op::ArraySet.effect(0).need, 3);
        assert_eq!(Op::ArraySet.effect(0).net, -2);
    }

    #[test]
    fn canonical_i13_frame_limit_is_4096_and_vm_enforces_it() {
        assert_eq!(I13_FRAME_LIMIT, 4096);
        let source = SourceFile::new(
            "frame-limit.i13",
            "def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }\nI OUT <- count(4095)\n",
        );
        let errors = run(source, vm::VmConfig::default()).unwrap_err();
        assert!(errors.iter().any(|d| d.code == DiagnosticCode::VmCallLimit));
    }

    #[test]
    fn reference_vm_executes_arithmetic() {
        let (output, result) = run(
            SourceFile::new("test.i13", "I x <- 4 + 2 * 3\n"),
            vm::VmConfig::default(),
        ).unwrap();
        assert_eq!(result.global_number(&output.ivm, "x"), Some(10.0));
    }

    #[test]
    fn reference_vm_recurses_without_host_recursion() {
        let source = SourceFile::new(
            "test.i13",
            "def count(I n) { if n <= 0 { -> 0 } -> 1 + count(n - 1) }\nI out <- count(64)\n",
        );
        let (output, result) = run(source, vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "out"), Some(64.0));
        assert!(result.max_call_depth >= 64);
    }

    #[test]
    fn protein_folding_n2_counts_all_collision_pairs() {
        let source = SourceFile::new(
            "bench/protein_folding/n2_collision_oracle.i13",
            include_str!("../../bench/protein_folding/n2_collision_oracle.i13"),
        );
        let (output, result) = run(source, vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "COLLISION_PAIRS"), Some(6.0));
        assert_eq!(result.global_number(&output.ivm, "BROKEN_BONDS"), Some(0.0));
        assert_eq!(result.global_number(&output.ivm, "ENERGY"), Some(60_000.0));
        assert_eq!(result.global_number(&output.ivm, "VERDICT"), Some(1.0));
    }

    #[test]
    fn spot_log_nests_dominant_frames_and_subordinate_spots() {
        // I = dominant frame (outside); i = subordinate spot (inside). A call opens a deeper I.
        let output = compile(SourceFile::new(
            "spotlog.i13",
            "def sq(I n) { -> n * n }\nI b <- sq(3)\n",
        )).unwrap();
        let mut log = spotlog::SpotLog::new();
        let mut observer = |event: &TraceEvent| log.observe(&output.ivm, event);
        let execution = vm::run_observed(&output.ivm, vm::VmConfig::default(), &mut observer).unwrap();
        let text = log.finish(execution.peak_stack);
        // the outermost dominant scope sits flush-left; a nested frame is entered deeper inside.
        assert!(text.contains("I  main   depth 0"));
        assert!(text.contains("I  ENTER fn0000:sq   depth 1"));
        assert!(text.contains("I  LEAVE fn0000:sq"));
        // subordinate spots are lowercase i and indented inside their frame.
        assert!(text.contains("\n   i  0001"));
        assert!(text.contains("balance held to the last spot"));
    }

    #[test]
    fn wasm_backend_emits_a_real_module() {
        let (_output, bytes) = build_wasm(SourceFile::new("test.i13", "I x <- 4 + 2 * 3\n")).unwrap();
        assert!(bytes.len() > 8);
        assert_eq!(&bytes[..4], b"\0asm");
        assert_eq!(&bytes[4..8], &[1, 0, 0, 0]);
        assert!(bytes.windows(b"i13_run".len()).any(|w| w == b"i13_run"));
        assert!(bytes.windows(b"i13.global.x".len()).any(|w| w == b"i13.global.x"));
    }

    #[test]
    fn wasm_backend_emits_numeric_modulo() {
        let source = SourceFile::new("modulo.i13", "I x <- 731 % 81\n");
        let (output, bytes) = build_wasm(source).unwrap();
        assert_eq!(output.ivm.globals, vec!["x"]);
        assert!(bytes.starts_with(b"\0asm"));
    }

    #[test]
    fn wasm_backend_emits_array_construction_and_reads() {
        let source = SourceFile::new("array.i13", "I a <- [3, 5, 8]\nI x <- a[1]\n");
        let (output, bytes) = build_wasm(source).unwrap();
        assert_eq!(output.ivm.globals, vec!["a", "x"]);
        assert!(bytes.starts_with(b"\0asm"));
    }

    #[test]
    fn wasm_backend_emits_array_set_with_reference_value_semantics() {
        let source = SourceFile::new(
            "bench/protein_folding/n3_array_cow.i13",
            include_str!("../../bench/protein_folding/n3_array_cow.i13"),
        );
        let (output, result) = run(source.clone(), vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "ORIGINAL_1"), Some(2.0));
        assert_eq!(result.global_number(&output.ivm, "ORIGINAL_3"), Some(4.0));
        assert_eq!(result.global_number(&output.ivm, "UPDATED_1"), Some(9.0));
        assert_eq!(result.global_number(&output.ivm, "UPDATED_3"), Some(7.0));
        assert_eq!(result.global_number(&output.ivm, "VERDICT"), Some(1.0));
        let (_, bytes) = build_wasm(source).unwrap();
        assert!(bytes.starts_with(b"\0asm"));
    }

    #[test]
    fn wasm_backend_emits_bounded_array_arena_growth() {
        let source = SourceFile::new(
            "bench/protein_folding/n4_arena_growth.i13",
            include_str!("../../bench/protein_folding/n4_arena_growth.i13"),
        );
        let (output, result) = run(source.clone(), vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "ORIGINAL_0"), Some(0.0));
        assert_eq!(result.global_number(&output.ivm, "FINAL_0"), Some(32.0));
        assert_eq!(result.global_number(&output.ivm, "FINAL_1"), Some(1.0));
        assert_eq!(result.global_number(&output.ivm, "FINAL_31"), Some(31.0));
        assert_eq!(result.global_number(&output.ivm, "VERDICT"), Some(1.0));
        let (_, bytes) = build_wasm(source).unwrap();
        assert!(bytes.starts_with(b"\0asm"));
        assert!(bytes.windows(b"i13_reset".len()).any(|w| w == b"i13_reset"));
        assert!(bytes.windows(b"i13.frame_depth".len()).any(|w| w == b"i13.frame_depth"));
        assert!(bytes.windows(b"i13.array_heap".len()).any(|w| w == b"i13.array_heap"));
    }

    #[test]
    fn core_example_executes_on_reference_vm_and_builds_wasm() {
        let source = SourceFile::new("examples/core.i13", include_str!("../../examples/core.i13"));
        let (output, result) = run(source.clone(), vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "CORE_OK"), Some(1.0));
        assert_eq!(result.global_number(&output.ivm, "ROUTES"), Some(56.0));

        let (_compiled, wasm) = build_wasm(source).unwrap();
        assert!(wasm.len() > 8);
        assert_eq!(&wasm[..4], b"\0asm");
    }
}
