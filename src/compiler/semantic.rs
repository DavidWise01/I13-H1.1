use std::collections::BTreeMap;

use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    hir::{HirExpr, HirExprKind, HirProgram, HirStmt, HirStmtKind},
};

pub fn check(program: &HirProgram) -> Result<(), Vec<Diagnostic>> {
    let mut functions = BTreeMap::<String, usize>::new();
    for stmt in &program.statements {
        if let HirStmtKind::FunctionDef { name, args, .. } = &stmt.kind {
            functions.insert(name.clone(), args.len());
        }
    }

    let mut errors = Vec::new();
    for stmt in &program.statements {
        check_stmt(stmt, &functions, &mut errors);
    }

    if errors.is_empty() { Ok(()) } else { Err(errors) }
}

fn check_stmt(stmt: &HirStmt, functions: &BTreeMap<String, usize>, errors: &mut Vec<Diagnostic>) {
    match &stmt.kind {
        HirStmtKind::Assign { attribute, value, .. } => {
            if let Some(name) = attribute {
                errors.push(Diagnostic::new(
                    DiagnosticCode::SemanticUnsupportedAttribute,
                    format!("attribute assignment `.{name}` is recognized but has no executable I13 v0.1 semantics"),
                    stmt.span.clone(),
                ));
            }
            check_expr(value, functions, errors);
        }
        HirStmtKind::Return(expr) | HirStmtKind::Expr(expr) => check_expr(expr, functions, errors),
        HirStmtKind::If { condition, body } => {
            check_expr(condition, functions, errors);
            for stmt in body { check_stmt(stmt, functions, errors); }
        }
        HirStmtKind::FunctionDef { body, .. } => {
            for stmt in body { check_stmt(stmt, functions, errors); }
        }
    }
}

fn check_expr(expr: &HirExpr, functions: &BTreeMap<String, usize>, errors: &mut Vec<Diagnostic>) {
    match &expr.kind {
        HirExprKind::Attribute { base, name } => {
            check_expr(base, functions, errors);
            errors.push(Diagnostic::new(
                DiagnosticCode::SemanticUnsupportedAttribute,
                format!("attribute `.{name}` is recognized but has no executable I13 v0.1 semantics"),
                expr.span.clone(),
            ));
        }
        HirExprKind::BinOp { left, right, .. } | HirExprKind::Compare { left, right, .. } => {
            check_expr(left, functions, errors);
            check_expr(right, functions, errors);
        }
        HirExprKind::Call { callee, args } => {
            for arg in args { check_expr(arg, functions, errors); }
            if callee == "big" {
                if args.len() != 1 {
                    errors.push(Diagnostic::new(
                        DiagnosticCode::SemanticArityMismatch,
                        format!("intrinsic `big` expects 1 argument, but this call provides {}", args.len()),
                        expr.span.clone(),
                    ));
                }
                return;
            }
            match functions.get(callee) {
                Some(expected) if *expected != args.len() => errors.push(Diagnostic::new(
                    DiagnosticCode::SemanticArityMismatch,
                    format!("function `{callee}` expects {expected} argument(s), but this call provides {}", args.len()),
                    expr.span.clone(),
                )),
                Some(_) => {}
                None => errors.push(Diagnostic::new(
                    DiagnosticCode::SemanticUnknownFunction,
                    format!("unknown function `{callee}`"),
                    expr.span.clone(),
                )),
            }
        }
        HirExprKind::Array(elements) => {
            for element in elements { check_expr(element, functions, errors); }
        }
        HirExprKind::Index { base, index } => {
            check_expr(base, functions, errors);
            check_expr(index, functions, errors);
        }
        HirExprKind::Name(_) | HirExprKind::Constant(_) => {}
    }
}
