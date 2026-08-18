use super::{
    ast::{AssignTarget, BinaryOp, CompareOp, Expr, ExprKind, Param, Program, Stmt, StmtKind},
    diagnostic::{Diagnostic, DiagnosticCode},
    lexer,
    source::{SourceFile, Span},
    token::{Token, TokenKind},
};

pub fn parse(source: &SourceFile) -> Result<Program, Vec<Diagnostic>> {
    let tokens = lexer::lex(source)?;
    parse_tokens(source, tokens)
}

pub fn parse_tokens(_source: &SourceFile, tokens: Vec<Token>) -> Result<Program, Vec<Diagnostic>> {
    Parser { tokens, pos: 0, errors: Vec::new() }.program()
}

struct Parser {
    tokens: Vec<Token>,
    pos: usize,
    errors: Vec<Diagnostic>,
}

impl Parser {
    fn program(mut self) -> Result<Program, Vec<Diagnostic>> {
        let mut statements = Vec::new();
        self.skip_newlines();
        while !self.at_eof() {
            match self.statement() {
                Some(stmt) => statements.push(stmt),
                None => self.synchronize(),
            }
            self.skip_newlines();
        }
        if self.errors.is_empty() { Ok(Program { statements }) } else { Err(self.errors) }
    }

    fn statement(&mut self) -> Option<Stmt> {
        if self.matches(|k| matches!(k, TokenKind::Def)) { return self.function_def(); }
        if self.matches(|k| matches!(k, TokenKind::If)) { return self.if_stmt(); }
        if self.matches(|k| matches!(k, TokenKind::I)) { return self.declare_stmt(); }
        if self.matches(|k| matches!(k, TokenKind::ReturnArrow)) { return self.return_stmt(); }
        if self.looks_like_assignment() { return self.assign_stmt(); }
        self.expr_stmt()
    }

    fn function_def(&mut self) -> Option<Stmt> {
        let start = self.previous().span.clone();
        let (name, _) = self.expect_ident("expected function name after `def`")?;
        self.expect_simple(|k| matches!(k, TokenKind::LParen), "expected `(` after function name")?;
        let mut params = Vec::new();
        self.skip_newlines();
        if !self.check(|k| matches!(k, TokenKind::RParen)) {
            loop {
                self.expect_simple(|k| matches!(k, TokenKind::I), "expected `I` before parameter")?;
                let (name, span) = self.expect_ident("expected parameter name")?;
                params.push(Param { name, span });
                self.skip_newlines();
                if !self.matches(|k| matches!(k, TokenKind::Comma)) { break; }
                self.skip_newlines();
            }
        }
        self.expect_simple(|k| matches!(k, TokenKind::RParen), "expected `)` after parameters")?;
        let (body, end) = self.block()?;
        Some(Stmt { kind: StmtKind::FunctionDef { name, params, body }, span: start.join(&end) })
    }

    fn if_stmt(&mut self) -> Option<Stmt> {
        let start = self.previous().span.clone();
        let condition = self.expression(0)?;
        let (body, end) = self.block()?;
        Some(Stmt { kind: StmtKind::If { condition, body }, span: start.join(&end) })
    }

    fn declare_stmt(&mut self) -> Option<Stmt> {
        let start = self.previous().span.clone();
        let (name, _) = self.expect_ident("expected name after `I`")?;
        self.expect_simple(|k| matches!(k, TokenKind::Bind), "expected `<-` in declaration")?;
        let value = self.expression(0)?;
        let span = start.join(&value.span);
        Some(Stmt { kind: StmtKind::Declare { name, value }, span })
    }

    fn return_stmt(&mut self) -> Option<Stmt> {
        let start = self.previous().span.clone();
        let expr = self.expression(0)?;
        let span = start.join(&expr.span);
        Some(Stmt { kind: StmtKind::Return(expr), span })
    }

