use std::fmt::Write;

use super::{
    ast::{self, BinaryOp, CompareOp, Expr, ExprKind, Stmt, StmtKind},
    diagnostic::Diagnostic,
    hir::{self, HirExpr, HirExprKind, HirProgram, HirStmt, HirStmtKind},
    ivm::{self, Inst, IvmProgram, Op},
    lexer, parser, semantic,
    source::{SourceFile, Span},
    token::{Token, TokenKind},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DumpKind {
    Tokens,
    Ast,
    Hir,
    Ivm,
}

impl DumpKind {
    pub fn from_flag(flag: &str) -> Option<Self> {
        match flag {
            "--tokens" => Some(Self::Tokens),
            "--ast" => Some(Self::Ast),
            "--hir" => Some(Self::Hir),
            "--ivm" => Some(Self::Ivm),
            _ => None,
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Tokens => "TOKENS",
            Self::Ast => "AST",
            Self::Hir => "HIR",
            Self::Ivm => "IVM",
        }
    }
}

/// Read-only compiler introspection. Each target stops at the named compiler
/// layer; later layers are never consulted to manufacture an earlier dump.
pub fn dump(source: &SourceFile, kind: DumpKind) -> Result<String, Vec<Diagnostic>> {
    match kind {
        DumpKind::Tokens => {
            let tokens = lexer::lex(source)?;
            Ok(dump_tokens(&tokens))
        }
        DumpKind::Ast => {
            let program = parser::parse(source)?;
            Ok(dump_ast(&program))
        }
        DumpKind::Hir => {
            let program = parser::parse(source)?;
            let hir = hir::lower(program);
            semantic::check(&hir)?;
            Ok(dump_hir(&hir))
        }
        DumpKind::Ivm => {
            let output = super::compile(source.clone())?;
            Ok(dump_ivm(&output.ivm))
        }
    }
}

pub fn dump_tokens(tokens: &[Token]) -> String {
    let mut out = String::from("I13 INTROSPECT TOKENS v0.1\n");
    for (index, token) in tokens.iter().enumerate() {
        let _ = writeln!(
            out,
            "{index:04} {:<22} {}",
            token_text(&token.kind),
            span_text(&token.span),
        );
    }
    out
}

pub fn dump_ast(program: &ast::Program) -> String {
    let mut out = String::from("I13 INTROSPECT AST v0.1\nProgram\n");
    for stmt in &program.statements {
        ast_stmt(&mut out, stmt, 1);
    }
    out
}

pub fn dump_hir(program: &HirProgram) -> String {
    let mut out = String::from("I13 INTROSPECT HIR v0.1\nProgram\n");
    for stmt in &program.statements {
        hir_stmt(&mut out, stmt, 1);
    }
    out
}

pub fn dump_ivm(program: &IvmProgram) -> String {
    let mut out = String::from("I13 INTROSPECT IVM v0.1\n");
    let _ = writeln!(out, "frame_limit {}", ivm::I13_FRAME_LIMIT);
    let _ = writeln!(out, "globals {}", program.globals.len());
    for (slot, name) in program.globals.iter().enumerate() {
        let _ = writeln!(out, "  g{slot:04} {name}");
    }

    let _ = writeln!(out, "main {}", program.main.len());
    for (pc, inst) in program.main.iter().enumerate() {
        ivm_inst(&mut out, program, None, pc, inst, 1);
    }

    let _ = writeln!(out, "functions {}", program.functions.len());
    for (fid, function) in program.functions.iter().enumerate() {
        let _ = writeln!(
            out,
            "  fn{fid:04} {} params=[{}] locals={} code={}",
            function.name,
            function.params.join(","),
            function.local_count,
            function.code.len(),
        );
        for (pc, inst) in function.code.iter().enumerate() {
            ivm_inst(&mut out, program, Some(fid), pc, inst, 2);
        }
    }
    out
}

fn ast_stmt(out: &mut String, stmt: &Stmt, depth: usize) {
    let pad = indent(depth);
    match &stmt.kind {
        StmtKind::Declare { name, value } => {
            let _ = writeln!(out, "{pad}Declare {name} {}", span_text(&stmt.span));
            ast_expr(out, value, depth + 1);
        }
        StmtKind::Assign { target, value } => {
            let suffix = target.attribute.as_ref().map(|a| format!(".{a}")).unwrap_or_default();
            let _ = writeln!(out, "{pad}Assign {}{suffix} {}", target.name, span_text(&stmt.span));
            ast_expr(out, value, depth + 1);
        }
        StmtKind::Return(expr) => {
            let _ = writeln!(out, "{pad}Return {}", span_text(&stmt.span));
            ast_expr(out, expr, depth + 1);
        }
        StmtKind::Expr(expr) => {
            let _ = writeln!(out, "{pad}Expr {}", span_text(&stmt.span));
            ast_expr(out, expr, depth + 1);
        }
        StmtKind::If { condition, body } => {
            let _ = writeln!(out, "{pad}If {}", span_text(&stmt.span));
            let _ = writeln!(out, "{}condition", indent(depth + 1));
            ast_expr(out, condition, depth + 2);
            let _ = writeln!(out, "{}body", indent(depth + 1));
            for nested in body { ast_stmt(out, nested, depth + 2); }
        }
        StmtKind::FunctionDef { name, params, body } => {
            let names = params.iter().map(|p| p.name.as_str()).collect::<Vec<_>>().join(",");
            let _ = writeln!(out, "{pad}FunctionDef {name} params=[{names}] {}", span_text(&stmt.span));
            for nested in body { ast_stmt(out, nested, depth + 1); }
        }
    }
}

fn ast_expr(out: &mut String, expr: &Expr, depth: usize) {
    let pad = indent(depth);
    match &expr.kind {
        ExprKind::Number(value) => { let _ = writeln!(out, "{pad}Number {} {}", number(*value), span_text(&expr.span)); }
        ExprKind::Name(name) => { let _ = writeln!(out, "{pad}Name {name} {}", span_text(&expr.span)); }
        ExprKind::Attribute { base, name } => {
            let _ = writeln!(out, "{pad}Attribute .{name} {}", span_text(&expr.span));
            ast_expr(out, base, depth + 1);
        }
        ExprKind::Binary { left, op, right } => {
            let _ = writeln!(out, "{pad}Binary {} {}", binary_name(*op), span_text(&expr.span));
            ast_expr(out, left, depth + 1);
            ast_expr(out, right, depth + 1);
        }
        ExprKind::Compare { left, op, right } => {
            let _ = writeln!(out, "{pad}Compare {} {}", compare_name(*op), span_text(&expr.span));
            ast_expr(out, left, depth + 1);
            ast_expr(out, right, depth + 1);
        }
        ExprKind::Call { callee, args } => {
            let _ = writeln!(out, "{pad}Call {callee} argc={} {}", args.len(), span_text(&expr.span));
            for arg in args { ast_expr(out, arg, depth + 1); }
        }
    }
}

fn hir_stmt(out: &mut String, stmt: &HirStmt, depth: usize) {
    let pad = indent(depth);
    match &stmt.kind {
        HirStmtKind::Assign { declare, osmotic, target, attribute, value } => {
            let mode = if *declare { "declare" } else if *osmotic { "osmotic" } else { "assign" };
            let suffix = attribute.as_ref().map(|a| format!(".{a}")).unwrap_or_default();
            let _ = writeln!(out, "{pad}Assign mode={mode} target={target}{suffix} {}", span_text(&stmt.span));
            hir_expr(out, value, depth + 1);
        }
        HirStmtKind::Return(expr) => {
            let _ = writeln!(out, "{pad}Return {}", span_text(&stmt.span));
            hir_expr(out, expr, depth + 1);
        }
        HirStmtKind::Expr(expr) => {
            let _ = writeln!(out, "{pad}Expr {}", span_text(&stmt.span));
            hir_expr(out, expr, depth + 1);
        }
        HirStmtKind::If { condition, body } => {
            let _ = writeln!(out, "{pad}If {}", span_text(&stmt.span));
            let _ = writeln!(out, "{}condition", indent(depth + 1));
            hir_expr(out, condition, depth + 2);
            let _ = writeln!(out, "{}body", indent(depth + 1));
            for nested in body { hir_stmt(out, nested, depth + 2); }
        }
        HirStmtKind::FunctionDef { name, args, body } => {
            let names = args.iter().map(|a| a.name.as_str()).collect::<Vec<_>>().join(",");
            let _ = writeln!(out, "{pad}FunctionDef {name} args=[{names}] {}", span_text(&stmt.span));
            for nested in body { hir_stmt(out, nested, depth + 1); }
        }
    }
}

fn hir_expr(out: &mut String, expr: &HirExpr, depth: usize) {
    let pad = indent(depth);
    match &expr.kind {
        HirExprKind::Name(name) => { let _ = writeln!(out, "{pad}Name {name} {}", span_text(&expr.span)); }
        HirExprKind::Constant(value) => { let _ = writeln!(out, "{pad}Constant {} {}", number(*value), span_text(&expr.span)); }
        HirExprKind::Attribute { base, name } => {
            let _ = writeln!(out, "{pad}Attribute .{name} {}", span_text(&expr.span));
            hir_expr(out, base, depth + 1);
        }
        HirExprKind::BinOp { left, op, right } => {
            let _ = writeln!(out, "{pad}BinOp {} {}", binary_name(*op), span_text(&expr.span));
            hir_expr(out, left, depth + 1);
            hir_expr(out, right, depth + 1);
        }
        HirExprKind::Compare { left, op, right } => {
            let _ = writeln!(out, "{pad}Compare {} {}", compare_name(*op), span_text(&expr.span));
            hir_expr(out, left, depth + 1);
            hir_expr(out, right, depth + 1);
        }
        HirExprKind::Call { callee, args } => {
            let _ = writeln!(out, "{pad}Call {callee} argc={} {}", args.len(), span_text(&expr.span));
            for arg in args { hir_expr(out, arg, depth + 1); }
        }
    }
}

fn ivm_inst(out: &mut String, program: &IvmProgram, fid: Option<usize>, pc: usize, inst: &Inst, depth: usize) {
    let pad = indent(depth);
    let detail = match inst.op {
        Op::Const => format!("value={}", number(inst.imm)),
        Op::Ask => format!("slot={} scope={}", slot_name(program, fid, inst.a, inst.b), scope_name(inst.b)),
        Op::Attr => String::from("unsupported"),
        Op::Ret => String::new(),
        Op::Answer => format!("slot={} mode={}", answer_slot_name(program, fid, inst.a, inst.b), answer_mode_name(inst.b)),
        Op::Drop => String::new(),
        Op::Bin => format!("op={}", ivm_bin_name(inst.a)),
        Op::Cmp => format!("op={}", ivm_cmp_name(inst.a)),
        Op::If => format!("target={}", inst.a),
        Op::Call => format!("argc={}", inst.a),
        Op::Block => String::new(),
        Op::Else => format!("target={}", inst.a),
        Op::End => String::new(),
        Op::Func => format!("global={} function={}", global_name(program, inst.a), function_name(program, inst.b)),
        Op::Halt => String::new(),
    };
    if detail.is_empty() {
        let _ = writeln!(out, "{pad}{pc:04} {:<7} {}", op_name(inst.op), span_text(&inst.span));
    } else {
        let _ = writeln!(out, "{pad}{pc:04} {:<7} {:<34} {}", op_name(inst.op), detail, span_text(&inst.span));
    }
}

fn token_text(kind: &TokenKind) -> String {
    match kind {
        TokenKind::I => "I".into(),
        TokenKind::Def => "def".into(),
        TokenKind::If => "if".into(),
        TokenKind::Ident(name) => format!("Ident({name})"),
        TokenKind::Number(value) => format!("Number({})", number(*value)),
        TokenKind::LBrace => "{".into(), TokenKind::RBrace => "}".into(),
        TokenKind::LParen => "(".into(), TokenKind::RParen => ")".into(),
        TokenKind::Comma => ",".into(), TokenKind::Dot => ".".into(),
        TokenKind::Bind => "<-".into(), TokenKind::ReturnArrow => "->".into(),
        TokenKind::EqEq => "==".into(), TokenKind::NotEq => "!=".into(),
        TokenKind::Lt => "<".into(), TokenKind::Lte => "<=".into(),
        TokenKind::Gt => ">".into(), TokenKind::Gte => ">=".into(),
        TokenKind::Plus => "+".into(), TokenKind::Minus => "-".into(),
        TokenKind::Star => "*".into(), TokenKind::Slash => "/".into(), TokenKind::Percent => "%".into(),
        TokenKind::Amp => "&".into(), TokenKind::Pipe => "|".into(), TokenKind::Caret => "^".into(),
        TokenKind::Shl => "<<".into(), TokenKind::Shr => ">>".into(),
        TokenKind::Newline => "NEWLINE".into(), TokenKind::Eof => "EOF".into(),
    }
}

fn binary_name(op: BinaryOp) -> &'static str { match op { BinaryOp::Add => "Add", BinaryOp::Sub => "Sub", BinaryOp::Mul => "Mul", BinaryOp::Div => "Div", BinaryOp::Mod => "Mod", BinaryOp::And => "And", BinaryOp::Or => "Or", BinaryOp::Xor => "Xor", BinaryOp::Shl => "Shl", BinaryOp::Shr => "Shr" } }
fn compare_name(op: CompareOp) -> &'static str { match op { CompareOp::Eq => "Eq", CompareOp::Ne => "Ne", CompareOp::Lt => "Lt", CompareOp::Lte => "Lte", CompareOp::Gt => "Gt", CompareOp::Gte => "Gte" } }
fn op_name(op: Op) -> &'static str { match op { Op::Const => "Const", Op::Ask => "Ask", Op::Attr => "Attr", Op::Ret => "Ret", Op::Answer => "Answer", Op::Drop => "Drop", Op::Bin => "Bin", Op::Cmp => "Cmp", Op::If => "If", Op::Call => "Call", Op::Block => "Block", Op::Else => "Else", Op::End => "End", Op::Func => "Func", Op::Halt => "Halt" } }
fn ivm_bin_name(raw: i32) -> &'static str { match raw { ivm::bin::ADD => "Add", ivm::bin::SUB => "Sub", ivm::bin::MUL => "Mul", ivm::bin::DIV => "Div", _ => "Invalid" } }
fn ivm_cmp_name(raw: i32) -> &'static str { match raw { ivm::cmp::LT => "Lt", ivm::cmp::GT => "Gt", ivm::cmp::LTE => "Lte", ivm::cmp::GTE => "Gte", ivm::cmp::EQ => "Eq", ivm::cmp::NE => "Ne", _ => "Invalid" } }
fn scope_name(raw: i32) -> &'static str { if raw == 0 { "local" } else if raw == 1 { "global" } else { "invalid" } }
fn answer_mode_name(raw: i32) -> &'static str { match raw { ivm::answer::LOCAL_DECLARE => "local-declare", ivm::answer::LOCAL_ASSIGN => "local-assign", ivm::answer::GLOBAL_DECLARE => "global-declare", ivm::answer::GLOBAL_ASSIGN => "global-assign", _ => "invalid" } }

fn slot_name(program: &IvmProgram, fid: Option<usize>, raw: i32, scope: i32) -> String {
    if scope == 1 { global_name(program, raw) } else if scope == 0 { local_name(program, fid, raw) } else { format!("?{raw}") }
}

fn answer_slot_name(program: &IvmProgram, fid: Option<usize>, raw: i32, mode: i32) -> String {
    if ((mode >> 1) & 1) == 1 { global_name(program, raw) } else { local_name(program, fid, raw) }
}

fn global_name(program: &IvmProgram, raw: i32) -> String {
    if raw >= 0 { program.globals.get(raw as usize).map(|n| format!("g{raw}:{n}")).unwrap_or_else(|| format!("g{raw}:?")) } else { format!("g{raw}:?") }
}

fn local_name(program: &IvmProgram, fid: Option<usize>, raw: i32) -> String {
    if let Some(fid) = fid {
        if raw >= 0 {
            if let Some(function) = program.functions.get(fid) {
                if let Some(name) = function.params.get(raw as usize) { return format!("l{raw}:{name}"); }
            }
        }
    }
    format!("l{raw}")
}

fn function_name(program: &IvmProgram, raw: i32) -> String {
    if raw >= 0 { program.functions.get(raw as usize).map(|f| format!("fn{raw}:{}", f.name)).unwrap_or_else(|| format!("fn{raw}:?")) } else { format!("fn{raw}:?") }
}

fn number(value: f64) -> String {
    if value == 0.0 && value.is_sign_negative() { "-0".into() } else { value.to_string() }
}

fn span_text(span: &Span) -> String { format!("@{}:{} [{}..{}]", span.line, span.column, span.start, span.end) }
fn indent(depth: usize) -> String { "  ".repeat(depth) }
