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
