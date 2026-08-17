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
    fn core_example_reaches_validated_ivm() {
        let source = SourceFile::new("examples/core.i13", include_str!("../../examples/core.i13"));
        let output = compile(source).unwrap();
        assert!(!output.ivm.main.is_empty());
        assert_eq!(output.validation.regions, 1 + output.ivm.functions.len());
    }
}
