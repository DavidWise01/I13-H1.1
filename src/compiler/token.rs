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
    Newline,
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}
