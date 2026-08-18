use std::collections::BTreeMap;

use super::{
    ast::{BinaryOp, CompareOp},
    diagnostic::{Diagnostic, DiagnosticCode},
    hir::{HirExpr, HirExprKind, HirProgram, HirStmt, HirStmtKind},
    ivm::{answer, bin, cmp, Inst, IvmFunction, IvmProgram, Op},
};

pub fn lower(program: &HirProgram) -> Result<IvmProgram, Vec<Diagnostic>> {
    let globals = collect_globals(program);
    let global_slots = globals.iter().enumerate().map(|(i, n)| (n.clone(), i)).collect::<BTreeMap<_, _>>();

    let mut function_ids = BTreeMap::<String, usize>::new();
    for stmt in &program.statements {
        if let HirStmtKind::FunctionDef { name, .. } = &stmt.kind {
            let next = function_ids.len();
            function_ids.entry(name.clone()).or_insert(next);
        }
    }

    let mut errors = Vec::new();
    let mut functions = Vec::new();

    for stmt in &program.statements {
        if let HirStmtKind::FunctionDef { name, args, body } = &stmt.kind {
            let locals = collect_locals(args.iter().map(|a| a.name.clone()), body);
            let local_slots = locals.iter().enumerate().map(|(i, n)| (n.clone(), i)).collect::<BTreeMap<_, _>>();
            let mut code = Vec::new();
            let mut emitter = Emitter {
                globals: &global_slots,
                locals: Some(&local_slots),
                code: &mut code,
                errors: &mut errors,
            };
            for item in body {
                emitter.stmt(item);
            }
            functions.push(IvmFunction {
                name: name.clone(),
                params: args.iter().map(|a| a.name.clone()).collect(),
                local_count: locals.len(),
                code,
            });
        }
    }

    let mut main = Vec::new();
    {
        let mut emitter = Emitter {
            globals: &global_slots,
            locals: None,
            code: &mut main,
            errors: &mut errors,
        };

        for stmt in &program.statements {
            match &stmt.kind {
                HirStmtKind::FunctionDef { name, .. } => {
                    let Some(&slot) = global_slots.get(name) else { continue; };
                    let Some(&fid) = function_ids.get(name) else { continue; };
                    let mut inst = Inst::new(Op::Func, stmt.span.clone());
                    inst.a = slot as i32;
                    inst.b = fid as i32;
                    emitter.code.push(inst);
                }
                _ => emitter.stmt(stmt),
            }
        }
    }

    if errors.is_empty() {
        Ok(IvmProgram { globals, main, functions })
    } else {
        Err(errors)
    }
}

fn collect_globals(program: &HirProgram) -> Vec<String> {
    let mut names = Vec::<String>::new();
    for stmt in &program.statements {
        match &stmt.kind {
            HirStmtKind::FunctionDef { name, .. } => push_unique(&mut names, name),
            HirStmtKind::Assign { declare: true, target, .. } => push_unique(&mut names, target),
            _ => {}
        }
    }
    names
}

fn collect_locals(args: impl Iterator<Item = String>, body: &[HirStmt]) -> Vec<String> {
    let mut names = args.collect::<Vec<_>>();
    collect_local_stmts(body, &mut names);
    names
}

fn collect_local_stmts(body: &[HirStmt], names: &mut Vec<String>) {
    for stmt in body {
        match &stmt.kind {
            HirStmtKind::Assign { declare: true, target, .. } => push_unique(names, target),
            HirStmtKind::If { body, .. } => collect_local_stmts(body, names),
            HirStmtKind::FunctionDef { .. } => {}
            _ => {}
        }
    }
}

fn push_unique(names: &mut Vec<String>, name: &str) {
    if !names.iter().any(|n| n == name) {
        names.push(name.to_string());
    }
}

struct Emitter<'a> {
    globals: &'a BTreeMap<String, usize>,
    locals: Option<&'a BTreeMap<String, usize>>,
    code: &'a mut Vec<Inst>,
    errors: &'a mut Vec<Diagnostic>,
}

