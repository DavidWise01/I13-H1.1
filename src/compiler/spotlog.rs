//! Spot-awareness log.
//!
//! A read-only record of what the reference VM is aware of at each execution
//! spot, written so its SHAPE mirrors the program's natural hierarchy:
//!
//!   I  (uppercase) = a dominant scope -- a frame. It sits on the OUTSIDE and
//!                    contains what falls out of it.
//!   i  (lowercase) = a subordinate spot -- one executed instruction. It sits
//!                    INSIDE its frame and "falls out of I" just by being there.
//!
//! Indentation is containment depth: outside is shallow (left), inside is deep
//! (right). A called function opens a new `I` one level deeper. The running
//! stack height on each `i` line is the balance invariant the validator proved,
//! now watched live as it is preserved spot by spot.
//!
//! This rides the same read-only observer as `trace` (it cannot alter VM state);
//! it only reshapes the observations into the I / i hierarchy and totals them.

use std::fmt::Write;

use super::ivm::{IvmProgram, Op};
use super::trace::{TraceEvent, TraceScope};

pub const SPOTLOG_VERSION: &str = "0.1";

/// Stateful builder: feed it every `TraceEvent` in order, then `finish`.
pub struct SpotLog {
    buf: String,
    seen_first: bool,
    /// the VM's frame depth for the outermost scope (main); levels are measured from here.
    base_depth: usize,
    last_level: usize,
    spots: u64,
    max_level: usize,
    /// labels of the currently-open dominant scopes, outermost first.
    open: Vec<String>,
}

impl SpotLog {
    pub fn new() -> Self {
        let mut buf = String::new();
        let _ = writeln!(buf, "I13 SPOT-AWARENESS LOG v{SPOTLOG_VERSION}");
        let _ = writeln!(buf, "# I = dominant scope (outside, a frame); i = subordinate spot (inside, one instruction that falls out of I).");
        let _ = writeln!(buf, "# indent = containment depth (outside is shallow, inside is deep). 'stack' is the balance invariant, watched live.");
        buf.push('\n');
        SpotLog { buf, seen_first: false, base_depth: 0, last_level: 0, spots: 0, max_level: 0, open: Vec::new() }
    }

    fn label(program: &IvmProgram, scope: TraceScope) -> String {
        match scope {
            TraceScope::Main => String::from("main"),
            TraceScope::Function(fid) => program
                .functions
                .get(fid)
                .map(|f| format!("fn{fid:04}:{}", f.name))
                .unwrap_or_else(|| format!("fn{fid:04}:<invalid>")),
        }
    }

    /// One observation. Emits scope-boundary `I` lines as containment changes,
    /// then the subordinate `i` spot for this instruction.
    pub fn observe(&mut self, program: &IvmProgram, event: &TraceEvent) {
        if !self.seen_first {
            self.base_depth = event.frame_depth;
        }
        // level 0 is the outermost frame (main), measured from the VM's base depth.
        let level = event.frame_depth.saturating_sub(self.base_depth);
        if level > self.max_level {
            self.max_level = level;
        }
        let label = Self::label(program, event.scope);

        if !self.seen_first {
            // the outermost dominant invariant: the whole run sits inside it.
            let _ = writeln!(self.buf, "{}I  {}   depth {}  <- the outer invariant; everything below falls out of it", ind(level), label, level);
            self.open.push(label.clone());
            self.seen_first = true;
        } else if level > self.last_level {
            // a call opened a nested dominant scope, one level deeper inside.
            let _ = writeln!(self.buf, "{}I  ENTER {}   depth {}", ind(level), label, level);
            self.open.push(label.clone());
        } else if level < self.last_level {
            // returned toward the outside: close the inner scopes we left.
            while self.open.len() > level + 1 {
                let leaving_level = self.open.len().saturating_sub(1);
                let left = self.open.pop().unwrap_or_default();
                let _ = writeln!(self.buf, "{}I  LEAVE {}", ind(leaving_level), left);
            }
        }

        // the subordinate spot: one instruction, its running stack, what falls out.
        let detail = if event.detail.is_empty() {
            String::new()
        } else {
            format!("  {}", event.detail)
        };
        let _ = writeln!(
            self.buf,
            "{}i  {:04}  {:<9} stack {}{}",
            ind(level + 1),
            event.step,
            op_label(event.op),
            event.stack_height,
            detail,
        );
        self.spots += 1;
        self.last_level = level;
    }

    /// Close any still-open inner scopes and stamp the summary.
    pub fn finish(mut self, peak_stack: usize) -> String {
        while self.open.len() > 1 {
            let leaving_level = self.open.len().saturating_sub(1);
            let left = self.open.pop().unwrap_or_default();
            let _ = writeln!(self.buf, "{}I  LEAVE {}", ind(leaving_level), left);
        }
        let _ = writeln!(
            self.buf,
            "\nI  end   {} spots aware  .  deepest inside {}  .  peak stack {}  .  balance held to the last spot",
            self.spots, self.max_level, peak_stack,
        );
        self.buf
    }
}

impl Default for SpotLog {
    fn default() -> Self {
        Self::new()
    }
}

fn ind(levels: usize) -> String {
    "   ".repeat(levels)
}

fn op_label(op: Op) -> &'static str {
    match op {
        Op::Const => "Const",
        Op::ToBig => "ToBig",
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
