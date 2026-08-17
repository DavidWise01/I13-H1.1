use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    ivm::{answer, bin, cmp, Inst, IvmProgram, Op, I13_FRAME_LIMIT},
    source::Span,
    validator,
};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Value {
    Number(f64),
    Function(usize),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VmConfig {
    pub step_limit: u64,
    /// Optional stricter execution ceiling for tests/hosts. The canonical I13
    /// ceiling can never be raised above I13_FRAME_LIMIT.
    pub frame_limit: usize,
}

impl Default for VmConfig {
    fn default() -> Self {
        Self { step_limit: 8_000_000, frame_limit: I13_FRAME_LIMIT }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct VmResult {
    pub globals: Vec<Option<Value>>,
    pub steps: u64,
    pub peak_stack: usize,
    pub max_call_depth: usize,
}

impl VmResult {
    pub fn global_number(&self, program: &IvmProgram, name: &str) -> Option<f64> {
        let slot = program.globals.iter().position(|n| n == name)?;
        match self.globals.get(slot).copied().flatten()? {
            Value::Number(value) => Some(value),
            Value::Function(_) => None,
        }
    }
}

/// Deterministic reference execution for canonical IVM-13.
///
/// Calls use an explicit frame vector. I13 recursion therefore does not recurse
/// through the Rust host stack. The canonical active-frame ceiling is owned by
/// I13/IVM and is shared with generated backends.
pub fn run(program: &IvmProgram, config: VmConfig) -> Result<VmResult, Diagnostic> {
    if let Err(mut errors) = validator::validate(program) {
        return Err(errors.remove(0));
    }
    if config.frame_limit == 0 {
        return Err(Diagnostic::new(
            DiagnosticCode::VmCallLimit,
            "VM frame limit must be at least one",
            Span::new(0, 0, 1, 1),
        ));
    }
    let frame_limit = config.frame_limit.min(I13_FRAME_LIMIT);

    let mut globals = vec![None; program.globals.len()];
    let mut frames = vec![Frame::main()];
    let mut steps = 0u64;
    let mut peak_stack = 0usize;
    let mut max_call_depth = 0usize;

    loop {
        let depth = frames.len() - 1;
        let scope = frames[depth].scope;
        let pc = frames[depth].pc;
        let code = code_for(program, scope);

        if pc >= code.len() {
            match scope {
                FrameScope::Main => break,
                FrameScope::Function(fid) => {
                    let span = terminal_span(code);
                    return Err(runtime_error(
                        format!("function `{}` reached the end without Return", program.functions[fid].name),
                        span,
                    ));
                }
            }
        }

        steps += 1;
        if steps > config.step_limit {
            return Err(Diagnostic::new(
                DiagnosticCode::VmStepLimit,
                format!("reference VM exceeded {} steps", config.step_limit),
                code[pc].span.clone(),
            ));
        }

        let inst = code[pc].clone();
        match inst.op {
            Op::Const => {
                frames[depth].stack.push(Value::Number(inst.imm));
                frames[depth].pc += 1;
            }
            Op::Ask => {
                let value = if inst.b == 1 {
                    read_slot(&globals, inst.a, "global", &inst)?
                } else if inst.b == 0 {
                    read_slot(&frames[depth].locals, inst.a, "local", &inst)?
                } else {
                    return Err(runtime_error(format!("invalid Ask scope {}", inst.b), inst.span));
                };
                frames[depth].stack.push(value);
                frames[depth].pc += 1;
            }
            Op::Attr => {
                return Err(runtime_error(
                    "Attr has no executable I13 v0.1 semantics",
                    inst.span,
                ));
            }
            Op::Func => {
                if scope != FrameScope::Main {
                    return Err(runtime_error("Func binding is only valid in the main region", inst.span));
                }
                let slot = checked_slot(inst.a, globals.len(), "global", &inst)?;
                if inst.b < 0 || inst.b as usize >= program.functions.len() {
                    return Err(runtime_error(format!("invalid function id {}", inst.b), inst.span));
                }
                globals[slot] = Some(Value::Function(inst.b as usize));
                frames[depth].pc += 1;
            }
            Op::Answer => {
                let value = pop(&mut frames[depth], &inst)?;
                let mode = inst.b & 1;
                let global_scope = ((inst.b >> 1) & 1) == 1;
                if global_scope {
                    write_slot(&mut globals, inst.a, mode == 1, value, "global", &inst)?;
                } else {
                    write_slot(&mut frames[depth].locals, inst.a, mode == 1, value, "local", &inst)?;
                }
                frames[depth].pc += 1;
            }
            Op::Drop => {
                pop(&mut frames[depth], &inst)?;
                frames[depth].pc += 1;
            }
            Op::Bin => {
                let right = pop_number(&mut frames[depth], &inst)?;
                let left = pop_number(&mut frames[depth], &inst)?;
                let value = match inst.a {
                    bin::ADD => left + right,
                    bin::SUB => left - right,
                    bin::MUL => left * right,
                    bin::DIV if right == 0.0 => {
                        return Err(runtime_error("division by zero", inst.span));
                    }
                    bin::DIV => left / right,
                    other => return Err(runtime_error(format!("invalid Bin operator {other}"), inst.span)),
                };
                frames[depth].stack.push(Value::Number(value));
                frames[depth].pc += 1;
            }
            Op::Cmp => {
                let right = pop_number(&mut frames[depth], &inst)?;
                let left = pop_number(&mut frames[depth], &inst)?;
                let truth = match inst.a {
                    cmp::LT => left < right,
                    cmp::GT => left > right,
                    cmp::LTE => left <= right,
                    cmp::GTE => left >= right,
                    cmp::EQ => left == right,
                    cmp::NE => left != right,
                    other => return Err(runtime_error(format!("invalid Cmp operator {other}"), inst.span)),
                };
                frames[depth].stack.push(Value::Number(if truth { 1.0 } else { 0.0 }));
                frames[depth].pc += 1;
            }
            Op::If => {
                let condition = pop_number(&mut frames[depth], &inst)?;
                if condition == 0.0 {
                    frames[depth].pc = checked_jump(inst.a, code.len(), &inst)?;
                } else {
                    frames[depth].pc += 1;
                }
            }
            Op::Call => {
                if inst.a < 0 {
                    return Err(runtime_error("negative call arity", inst.span));
                }
                let argc = inst.a as usize;
                if frames[depth].stack.len() < argc + 1 {
                    return Err(runtime_error("stack underflow at Call", inst.span));
                }

                let mut args = Vec::with_capacity(argc);
                for _ in 0..argc {
                    args.push(pop(&mut frames[depth], &inst)?);
                }
                args.reverse();
                let function = pop(&mut frames[depth], &inst)?;
                let Value::Function(fid) = function else {
                    return Err(runtime_error("Call target is not a function", inst.span));
                };
                let Some(def) = program.functions.get(fid) else {
                    return Err(runtime_error(format!("invalid function id {fid}"), inst.span));
                };
                if def.params.len() != argc {
                    return Err(runtime_error(
                        format!("function `{}` expects {} argument(s), got {argc}", def.name, def.params.len()),
                        inst.span,
                    ));
                }
                if frames.len() >= frame_limit {
                    return Err(Diagnostic::new(
                        DiagnosticCode::VmCallLimit,
                        format!("I13 execution exceeded {frame_limit} frames"),
                        inst.span,
                    ));
                }

                frames[depth].pc += 1;
                let mut child = Frame::function(fid, def.local_count);
                for (slot, value) in args.into_iter().enumerate() {
                    child.locals[slot] = Some(value);
                }
                frames.push(child);
                max_call_depth = max_call_depth.max(frames.len() - 1);
            }
            Op::Block | Op::End => {
                frames[depth].pc += 1;
            }
            Op::Else => {
                frames[depth].pc = checked_jump(inst.a, code.len(), &inst)?;
            }
            Op::Ret => {
                if scope == FrameScope::Main {
                    return Err(runtime_error("Return is not valid in the main region", inst.span));
                }
                let value = pop(&mut frames[depth], &inst)?;
                frames.pop();
                let caller = frames.len() - 1;
                frames[caller].stack.push(value);
            }
            Op::Halt => {
                if scope != FrameScope::Main {
                    return Err(runtime_error("Halt is only valid in the main region", inst.span));
                }
                break;
            }
        }

        for frame in &frames {
            peak_stack = peak_stack.max(frame.stack.len());
        }
    }

    Ok(VmResult { globals, steps, peak_stack, max_call_depth })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FrameScope {
    Main,
    Function(usize),
}

#[derive(Debug, Clone)]
struct Frame {
    scope: FrameScope,
    pc: usize,
    stack: Vec<Value>,
    locals: Vec<Option<Value>>,
}

impl Frame {
    fn main() -> Self {
        Self { scope: FrameScope::Main, pc: 0, stack: Vec::new(), locals: Vec::new() }
    }

    fn function(fid: usize, local_count: usize) -> Self {
        Self {
            scope: FrameScope::Function(fid),
            pc: 0,
            stack: Vec::new(),
            locals: vec![None; local_count],
        }
    }
}

fn code_for(program: &IvmProgram, scope: FrameScope) -> &[Inst] {
    match scope {
        FrameScope::Main => &program.main,
        FrameScope::Function(fid) => &program.functions[fid].code,
    }
}

fn pop(frame: &mut Frame, inst: &Inst) -> Result<Value, Diagnostic> {
    frame.stack.pop().ok_or_else(|| runtime_error(format!("stack underflow at {:?}", inst.op), inst.span.clone()))
}

fn pop_number(frame: &mut Frame, inst: &Inst) -> Result<f64, Diagnostic> {
    match pop(frame, inst)? {
        Value::Number(value) => Ok(value),
        Value::Function(_) => Err(runtime_error(format!("{:?} requires numeric operands", inst.op), inst.span.clone())),
    }
}

fn read_slot(slots: &[Option<Value>], raw: i32, kind: &str, inst: &Inst) -> Result<Value, Diagnostic> {
    let slot = checked_slot(raw, slots.len(), kind, inst)?;
    slots[slot].ok_or_else(|| runtime_error(format!("unbound {kind} slot {slot}"), inst.span.clone()))
}

fn write_slot(
    slots: &mut [Option<Value>],
    raw: i32,
    require_existing: bool,
    value: Value,
    kind: &str,
    inst: &Inst,
) -> Result<(), Diagnostic> {
    let slot = checked_slot(raw, slots.len(), kind, inst)?;
    if require_existing && slots[slot].is_none() {
        return Err(runtime_error(format!("assignment to undeclared {kind} slot {slot}"), inst.span.clone()));
    }
    slots[slot] = Some(value);
    Ok(())
}

fn checked_slot(raw: i32, len: usize, kind: &str, inst: &Inst) -> Result<usize, Diagnostic> {
    if raw < 0 || raw as usize >= len {
        Err(runtime_error(format!("invalid {kind} slot {raw}"), inst.span.clone()))
    } else {
        Ok(raw as usize)
    }
}

fn checked_jump(raw: i32, len: usize, inst: &Inst) -> Result<usize, Diagnostic> {
    if raw < 0 || raw as usize >= len {
        Err(runtime_error(format!("invalid control target {raw}"), inst.span.clone()))
    } else {
        Ok(raw as usize)
    }
}

fn terminal_span(code: &[Inst]) -> Span {
    code.last().map(|i| i.span.clone()).unwrap_or_else(|| Span::new(0, 0, 1, 1))
}

fn runtime_error(message: impl Into<String>, span: Span) -> Diagnostic {
    Diagnostic::new(DiagnosticCode::VmRuntime, message, span)
}

#[allow(dead_code)]
fn _answer_mode_is_canonical(mode: i32) -> bool {
    matches!(mode, answer::LOCAL_DECLARE | answer::LOCAL_ASSIGN | answer::GLOBAL_DECLARE | answer::GLOBAL_ASSIGN)
}
