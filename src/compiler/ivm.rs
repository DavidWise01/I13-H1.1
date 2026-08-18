use super::source::Span;

/// Canonical I13 execution-frame ceiling.
///
/// The count includes the main/root frame. Every backend must reject a Call
/// that would raise the active I13 frame count above this value.
pub const I13_FRAME_LIMIT: usize = 4096;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    Const = 0,
    Ask = 1,
    Attr = 2,
    Ret = 3,
    Answer = 4,
    Drop = 5,
    Bin = 6,
    Cmp = 7,
    If = 8,
    Call = 9,
    Block = 10,
    Else = 11,
    End = 12,
    Func = 13,
    Halt = 14,
}

pub const OPCODE_COUNT: usize = 15;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StackEffect {
    pub need: u32,
    pub net: i32,
}

impl Op {
    /// Single authority for the frozen IVM-13 stack law.
    pub fn effect(self, argc: u32) -> StackEffect {
        match self {
            Self::Const | Self::Ask => StackEffect { need: 0, net: 1 },
            Self::Attr | Self::Ret => StackEffect { need: 1, net: 0 },
            Self::Answer | Self::Drop | Self::If => StackEffect { need: 1, net: -1 },
            Self::Bin | Self::Cmp => StackEffect { need: 2, net: -1 },
            Self::Call => StackEffect { need: argc + 1, net: -(argc as i32) },
            Self::Block | Self::Else | Self::End | Self::Func | Self::Halt => StackEffect { need: 0, net: 0 },
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Inst {
    pub op: Op,
    pub a: i32,
    pub b: i32,
    pub imm: f64,
    pub span: Span,
}

impl Inst {
    pub fn new(op: Op, span: Span) -> Self {
        Self { op, a: 0, b: 0, imm: 0.0, span }
    }

    pub fn effect(&self) -> StackEffect {
        self.op.effect(if self.op == Op::Call { self.a.max(0) as u32 } else { 0 })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct IvmFunction {
    pub name: String,
    pub params: Vec<String>,
    pub local_count: usize,
    pub code: Vec<Inst>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IvmProgram {
    pub globals: Vec<String>,
    pub main: Vec<Inst>,
    pub functions: Vec<IvmFunction>,
}

pub mod bin {
    pub const ADD: i32 = 0;
    pub const SUB: i32 = 1;
    pub const MUL: i32 = 2;
    pub const DIV: i32 = 3;
    pub const MOD: i32 = 4;
    pub const AND: i32 = 5;
    pub const OR: i32 = 6;
    pub const XOR: i32 = 7;
    pub const SHL: i32 = 8;
    pub const SHR: i32 = 9;
}

pub mod cmp {
    pub const LT: i32 = 0;
    pub const GT: i32 = 1;
    pub const LTE: i32 = 2;
    pub const GTE: i32 = 3;
    pub const EQ: i32 = 4;
    pub const NE: i32 = 5;
}

pub mod answer {
    pub const LOCAL_DECLARE: i32 = 0;
    pub const LOCAL_ASSIGN: i32 = 1;
    pub const GLOBAL_DECLARE: i32 = 2;
    pub const GLOBAL_ASSIGN: i32 = 3;
}
