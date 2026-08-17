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
    IvmUnboundName,
    IvmAssignUndeclared,
    IvmValidation,
    VmRuntime,
    VmStepLimit,
    VmCallLimit,
    WasmBackend,
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
