use super::{ast, source::Span};

#[derive(Debug, Clone, PartialEq)]
pub struct HirProgram { pub statements: Vec<HirStmt> }

#[derive(Debug, Clone, PartialEq)]
pub struct HirStmt { pub kind: HirStmtKind, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub enum HirStmtKind {
    Assign { declare: bool, osmotic: bool, target: String, attribute: Option<String>, value: HirExpr },
    Return(HirExpr),
    Expr(HirExpr),
    If { condition: HirExpr, body: Vec<HirStmt> },
    FunctionDef { name: String, args: Vec<HirArg>, body: Vec<HirStmt> },
}

#[derive(Debug, Clone, PartialEq)]
pub struct HirArg { pub name: String, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub struct HirExpr { pub kind: HirExprKind, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub enum HirExprKind {
    Name(String),
    Constant(f64),
    Attribute { base: Box<HirExpr>, name: String },
    BinOp { left: Box<HirExpr>, op: ast::BinaryOp, right: Box<HirExpr> },
    Compare { left: Box<HirExpr>, op: ast::CompareOp, right: Box<HirExpr> },
    Call { callee: String, args: Vec<HirExpr> },
}

pub fn lower(program: ast::Program) -> HirProgram {
    HirProgram { statements: program.statements.into_iter().map(lower_stmt).collect() }
}

fn lower_stmt(stmt: ast::Stmt) -> HirStmt {
    let span = stmt.span;
    let kind = match stmt.kind {
        ast::StmtKind::Declare { name, value } => HirStmtKind::Assign {
            declare: true,
            osmotic: false,
            target: name,
            attribute: None,
            value: lower_expr(value),
        },
        ast::StmtKind::Assign { target, value } => {
            let osmotic = target.attribute.as_deref() == Some("p");
            let attribute = if osmotic { None } else { target.attribute };
            HirStmtKind::Assign {
                declare: false,
                osmotic,
                target: target.name,
                attribute,
                value: lower_expr(value),
            }
        }
        ast::StmtKind::Return(expr) => HirStmtKind::Return(lower_expr(expr)),
        ast::StmtKind::Expr(expr) => HirStmtKind::Expr(lower_expr(expr)),
        ast::StmtKind::If { condition, body } => HirStmtKind::If {
            condition: lower_expr(condition),
            body: body.into_iter().map(lower_stmt).collect(),
        },
        ast::StmtKind::FunctionDef { name, params, body } => HirStmtKind::FunctionDef {
            name,
            args: params.into_iter().map(|p| HirArg { name: p.name, span: p.span }).collect(),
            body: body.into_iter().map(lower_stmt).collect(),
        },
    };
    HirStmt { kind, span }
}

fn lower_expr(expr: ast::Expr) -> HirExpr {
    let span = expr.span;
    let kind = match expr.kind {
        ast::ExprKind::Number(v) => HirExprKind::Constant(v),
        ast::ExprKind::Name(v) => HirExprKind::Name(v),
        ast::ExprKind::Attribute { base, name } => HirExprKind::Attribute { base: Box::new(lower_expr(*base)), name },
        ast::ExprKind::Binary { left, op, right } => HirExprKind::BinOp { left: Box::new(lower_expr(*left)), op, right: Box::new(lower_expr(*right)) },
        ast::ExprKind::Compare { left, op, right } => HirExprKind::Compare { left: Box::new(lower_expr(*left)), op, right: Box::new(lower_expr(*right)) },
        ast::ExprKind::Call { callee, args } => HirExprKind::Call { callee, args: args.into_iter().map(lower_expr).collect() },
    };
    HirExpr { kind, span }
}
