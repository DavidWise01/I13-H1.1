use std::fmt::Write;

use super::{
    ivm::{IvmProgram, Op, StackEffect},
    source::Span,
};

pub const TRACE_VERSION: &str = "0.1";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TraceScope {
    Main,
    Function(usize),
}

#[derive(Debug, Clone, PartialEq)]
pub struct TraceEvent {
    pub step: u64,
    pub frame_depth: usize,
    pub scope: TraceScope,
    pub pc: usize,
    pub op: Op,
    pub stack_height: usize,
    pub effect: StackEffect,
    pub span: Span,
    pub detail: String,
}

pub fn header(step_limit: u64, frame_limit: usize) -> String {
    format!(
        "I13 TRACE v{TRACE_VERSION}\nstep_limit {step_limit}\nframe_limit {frame_limit}\n"
    )
}

pub fn render_event(program: &IvmProgram, event: &TraceEvent) -> String {
    let mut out = String::new();
    let scope = match event.scope {
        TraceScope::Main => String::from("main"),
        TraceScope::Function(fid) => program
            .functions
            .get(fid)
            .map(|f| format!("fn{fid:04}:{}", f.name))
            .unwrap_or_else(|| format!("fn{fid:04}:<invalid>")),
    };
    let net = if event.effect.net >= 0 {
        format!("+{}", event.effect.net)
    } else {
        event.effect.net.to_string()
    };
    let _ = write!(
        out,
        "{:06} depth={} scope={} pc={:04} {:<7} stack={} need={} net={} @{}:{} [{}..{}]",
        event.step,
        event.frame_depth,
        scope,
        event.pc,
        op_name(event.op),
        event.stack_height,
        event.effect.need,
        net,
        event.span.line,
        event.span.column,
        event.span.start,
        event.span.end,
    );
    if !event.detail.is_empty() {
        let _ = write!(out, " | {}", event.detail);
    }
    out
}

fn op_name(op: Op) -> &'static str {
    match op {
        Op::Const => "Const",
        Op::MakeArray => "MakeArray",
        Op::Index => "Index",
        Op::ArraySet => "ArraySet",
        Op::Ask => "Ask",
        Op::Attr => "Attr",
        Op::Ret => "Ret",
        Op::Answer => "Answer",
        Op::Drop => "Drop",
        Op::Bin => "Bin",
        Op::Cmp => "Cmp",
        Op::If => "If",
        Op::Call => "Call",
        Op::Block => "Block",
        Op::Else => "Else",
        Op::End => "End",
        Op::Func => "Func",
        Op::Halt => "Halt",
    }
}
