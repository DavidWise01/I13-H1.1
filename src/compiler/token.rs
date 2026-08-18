use super::source::Span;

#[derive(Debug, Clone, PartialEq)]
pub enum TokenKind {
    I,
    Def,
    If,
    Ident(String),
    Number(f64),
    LBrace,
    RBrace,
    LParen,
    RParen,
    LBracket,
    RBracket,
    Comma,
    Dot,
    Bind,
    ReturnArrow,
    EqEq,
    NotEq,
    Lt,
    Lte,
    Gt,
    Gte,
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Amp,
    Pipe,
    Caret,
    Shl,
    Shr,
    Newline,
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}