    fn assign_stmt(&mut self) -> Option<Stmt> {
        let (name, start_span) = self.expect_ident("expected assignment target")?;
        let mut attribute = None;
        let mut end_span = start_span.clone();
        if self.matches(|k| matches!(k, TokenKind::Dot)) {
            let (attr, span) = self.expect_ident("expected attribute after `.`")?;
            attribute = Some(attr);
            end_span = span;
        }
        self.expect_simple(|k| matches!(k, TokenKind::Bind), "expected `<-` in assignment")?;
        let value = self.expression(0)?;
        let target = AssignTarget { name, attribute, span: start_span.join(&end_span) };
        let span = target.span.join(&value.span);
        Some(Stmt { kind: StmtKind::Assign { target, value }, span })
    }

    fn expr_stmt(&mut self) -> Option<Stmt> {
        let expr = self.expression(0)?;
        let span = expr.span.clone();
        Some(Stmt { kind: StmtKind::Expr(expr), span })
    }

    fn block(&mut self) -> Option<(Vec<Stmt>, Span)> {
        self.skip_newlines();
        self.expect_simple(|k| matches!(k, TokenKind::LBrace), "expected `{`")?;
        self.skip_newlines();
        let mut body = Vec::new();
        while !self.at_eof() && !self.check(|k| matches!(k, TokenKind::RBrace)) {
            if let Some(stmt) = self.statement() { body.push(stmt); } else { self.synchronize(); }
            self.skip_newlines();
        }
        let end = self.expect_simple(|k| matches!(k, TokenKind::RBrace), "expected `}` to close block")?;
        Some((body, end))
    }

    fn expression(&mut self, min_prec: u8) -> Option<Expr> {
        let mut left = self.primary()?;
        loop {
            let Some((prec, binary, compare)) = self.infix_info() else { break; };
            if prec < min_prec { break; }
            self.advance();
            let right = self.expression(prec + 1)?;
            let span = left.span.join(&right.span);
            let kind = if let Some(op) = binary {
                ExprKind::Binary { left: Box::new(left), op, right: Box::new(right) }
            } else {
                ExprKind::Compare { left: Box::new(left), op: compare.unwrap(), right: Box::new(right) }
            };
            left = Expr { kind, span };
        }
        Some(left)
    }

    fn primary(&mut self) -> Option<Expr> {
        let token = self.advance().clone();
        let mut expr = match token.kind {
            TokenKind::Number(v) => Expr { kind: ExprKind::Number(v), span: token.span },
            TokenKind::Ident(name) => Expr { kind: ExprKind::Name(name), span: token.span },
            TokenKind::Minus => {
                let right = self.primary()?;
                let zero = Expr { kind: ExprKind::Number(0.0), span: token.span.clone() };
                let span = token.span.join(&right.span);
                Expr { kind: ExprKind::Binary { left: Box::new(zero), op: BinaryOp::Sub, right: Box::new(right) }, span }
            }
            TokenKind::LParen => {
                let expr = self.expression(0)?;
                self.expect_simple(|k| matches!(k, TokenKind::RParen), "expected `)`")?;
                expr
            }
            _ => {
                self.errors.push(Diagnostic::new(DiagnosticCode::ParseUnexpected, "expected expression", token.span));
                return None;
            }
        };

        loop {
            if self.matches(|k| matches!(k, TokenKind::LParen)) {
                let callee = match &expr.kind {
                    ExprKind::Name(name) => name.clone(),
                    _ => {
                        self.errors.push(Diagnostic::new(DiagnosticCode::ParseUnexpected, "only named functions are callable in I13 v0.1", expr.span.clone()));
                        return None;
                    }
                };
                let mut args = Vec::new();
                self.skip_newlines();
                if !self.check(|k| matches!(k, TokenKind::RParen)) {
                    loop {
                        args.push(self.expression(0)?);
                        self.skip_newlines();
                        if !self.matches(|k| matches!(k, TokenKind::Comma)) { break; }
                        self.skip_newlines();
                    }
                }
                let end = self.expect_simple(|k| matches!(k, TokenKind::RParen), "expected `)` after arguments")?;
                let span = expr.span.join(&end);
                expr = Expr { kind: ExprKind::Call { callee, args }, span };
                continue;
            }
            if self.matches(|k| matches!(k, TokenKind::Dot)) {
                let (name, end) = self.expect_ident("expected attribute name after `.`")?;
                let span = expr.span.join(&end);
                expr = Expr { kind: ExprKind::Attribute { base: Box::new(expr), name }, span };
                continue;
            }
            break;
        }
        Some(expr)
    }

