#[path = "../src/compiler/mod.rs"]
mod compiler;

use compiler::{compile, run, DiagnosticCode, SourceFile};
use compiler::diagnostic::{DiagnosticCategory, DiagnosticPhase};
use compiler::vm::VmConfig;

#[test]
fn lexical_diagnostic_renders_stable_source_excerpt() {
    let source = SourceFile::new("diag.i13", "I x <- 1\nI y <- @\n");
    let errors = compile(source.clone()).unwrap_err();
    let error = &errors[0];

    assert_eq!(error.code, DiagnosticCode::LexUnexpectedCharacter);
    assert_eq!(error.code.phase(), DiagnosticPhase::Lex);
    assert_eq!(error.code.category(), DiagnosticCategory::Syntax);

    let rendered = error.render(&source);
    assert!(rendered.contains("error[E0001] lex/syntax:"));
    assert!(rendered.contains("--> diag.i13:2:8"));
    assert!(rendered.contains("2 | I y <- @"));
    assert!(rendered.contains("|        ^"));
}

#[test]
fn semantic_diagnostic_keeps_call_span_and_category() {
    let source = SourceFile::new(
        "arity.i13",
        "def f(I a) { -> a }\nI OUT <- f(1, 2)\n",
    );
    let errors = compile(source.clone()).unwrap_err();
    let error = errors
        .iter()
        .find(|error| error.code == DiagnosticCode::SemanticArityMismatch)
        .expect("arity mismatch diagnostic");

    assert_eq!(error.code.phase(), DiagnosticPhase::Semantic);
    assert_eq!(error.code.category(), DiagnosticCategory::Semantics);
    let rendered = error.render(&source);
    assert!(rendered.contains("error[E0203] semantic/semantics:"));
    assert!(rendered.contains("--> arity.i13:2:"));
    assert!(rendered.contains("2 | I OUT <- f(1, 2)"));
    assert!(rendered.contains('^'));
}

#[test]
fn runtime_diagnostic_maps_back_to_source() {
    let source = SourceFile::new("runtime.i13", "I x <- 1\nI OUT <- 4 / 0\n");
    let errors = run(source.clone(), VmConfig::default()).unwrap_err();
    let error = &errors[0];

    assert_eq!(error.code, DiagnosticCode::VmRuntime);
    assert_eq!(error.code.phase(), DiagnosticPhase::Runtime);
    assert_eq!(error.code.category(), DiagnosticCategory::Execution);
    let rendered = error.render(&source);
    assert!(rendered.contains("error[E0501] runtime/execution: division by zero"));
    assert!(rendered.contains("--> runtime.i13:2:"));
    assert!(rendered.contains("2 | I OUT <- 4 / 0"));
}

#[test]
fn resource_and_backend_categories_are_not_conflated() {
    assert_eq!(DiagnosticCode::VmStepLimit.phase(), DiagnosticPhase::Runtime);
    assert_eq!(DiagnosticCode::VmStepLimit.category(), DiagnosticCategory::Resource);
    assert_eq!(DiagnosticCode::VmCallLimit.phase(), DiagnosticPhase::Runtime);
    assert_eq!(DiagnosticCode::VmCallLimit.category(), DiagnosticCategory::Resource);
    assert_eq!(DiagnosticCode::WasmBackend.phase(), DiagnosticPhase::Wasm);
    assert_eq!(DiagnosticCode::WasmBackend.category(), DiagnosticCategory::Backend);
}

#[test]
fn source_line_mapping_handles_crlf_and_zero_width_eof() {
    let source = SourceFile::new("lines.i13", "I a <- 1\r\nI b <- 2\r\n");
    let line2 = source.line(2).expect("line 2");
    assert_eq!(line2.text, "I b <- 2");
    assert_eq!(line2.number, 2);

    let eof = compiler::Span::new(source.text.len(), source.text.len(), 3, 1);
    assert_eq!(source.marker_width(&eof), 1);
}
