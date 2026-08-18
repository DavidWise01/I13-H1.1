use std::collections::BTreeSet;
use std::fmt::Write;

use super::{
    ivm::IvmProgram,
    source::SourceFile,
    trace::{render_event, TraceScope},
    vm::{DebugSnapshot, Value},
};

pub const DEBUGGER_VERSION: &str = "0.1";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PauseReason {
    Entry,
    Step,
    Next,
    Breakpoint(usize),
}

impl PauseReason {
    pub fn label(self) -> String {
        match self {
            Self::Entry => String::from("entry"),
            Self::Step => String::from("step"),
            Self::Next => String::from("next"),
            Self::Breakpoint(line) => format!("breakpoint:{line}"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RunMode {
    Step,
    Next { depth: usize },
    Continue,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CommandEffect {
    Stay(String),
    Resume(String),
    Quit(String),
}

#[derive(Debug, Clone)]
pub struct Debugger {
    breakpoints: BTreeSet<usize>,
    mode: RunMode,
    first_pause: bool,
    /// A breakpoint is suppressed only in the frame that triggered it. Deeper
    /// calls may execute arbitrary source lines without clearing the caller's
    /// suppression. It clears once that same-or-shallower frame advances to a
    /// different source line.
    suppress_breakpoint: Option<(usize, usize)>,
    last_reason: Option<PauseReason>,
}

impl Default for Debugger {
    fn default() -> Self {
        Self::new()
    }
}

impl Debugger {
    pub fn new() -> Self {
        Self {
            breakpoints: BTreeSet::new(),
            mode: RunMode::Step,
            first_pause: true,
            suppress_breakpoint: None,
            last_reason: None,
        }
    }

    pub fn breakpoints(&self) -> impl Iterator<Item = usize> + '_ {
        self.breakpoints.iter().copied()
    }

    pub fn should_pause(&mut self, snapshot: &DebugSnapshot) -> Option<PauseReason> {
        let line = snapshot.event.span.line;
        let depth = snapshot.event.frame_depth;

        if let Some((suppressed_line, suppressed_depth)) = self.suppress_breakpoint {
            if depth <= suppressed_depth && line != suppressed_line {
                self.suppress_breakpoint = None;
            }
        }

        let breakpoint_suppressed = self
            .suppress_breakpoint
            .is_some_and(|(suppressed_line, suppressed_depth)| {
                suppressed_line == line && suppressed_depth == depth
            });

        let reason = if self.first_pause {
            self.first_pause = false;
            Some(PauseReason::Entry)
        } else if self.breakpoints.contains(&line) && !breakpoint_suppressed {
            Some(PauseReason::Breakpoint(line))
        } else {
            match self.mode {
                RunMode::Step => Some(PauseReason::Step),
                RunMode::Next { depth } if snapshot.event.frame_depth <= depth => Some(PauseReason::Next),
                RunMode::Next { .. } | RunMode::Continue => None,
            }
        };

        if let Some(reason) = reason {
            self.last_reason = Some(reason);
        }
        reason
    }

    pub fn command(
        &mut self,
        input: &str,
        program: &IvmProgram,
        source: &SourceFile,
        snapshot: &DebugSnapshot,
    ) -> CommandEffect {
        let trimmed = input.trim();
        let mut parts = trimmed.split_whitespace();
        let command = parts.next().unwrap_or("");

        match command {
            "" => self.resume_step(snapshot),
            "s" | "step" => self.resume_step(snapshot),
            "n" | "next" => {
                self.prepare_resume(snapshot);
                self.mode = RunMode::Next { depth: snapshot.event.frame_depth };
                CommandEffect::Resume(String::from("NEXT"))
            }
            "c" | "continue" => {
                self.prepare_resume(snapshot);
                self.mode = RunMode::Continue;
                CommandEffect::Resume(String::from("CONTINUE"))
            }
            "b" | "break" => {
                let Some(raw) = parts.next() else {
                    return CommandEffect::Stay(String::from("usage: break <source-line>"));
                };
                if parts.next().is_some() {
                    return CommandEffect::Stay(String::from("usage: break <source-line>"));
                }
                let Ok(line) = raw.parse::<usize>() else {
                    return CommandEffect::Stay(format!("invalid source line `{raw}`"));
                };
                if line == 0 || source.line(line).is_none() {
                    return CommandEffect::Stay(format!("source line {line} does not exist"));
                }
                self.breakpoints.insert(line);
                CommandEffect::Stay(format!("BREAKPOINT {line} SET"))
            }
            "d" | "delete" => {
                let Some(raw) = parts.next() else {
                    return CommandEffect::Stay(String::from("usage: delete <source-line>"));
                };
                if parts.next().is_some() {
                    return CommandEffect::Stay(String::from("usage: delete <source-line>"));
                }
                let Ok(line) = raw.parse::<usize>() else {
                    return CommandEffect::Stay(format!("invalid source line `{raw}`"));
                };
                if self.breakpoints.remove(&line) {
                    CommandEffect::Stay(format!("BREAKPOINT {line} DELETED"))
                } else {
                    CommandEffect::Stay(format!("BREAKPOINT {line} NOT SET"))
                }
            }
            "bl" | "breakpoints" => CommandEffect::Stay(render_breakpoints(self)),
            "w" | "where" => CommandEffect::Stay(render_where(program, source, snapshot)),
            "bindings" | "vars" => CommandEffect::Stay(render_bindings(program, snapshot)),
            "p" | "print" => {
                let Some(name) = parts.next() else {
                    return CommandEffect::Stay(String::from("usage: print <name|lNNNN>"));
                };
                if parts.next().is_some() {
                    return CommandEffect::Stay(String::from("usage: print <name|lNNNN>"));
                }
                CommandEffect::Stay(render_value_lookup(program, snapshot, name))
            }
            "stack" => CommandEffect::Stay(render_stack(program, snapshot)),
            "frames" | "bt" => CommandEffect::Stay(render_frames(program, snapshot)),
            "h" | "help" | "?" => CommandEffect::Stay(help()),
            "q" | "quit" => CommandEffect::Quit(String::from("DEBUG QUIT")),
            other => CommandEffect::Stay(format!("unknown debugger command `{other}`\n{}", help())),
        }
    }

    fn resume_step(&mut self, snapshot: &DebugSnapshot) -> CommandEffect {
        self.prepare_resume(snapshot);
        self.mode = RunMode::Step;
        CommandEffect::Resume(String::from("STEP"))
    }

    fn prepare_resume(&mut self, snapshot: &DebugSnapshot) {
        if matches!(self.last_reason, Some(PauseReason::Breakpoint(_))) {
            self.suppress_breakpoint = Some((snapshot.event.span.line, snapshot.event.frame_depth));
        }
        self.last_reason = None;
    }
}

pub fn header(step_limit: u64, frame_limit: usize) -> String {
    format!(
        "I13 DEBUGGER v{DEBUGGER_VERSION}\nstep_limit {step_limit}\nframe_limit {frame_limit}\ncommands step|next|continue|break|delete|bindings|print|stack|frames|where|quit\n"
    )
}

pub fn render_pause(
    program: &IvmProgram,
    source: &SourceFile,
    snapshot: &DebugSnapshot,
    reason: PauseReason,
) -> String {
    let mut out = String::new();
    let _ = writeln!(
        out,
        "PAUSE {} · {}",
        reason.label(),
        render_event(program, &snapshot.event)
    );
    if let Some(line) = source.line(snapshot.event.span.line) {
        let marker = " ".repeat(snapshot.event.span.column.saturating_sub(1));
        let _ = writeln!(out, "{:>4} | {}", line.number, line.text);
        let _ = writeln!(out, "     | {marker}^");
    }
    out.trim_end().to_string()
}

pub fn render_breakpoints(debugger: &Debugger) -> String {
    let list = debugger.breakpoints().collect::<Vec<_>>();
    if list.is_empty() {
        String::from("BREAKPOINTS <none>")
    } else {
        format!(
            "BREAKPOINTS {}",
            list.into_iter().map(|line| line.to_string()).collect::<Vec<_>>().join(",")
        )
    }
}

pub fn render_where(program: &IvmProgram, source: &SourceFile, snapshot: &DebugSnapshot) -> String {
    let mut out = String::new();
    let _ = writeln!(out, "WHERE {}", render_event(program, &snapshot.event));
    if let Some(line) = source.line(snapshot.event.span.line) {
        let marker = " ".repeat(snapshot.event.span.column.saturating_sub(1));
        let _ = writeln!(out, "{:>4} | {}", line.number, line.text);
        let _ = writeln!(out, "     | {marker}^");
    }
    out.trim_end().to_string()
}

pub fn render_bindings(program: &IvmProgram, snapshot: &DebugSnapshot) -> String {
    let mut out = String::from("GLOBALS\n");
    for (slot, name) in program.globals.iter().enumerate() {
        let value = snapshot.globals.get(slot).copied().flatten();
        let _ = writeln!(out, "  g{slot:04}:{name} = {}", render_value(program, value));
    }

    let current = snapshot.frames.last();
    match current {
        Some(frame) => {
            let _ = writeln!(out, "LOCALS");
            let params = match frame.scope {
                TraceScope::Main => None,
                TraceScope::Function(fid) => program.functions.get(fid).map(|f| f.params.as_slice()),
            };
            if frame.locals.is_empty() {
                let _ = writeln!(out, "  <none>");
            } else {
                for (slot, value) in frame.locals.iter().copied().enumerate() {
                    let label = params
                        .and_then(|names| names.get(slot))
                        .map(|name| format!("l{slot:04}:{name}"))
                        .unwrap_or_else(|| format!("l{slot:04}"));
                    let _ = writeln!(out, "  {label} = {}", render_value(program, value));
                }
            }
        }
        None => {
            let _ = writeln!(out, "LOCALS\n  <no active frame>");
        }
    }
    out.trim_end().to_string()
}

pub fn render_value_lookup(program: &IvmProgram, snapshot: &DebugSnapshot, name: &str) -> String {
    if let Some(slot) = program.globals.iter().position(|candidate| candidate == name) {
        return format!(
            "{name} = {}",
            render_value(program, snapshot.globals.get(slot).copied().flatten())
        );
    }

    let Some(frame) = snapshot.frames.last() else {
        return format!("unknown binding `{name}`");
    };

    if let TraceScope::Function(fid) = frame.scope {
        if let Some(function) = program.functions.get(fid) {
            if let Some(slot) = function.params.iter().position(|candidate| candidate == name) {
                return format!(
                    "{name} = {}",
                    render_value(program, frame.locals.get(slot).copied().flatten())
                );
            }
        }
    }

    if let Some(raw) = name.strip_prefix('l') {
        if let Ok(slot) = raw.parse::<usize>() {
            if slot < frame.locals.len() {
                return format!(
                    "l{slot:04} = {}",
                    render_value(program, frame.locals.get(slot).copied().flatten())
                );
            }
        }
    }

    format!("unknown binding `{name}`")
}

pub fn render_stack(program: &IvmProgram, snapshot: &DebugSnapshot) -> String {
    let Some(frame) = snapshot.frames.last() else {
        return String::from("STACK <no active frame>");
    };
    if frame.stack.is_empty() {
        return String::from("STACK <empty>");
    }
    let mut out = String::from("STACK bottom→top\n");
    for (index, value) in frame.stack.iter().copied().enumerate() {
        let _ = writeln!(out, "  [{index:04}] {}", render_value(program, Some(value)));
    }
    out.trim_end().to_string()
}

pub fn render_frames(program: &IvmProgram, snapshot: &DebugSnapshot) -> String {
    let mut out = String::from("FRAMES root→current\n");
    for (index, frame) in snapshot.frames.iter().enumerate() {
        let scope = match frame.scope {
            TraceScope::Main => String::from("main"),
            TraceScope::Function(fid) => program
                .functions
                .get(fid)
                .map(|function| format!("fn{fid:04}:{}", function.name))
                .unwrap_or_else(|| format!("fn{fid:04}:<invalid>")),
        };
        let current = if index + 1 == snapshot.frames.len() { " *" } else { "" };
        let _ = writeln!(
            out,
            "  depth={} scope={} pc={:04} stack={} locals={}{}",
            index + 1,
            scope,
            frame.pc,
            frame.stack.len(),
            frame.locals.len(),
            current,
        );
    }
    out.trim_end().to_string()
}

pub fn help() -> String {
    [
        "DEBUG COMMANDS",
        "  step | s              execute one IVM instruction",
        "  next | n              step over deeper function frames",
        "  continue | c          run until a breakpoint or completion",
        "  break | b <line>      add source-line breakpoint",
        "  delete | d <line>     remove source-line breakpoint",
        "  breakpoints | bl      list breakpoints",
        "  where | w             show current instruction/source",
        "  bindings | vars       show globals + current locals",
        "  print | p <name>      inspect global/parameter/local slot",
        "  stack                 show current operand stack",
        "  frames | bt           show active I13 frames",
        "  help | ?              show commands",
        "  quit | q              abort debugger without a VM error",
    ]
    .join("\n")
}

fn render_value(program: &IvmProgram, value: Option<Value>) -> String {
    match value {
        Some(Value::Number(value)) => format!("Number({})", number(value)),
        Some(Value::Array(handle)) => format!("Array(#{handle})"),
        Some(Value::Bignum(handle)) => format!("Bignum(#{handle})"),
        Some(Value::Function(fid)) => program
            .functions
            .get(fid)
            .map(|function| format!("Function(fn{fid:04}:{})", function.name))
            .unwrap_or_else(|| format!("Function(fn{fid:04}:<invalid>)")),
        None => String::from("<unbound>"),
    }
}

fn number(value: f64) -> String {
    if value == 0.0 && value.is_sign_negative() {
        String::from("-0")
    } else if value.fract() == 0.0 && value.is_finite() {
        format!("{value:.0}")
    } else {
        value.to_string()
    }
}