    fn infix_info(&self) -> Option<(u8, Option<BinaryOp>, Option<CompareOp>)> {
        match &self.peek().kind {
            TokenKind::EqEq => Some((1, None, Some(CompareOp::Eq))),
            TokenKind::NotEq => Some((1, None, Some(CompareOp::Ne))),
            TokenKind::Lt => Some((1, None, Some(CompareOp::Lt))),
            TokenKind::Lte => Some((1, None, Some(CompareOp::Lte))),
            TokenKind::Gt => Some((1, None, Some(CompareOp::Gt))),
            TokenKind::Gte => Some((1, None, Some(CompareOp::Gte))),
            TokenKind::Plus => Some((2, Some(BinaryOp::Add), None)),
            TokenKind::Minus => Some((2, Some(BinaryOp::Sub), None)),
            TokenKind::Star => Some((3, Some(BinaryOp::Mul), None)),
            TokenKind::Slash => Some((3, Some(BinaryOp::Div), None)),
            TokenKind::Percent => Some((3, Some(BinaryOp::Mod), None)),
            TokenKind::Shl => Some((3, Some(BinaryOp::Shl), None)),
            TokenKind::Shr => Some((3, Some(BinaryOp::Shr), None)),
            TokenKind::Amp => Some((2, Some(BinaryOp::And), None)),
            TokenKind::Caret => Some((2, Some(BinaryOp::Xor), None)),
            TokenKind::Pipe => Some((2, Some(BinaryOp::Or), None)),
            _ => None,
        }
    }

    fn looks_like_assignment(&self) -> bool {
        if !matches!(&self.peek().kind, TokenKind::Ident(_)) { return false; }
        match self.tokens.get(self.pos + 1).map(|t| &t.kind) {
            Some(TokenKind::Bind) => true,
            Some(TokenKind::Dot) => matches!(
                (self.tokens.get(self.pos + 2).map(|t| &t.kind), self.tokens.get(self.pos + 3).map(|t| &t.kind)),
                (Some(TokenKind::Ident(_)), Some(TokenKind::Bind))
            ),
            _ => false,
        }
    }

    fn synchronize(&mut self) {
        while !self.at_eof() {
            if matches!(&self.peek().kind, TokenKind::Newline | TokenKind::RBrace) { break; }
            self.advance();
        }
    }

    fn skip_newlines(&mut self) { while self.matches(|k| matches!(k, TokenKind::Newline)) {} }
    fn at_eof(&self) -> bool { matches!(&self.peek().kind, TokenKind::Eof) }
    fn peek(&self) -> &Token { &self.tokens[self.pos] }
    fn previous(&self) -> &Token { &self.tokens[self.pos - 1] }
    fn advance(&mut self) -> &Token { if !self.at_eof() { self.pos += 1; } &self.tokens[self.pos.saturating_sub(1)] }
    fn check(&self, f: impl FnOnce(&TokenKind) -> bool) -> bool { f(&self.peek().kind) }
    fn matches(&mut self, f: impl FnOnce(&TokenKind) -> bool) -> bool { if f(&self.peek().kind) { self.advance(); true } else { false } }

    fn expect_simple(&mut self, f: impl FnOnce(&TokenKind) -> bool, message: &str) -> Option<Span> {
        if f(&self.peek().kind) { return Some(self.advance().span.clone()); }
        let span = self.peek().span.clone();
        self.errors.push(Diagnostic::new(DiagnosticCode::ParseExpected, message, span));
        None
    }

    fn expect_ident(&mut self, message: &str) -> Option<(String, Span)> {
        let token = self.peek().clone();
        if let TokenKind::Ident(name) = token.kind {
            self.advance();
            Some((name, token.span))
        } else {
            self.errors.push(Diagnostic::new(DiagnosticCode::ParseExpected, message, token.span));
            None
        }
    }
}