impl Emitter<'_> {
    fn stmt(&mut self, stmt: &HirStmt) {
        match &stmt.kind {
            HirStmtKind::Assign { declare, osmotic, target, attribute, index, value } => {
                if attribute.is_some() {
                    self.errors.push(Diagnostic::new(
                        DiagnosticCode::SemanticUnsupportedAttribute,
                        "attribute assignment reached IVM lowering",
                        stmt.span.clone(),
                    ));
                    return;
                }
                let Some((slot, scope)) = self.resolve_target(target) else {
                    self.errors.push(Diagnostic::new(
                        if *declare { DiagnosticCode::IvmUnboundName } else { DiagnosticCode::IvmAssignUndeclared },
                        format!("cannot resolve assignment target `{target}`"),
                        stmt.span.clone(),
                    ));
                    return;
                };

                if let Some(index_expr) = index {
                    // array element write:  v[i] <- e   ===   v <- arrayset(ask v, i, e)
                    self.emit_ask(slot, scope, stmt.span.clone());
                    self.expr(index_expr);
                    self.expr(value);
                    self.code.push(Inst::new(Op::ArraySet, stmt.span.clone()));
                    let mut answer_inst = Inst::new(Op::Answer, stmt.span.clone());
                    answer_inst.a = slot as i32;
                    answer_inst.b = match scope {
                        Scope::Local => answer::LOCAL_ASSIGN,
                        Scope::Global => answer::GLOBAL_ASSIGN,
                    };
                    self.code.push(answer_inst);
                    return;
                }

                if *osmotic {
                    self.emit_ask(slot, scope, stmt.span.clone());
                    self.expr(value);
                    let mut op = Inst::new(Op::Bin, stmt.span.clone());
                    op.a = bin::ADD;
                    self.code.push(op);
                } else {
                    self.expr(value);
                }

                let mut answer_inst = Inst::new(Op::Answer, stmt.span.clone());
                answer_inst.a = slot as i32;
                answer_inst.b = match (scope, *declare) {
                    (Scope::Local, true) => answer::LOCAL_DECLARE,
                    (Scope::Local, false) => answer::LOCAL_ASSIGN,
                    (Scope::Global, true) => answer::GLOBAL_DECLARE,
                    (Scope::Global, false) => answer::GLOBAL_ASSIGN,
                };
                self.code.push(answer_inst);
            }
            HirStmtKind::Return(expr) => {
                self.expr(expr);
                self.code.push(Inst::new(Op::Ret, stmt.span.clone()));
            }
            HirStmtKind::Expr(expr) => {
                self.expr(expr);
                self.code.push(Inst::new(Op::Drop, stmt.span.clone()));
            }
            HirStmtKind::If { condition, body } => {
                self.expr(condition);
                let if_index = self.code.len();
                self.code.push(Inst::new(Op::If, stmt.span.clone()));
                for child in body {
                    self.stmt(child);
                }
                let end_index = self.code.len();
                self.code.push(Inst::new(Op::End, stmt.span.clone()));
                self.code[if_index].a = end_index as i32;
            }
            HirStmtKind::FunctionDef { .. } => {
                self.errors.push(Diagnostic::new(
                    DiagnosticCode::IvmValidation,
                    "nested function definitions are not part of I13 v0.1",
                    stmt.span.clone(),
                ));
            }
        }
    }

    fn expr(&mut self, expr: &HirExpr) {
        match &expr.kind {
            HirExprKind::Constant(value) => {
                let mut inst = Inst::new(Op::Const, expr.span.clone());
                inst.imm = *value;
                self.code.push(inst);
            }
            HirExprKind::Name(name) => {
                if let Some((slot, scope)) = self.resolve_name(name) {
                    self.emit_ask(slot, scope, expr.span.clone());
                } else {
                    self.errors.push(Diagnostic::new(
                        DiagnosticCode::IvmUnboundName,
                        format!("unbound name `{name}`"),
                        expr.span.clone(),
                    ));
                }
            }
            HirExprKind::Attribute { .. } => {
                self.errors.push(Diagnostic::new(
                    DiagnosticCode::SemanticUnsupportedAttribute,
                    "attribute expression reached IVM lowering",
                    expr.span.clone(),
                ));
            }
            HirExprKind::BinOp { left, op, right } => {
                self.expr(left);
                self.expr(right);
                let mut inst = Inst::new(Op::Bin, expr.span.clone());
                inst.a = match op {
                    BinaryOp::Add => bin::ADD,
                    BinaryOp::Sub => bin::SUB,
                    BinaryOp::Mul => bin::MUL,
                    BinaryOp::Div => bin::DIV,
                    BinaryOp::Mod => bin::MOD,
                    BinaryOp::And => bin::AND,
                    BinaryOp::Or => bin::OR,
                    BinaryOp::Xor => bin::XOR,
                    BinaryOp::Shl => bin::SHL,
                    BinaryOp::Shr => bin::SHR,
                };
                self.code.push(inst);
            }
            HirExprKind::Compare { left, op, right } => {
                self.expr(left);
                self.expr(right);
                let mut inst = Inst::new(Op::Cmp, expr.span.clone());
                inst.a = match op {
                    CompareOp::Lt => cmp::LT,
                    CompareOp::Gt => cmp::GT,
                    CompareOp::Lte => cmp::LTE,
                    CompareOp::Gte => cmp::GTE,
                    CompareOp::Eq => cmp::EQ,
                    CompareOp::Ne => cmp::NE,
                };
                self.code.push(inst);
            }
            HirExprKind::Call { callee, args } => {
                // `big(x)` is an intrinsic, not a user function: promote a number to a bignum.
                if callee == "big" && args.len() == 1 {
                    self.expr(&args[0]);
                    self.code.push(Inst::new(Op::ToBig, expr.span.clone()));
                    return;
                }
                let Some(&slot) = self.globals.get(callee) else {
                    self.errors.push(Diagnostic::new(
                        DiagnosticCode::SemanticUnknownFunction,
                        format!("unknown function `{callee}`"),
                        expr.span.clone(),
                    ));
                    return;
                };
                self.emit_ask(slot, Scope::Global, expr.span.clone());
                for arg in args {
                    self.expr(arg);
                }
                let mut inst = Inst::new(Op::Call, expr.span.clone());
                inst.a = args.len() as i32;
                self.code.push(inst);
            }
            HirExprKind::Array(elements) => {
                for element in elements {
                    self.expr(element);
                }
                let mut inst = Inst::new(Op::MakeArray, expr.span.clone());
                inst.a = elements.len() as i32;
                self.code.push(inst);
            }
            HirExprKind::Index { base, index } => {
                self.expr(base);
                self.expr(index);
                self.code.push(Inst::new(Op::Index, expr.span.clone()));
            }
        }
    }

    fn resolve_target(&self, name: &str) -> Option<(usize, Scope)> {
        if let Some(locals) = self.locals {
            locals.get(name).copied().map(|slot| (slot, Scope::Local))
        } else {
            self.globals.get(name).copied().map(|slot| (slot, Scope::Global))
        }
    }

    fn resolve_name(&self, name: &str) -> Option<(usize, Scope)> {
        if let Some(locals) = self.locals {
            if let Some(&slot) = locals.get(name) {
                return Some((slot, Scope::Local));
            }
        }
        self.globals.get(name).copied().map(|slot| (slot, Scope::Global))
    }

    fn emit_ask(&mut self, slot: usize, scope: Scope, span: super::source::Span) {
        let mut inst = Inst::new(Op::Ask, span);
        inst.a = slot as i32;
        inst.b = if scope == Scope::Global { 1 } else { 0 };
        self.code.push(inst);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Scope { Local, Global }
