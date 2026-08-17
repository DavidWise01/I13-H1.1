//! I13 compiler construction spine.
//!
//! Canonical authority: SPEC -> HIR -> IVM.
//! This module intentionally does not depend on E1, corpus, UI, or other
//! referent-only subsystems.

pub mod ast;
pub mod diagnostic;
pub mod hir;
pub mod lexer;
pub mod parser;
pub mod semantic;
pub mod source;
pub mod token;

pub use diagnostic::{Diagnostic, DiagnosticCode};
pub use hir::HirProgram;
pub use parser::parse;
pub use semantic::check;
pub use source::{SourceFile, Span};

/// Front-end vertical slice: source -> tokens -> AST -> HIR -> semantic check.
pub fn front_end(source: SourceFile) -> Result<HirProgram, Vec<Diagnostic>> {
    let tokens = lexer::lex(&source)?;
    let ast = parser::parse_tokens(&source, tokens)?;
    let hir = hir::lower(ast);
    semantic::check(&hir)?;
    Ok(hir)
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::hir::{HirExprKind, HirStmtKind};

    #[test]
    fn declaration_lowers_to_assign_name_constant() {
        let hir = front_end(SourceFile::new("test.i13", "I x <- 4\n")).unwrap();
        match &hir.statements[0].kind {
            HirStmtKind::Assign { declare, target, value, .. } => {
                assert!(*declare);
                assert_eq!(target, "x");
                assert!(matches!(value.kind, HirExprKind::Constant(v) if v == 4.0));
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
        let hir = front_end(SourceFile::new("test.i13", "I x <- 1\nx.p <- 4\n")).unwrap();
        match &hir.statements[1].kind {
            HirStmtKind::Assign { osmotic, target, .. } => {
                assert!(*osmotic);
                assert_eq!(target, "x");
            }
            other => panic!("unexpected HIR: {other:?}"),
        }
    }

    #[test]
    fn ordinary_attribute_fails_explicitly() {
        let err = front_end(SourceFile::new("test.i13", "I x <- y.a\n")).unwrap_err();
        assert!(err.iter().any(|d| d.code == DiagnosticCode::SemanticUnsupportedAttribute));
    }

    #[test]
    fn core_example_is_a_front_end_acceptance_program() {
        let source = SourceFile::new("examples/core.i13", include_str!("../../examples/core.i13"));
        let hir = front_end(source).unwrap();
        assert!(!hir.statements.is_empty());
    }
}
