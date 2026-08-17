use super::source::Span;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticCode {
    LexUnexpectedCharacter,
    LexInvalidNumber,
    ParseExpected,
    ParseUnexpected,
    SemanticUnsupportedAttribute,
    SemanticUnknownFunction,
    SemanticArityMismatch,
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
}
