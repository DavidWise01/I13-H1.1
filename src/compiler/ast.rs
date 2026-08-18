use super::source::Span;

#[derive(Debug, Clone, PartialEq)]
pub struct Program { pub statements: Vec<Stmt> }

#[derive(Debug, Clone, PartialEq)]
pub struct Stmt { pub kind: StmtKind, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub enum StmtKind {
    Declare { name: String, value: Expr },
    Assign { target: AssignTarget, value: Expr },
    Return(Expr),
    Expr(Expr),
    If { condition: Expr, body: Vec<Stmt> },
    FunctionDef { name: String, params: Vec<Param>, body: Vec<Stmt> },
}

#[derive(Debug, Clone, PartialEq)]
pub struct Param { pub name: String, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub struct AssignTarget { pub name: String, pub attribute: Option<String>, pub index: Option<Box<Expr>>, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub struct Expr { pub kind: ExprKind, pub span: Span }

#[derive(Debug, Clone, PartialEq)]
pub enum ExprKind {
    Number(f64),
    Name(String),
    Attribute { base: Box<Expr>, name: String },
    Binary { left: Box<Expr>, op: BinaryOp, right: Box<Expr> },
    Compare { left: Box<Expr>, op: CompareOp, right: Box<Expr> },
    Call { callee: String, args: Vec<Expr> },
    Array(Vec<Expr>),
    Index { base: Box<Expr>, index: Box<Expr> },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOp { Add, Sub, Mul, Div, Mod, And, Or, Xor, Shl, Shr }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompareOp { Eq, Ne, Lt, Lte, Gt, Gte }
