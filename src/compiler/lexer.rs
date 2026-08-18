use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    source::{SourceFile, Span},
    token::{Token, TokenKind},
};

pub fn lex(source: &SourceFile) -> Result<Vec<Token>, Vec<Diagnostic>> {
    let bytes = source.text.as_bytes();
    let mut out = Vec::new();
    let mut errors = Vec::new();
    let mut i = 0usize;
    let mut line = 1usize;
    let mut col = 1usize;

    while i < bytes.len() {
        let b = bytes[i];
        match b {
            b' ' | b'\t' | b'\r' => { i += 1; col += 1; }
            b'\n' => {
                out.push(Token { kind: TokenKind::Newline, span: Span::new(i, i + 1, line, col) });
                i += 1; line += 1; col = 1;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2; col += 2;
                while i < bytes.len() && bytes[i] != b'\n' { i += 1; col += 1; }
            }
            b'{' => single(&mut out, TokenKind::LBrace, i, line, col, &mut i, &mut col),
            b'}' => single(&mut out, TokenKind::RBrace, i, line, col, &mut i, &mut col),
            b'(' => single(&mut out, TokenKind::LParen, i, line, col, &mut i, &mut col),
            b')' => single(&mut out, TokenKind::RParen, i, line, col, &mut i, &mut col),
            b',' => single(&mut out, TokenKind::Comma, i, line, col, &mut i, &mut col),
            b'.' => single(&mut out, TokenKind::Dot, i, line, col, &mut i, &mut col),
            b'+' => single(&mut out, TokenKind::Plus, i, line, col, &mut i, &mut col),
            b'*' => single(&mut out, TokenKind::Star, i, line, col, &mut i, &mut col),
            b'/' => single(&mut out, TokenKind::Slash, i, line, col, &mut i, &mut col),
            b'%' => single(&mut out, TokenKind::Percent, i, line, col, &mut i, &mut col),
            b'<' if i + 1 < bytes.len() && bytes[i + 1] == b'-' => pair(&mut out, TokenKind::Bind, i, line, col, &mut i, &mut col),
            b'-' if i + 1 < bytes.len() && bytes[i + 1] == b'>' => pair(&mut out, TokenKind::ReturnArrow, i, line, col, &mut i, &mut col),
            b'=' if i + 1 < bytes.len() && bytes[i + 1] == b'=' => pair(&mut out, TokenKind::EqEq, i, line, col, &mut i, &mut col),
            b'!' if i + 1 < bytes.len() && bytes[i + 1] == b'=' => pair(&mut out, TokenKind::NotEq, i, line, col, &mut i, &mut col),
            b'<' if i + 1 < bytes.len() && bytes[i + 1] == b'=' => pair(&mut out, TokenKind::Lte, i, line, col, &mut i, &mut col),
            b'>' if i + 1 < bytes.len() && bytes[i + 1] == b'=' => pair(&mut out, TokenKind::Gte, i, line, col, &mut i, &mut col),
            b'<' => single(&mut out, TokenKind::Lt, i, line, col, &mut i, &mut col),
            b'>' => single(&mut out, TokenKind::Gt, i, line, col, &mut i, &mut col),
            b'-' => single(&mut out, TokenKind::Minus, i, line, col, &mut i, &mut col),
            b'0'..=b'9' => {
                let start = i;
                let start_col = col;
                while i < bytes.len() && bytes[i].is_ascii_digit() { i += 1; col += 1; }
                if i < bytes.len() && bytes[i] == b'.' && i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit() {
                    i += 1; col += 1;
                    while i < bytes.len() && bytes[i].is_ascii_digit() { i += 1; col += 1; }
                }
                let text = &source.text[start..i];
                match text.parse::<f64>() {
                    Ok(value) => out.push(Token { kind: TokenKind::Number(value), span: Span::new(start, i, line, start_col) }),
                    Err(_) => errors.push(Diagnostic::new(DiagnosticCode::LexInvalidNumber, format!("invalid number `{text}`"), Span::new(start, i, line, start_col))),
                }
            }
            _ if is_ident_start(b) => {
                let start = i;
                let start_col = col;
                i += 1; col += 1;
                while i < bytes.len() && is_ident_continue(bytes[i]) { i += 1; col += 1; }
                let text = &source.text[start..i];
                let kind = match text {
                    "I" => TokenKind::I,
                    "def" => TokenKind::Def,
                    "if" => TokenKind::If,
                    _ => TokenKind::Ident(text.to_string()),
                };
                out.push(Token { kind, span: Span::new(start, i, line, start_col) });
            }
            _ => {
                errors.push(Diagnostic::new(DiagnosticCode::LexUnexpectedCharacter, format!("unexpected character `{}`", b as char), Span::new(i, i + 1, line, col)));
                i += 1; col += 1;
            }
        }
    }

    out.push(Token { kind: TokenKind::Eof, span: Span::new(i, i, line, col) });
    if errors.is_empty() { Ok(out) } else { Err(errors) }
}

fn is_ident_start(b: u8) -> bool { b.is_ascii_alphabetic() || b == b'_' }
fn is_ident_continue(b: u8) -> bool { is_ident_start(b) || b.is_ascii_digit() }

fn single(out: &mut Vec<Token>, kind: TokenKind, at: usize, line: usize, col: usize, i: &mut usize, c: &mut usize) {
    out.push(Token { kind, span: Span::new(at, at + 1, line, col) });
    *i += 1; *c += 1;
}

fn pair(out: &mut Vec<Token>, kind: TokenKind, at: usize, line: usize, col: usize, i: &mut usize, c: &mut usize) {
    out.push(Token { kind, span: Span::new(at, at + 2, line, col) });
    *i += 2; *c += 2;
}
