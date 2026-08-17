use super::source::{SourceFile, Span};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticCode {
    LexUnexpectedCharacter,
    LexInvalidNumber,
    ParseExpected,
    ParseUnexpected,
    SemanticUnsupportedAttribute,
    SemanticUnknownFunction,
    SemanticArityMismatch,
    IvmUnboundName,
    IvmAssignUndeclared,
    IvmValidation,
    VmRuntime,
    VmStepLimit,
    VmCallLimit,
    WasmBackend,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticPhase {
    Lex,
    Parse,
    Semantic,
    Ivm,
    Validate,
    Runtime,
    Wasm,
}

impl DiagnosticPhase {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Lex => "lex",
            Self::Parse => "parse",
            Self::Semantic => "semantic",
            Self::Ivm => "ivm",
            Self::Validate => "validate",
            Self::Runtime => "runtime",
            Self::Wasm => "wasm",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticCategory {
    Syntax,
    Semantics,
    Validation,
    Execution,
    Resource,
    Backend,
}

impl DiagnosticCategory {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Syntax => "syntax",
            Self::Semantics => "semantics",
            Self::Validation => "validation",
            Self::Execution => "execution",
            Self::Resource => "resource",
            Self::Backend => "backend",
        }
    }
}

impl DiagnosticCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::LexUnexpectedCharacter => "E0001",
            Self::LexInvalidNumber => "E0002",
            Self::ParseExpected => "E0101",
            Self::ParseUnexpected => "E0102",
            Self::SemanticUnsupportedAttribute => "E0201",
            Self::SemanticUnknownFunction => "E0202",
            Self::SemanticArityMismatch => "E0203",
            Self::IvmUnboundName => "E0301",
            Self::IvmAssignUndeclared => "E0302",
            Self::IvmValidation => "E0401",
            Self::VmRuntime => "E0501",
            Self::VmStepLimit => "E0502",
            Self::VmCallLimit => "E0503",
            Self::WasmBackend => "E0601",
        }
    }

    pub fn phase(self) -> DiagnosticPhase {
        match self {
            Self::LexUnexpectedCharacter | Self::LexInvalidNumber => DiagnosticPhase::Lex,
            Self::ParseExpected | Self::ParseUnexpected => DiagnosticPhase::Parse,
            Self::SemanticUnsupportedAttribute
            | Self::SemanticUnknownFunction
            | Self::SemanticArityMismatch => DiagnosticPhase::Semantic,
            Self::IvmUnboundName | Self::IvmAssignUndeclared => DiagnosticPhase::Ivm,
            Self::IvmValidation => DiagnosticPhase::Validate,
            Self::VmRuntime | Self::VmStepLimit | Self::VmCallLimit => DiagnosticPhase::Runtime,
            Self::WasmBackend => DiagnosticPhase::Wasm,
        }
    }

    pub fn category(self) -> DiagnosticCategory {
        match self {
            Self::LexUnexpectedCharacter
            | Self::LexInvalidNumber
            | Self::ParseExpected
            | Self::ParseUnexpected => DiagnosticCategory::Syntax,
            Self::SemanticUnsupportedAttribute
            | Self::SemanticUnknownFunction
            | Self::SemanticArityMismatch
            | Self::IvmUnboundName
            | Self::IvmAssignUndeclared => DiagnosticCategory::Semantics,
            Self::IvmValidation => DiagnosticCategory::Validation,
            Self::VmRuntime => DiagnosticCategory::Execution,
            Self::VmStepLimit | Self::VmCallLimit => DiagnosticCategory::Resource,
            Self::WasmBackend => DiagnosticCategory::Backend,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub code: DiagnosticCode,
    pub message: String,
    pub span: Span,
}

impl Diagnostic {
    pub fn new(code: DiagnosticCode, message: impl Into<String>, span: Span) -> Self {
        Self { code, message: message.into(), span }
    }

    pub fn render(&self, source: &SourceFile) -> String {
        let code = self.code.as_str();
        let phase = self.code.phase().as_str();
        let category = self.code.category().as_str();
        let mut out = format!(
            "error[{code}] {phase}/{category}: {}\n --> {}:{}:{}",
            self.message, source.name, self.span.line, self.span.column
        );

        let Some(line) = source.line_for_span(&self.span) else {
            return out;
        };

        let gutter_width = line.number.to_string().len();
        let display_line = expand_tabs(line.text);
        let marker_prefix = marker_prefix(line.text, self.span.column);
        let marker_width = source.marker_width(&self.span);
        let marker = if marker_width <= 1 {
            "^".to_string()
        } else {
            format!("^{}", "~".repeat(marker_width - 1))
        };

        out.push_str(&format!(
            "\n{space:>width$} |\n{line_no:>width$} | {display_line}\n{space:>width$} | {marker_prefix}{marker}",
            space = "",
            width = gutter_width,
            line_no = line.number,
        ));
        out
    }
}

fn expand_tabs(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for ch in text.chars() {
        if ch == '\t' {
            out.push_str("    ");
        } else {
            out.push(ch);
        }
    }
    out
}

fn marker_prefix(text: &str, source_column: usize) -> String {
    let mut out = String::new();
    for ch in text.chars().take(source_column.saturating_sub(1)) {
        if ch == '\t' {
            out.push_str("    ");
        } else {
            out.push(' ');
        }
    }
    out
}
