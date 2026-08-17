//! I13 compiler construction spine.
//!
//! Canonical authority: SPEC -> HIR -> IVM.
//! This module intentionally does not depend on E1, corpus, UI, or other
//! referent-only subsystems.

pub mod ast;
pub mod diagnostic;
pub mod hir;
pub mod ivm;
pub mod lexer;
pub mod lower_ivm;
pub mod parser;
pub mod semantic;
pub mod source;
pub mod token;
pub mod validator;
pub mod vm;

pub use diagnostic::{Diagnostic, DiagnosticCode};
pub use hir::HirProgram;
pub use parser::parse;
pub use semantic::check;
pub use source::{SourceFile, Span};

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

#[cfg(test)]
mod tests {
    use super::*;
    use super::hir::{HirExprKind, HirStmtKind};
    use super::ivm::{Op, OPCODE_COUNT};

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
    fn canonical_ivm_has_fifteen_ops_and_one_effect_law() {
        assert_eq!(OPCODE_COUNT, 15);
        assert_eq!(Op::Const.effect(0).need, 0);
        assert_eq!(Op::Const.effect(0).net, 1);
        assert_eq!(Op::Call.effect(2).need, 3);
        assert_eq!(Op::Call.effect(2).net, -2);
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
    fn core_example_executes_on_reference_vm() {
        let source = SourceFile::new("examples/core.i13", include_str!("../../examples/core.i13"));
        let (output, result) = run(source, vm::VmConfig::default()).unwrap();
        assert_eq!(result.global_number(&output.ivm, "CORE_OK"), Some(1.0));
        assert_eq!(result.global_number(&output.ivm, "ROUTES"), Some(56.0));
    }
}
