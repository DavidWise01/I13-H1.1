use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    ivm::{Inst, IvmProgram, Op},
    source::Span,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ValidationReport {
    pub peak_height: i32,
    pub regions: usize,
}

pub fn validate(program: &IvmProgram) -> Result<ValidationReport, Vec<Diagnostic>> {
    let mut peak = 0;
    let mut errors = Vec::new();

    match validate_region(&program.main) {
        Ok(p) => peak = peak.max(p),
        Err(error) => errors.push(error),
    }

    for function in &program.functions {
        match validate_region(&function.code) {
            Ok(p) => peak = peak.max(p),
            Err(error) => errors.push(error),
        }
    }

    if errors.is_empty() {
        Ok(ValidationReport { peak_height: peak, regions: 1 + program.functions.len() })
    } else {
        Err(errors)
    }
}

fn validate_region(code: &[Inst]) -> Result<i32, Diagnostic> {
    let mut control = Vec::<Control>::new();
    let mut height = 0i32;
    let mut peak = 0i32;
    let mut live = true;

    for inst in code {
        match inst.op {
            Op::Block => control.push(Control::block(height, live)),
            Op::If => {
                if live {
                    if height < 1 {
                        return Err(error("stack underflow at If", inst.span.clone()));
                    }
                    height -= 1;
                }
                control.push(Control::if_(height, live));
            }
            Op::Else => {
                let Some(top) = control.last_mut() else {
                    return Err(error("Else without open If", inst.span.clone()));
                };
                if top.kind != ControlKind::If {
                    return Err(error("Else does not close an If", inst.span.clone()));
                }
                top.then_live = Some(live);
                top.then_height = if live { height } else { 0 };
                live = top.entry_live;
                height = top.entry_height;
            }
            Op::End => {
                let Some(top) = control.pop() else {
                    return Err(error("End without open control region", inst.span.clone()));
                };
                match top.kind {
                    ControlKind::Block => {
                        if top.entry_live && live && height != top.entry_height {
                            return Err(error("Block exits at a different stack height", inst.span.clone()));
                        }
                    }
                    ControlKind::If => {
                        let then_live = top.then_live.unwrap_or(top.entry_live);
                        let then_height = if top.then_live.is_some() { top.then_height } else { top.entry_height };
                        let else_live = live;
                        let else_height = if live { height } else { 0 };

                        if then_live && else_live && then_height != else_height {
                            return Err(error("If paths merge at different stack heights", inst.span.clone()));
                        } else if then_live {
                            live = true;
                            height = then_height;
                        } else if else_live {
                            live = true;
                            height = else_height;
                        } else {
                            live = false;
                            height = top.entry_height;
                        }
                    }
                }
            }
            Op::Ret => {
                if live {
                    if height < 1 {
                        return Err(error("stack underflow at Return", inst.span.clone()));
                    }
                    height -= 1;
                    live = false;
                }
            }
            _ => {
                if live {
                    let effect = inst.effect();
                    if height < effect.need as i32 {
                        return Err(error(
                            format!("stack underflow at {:?}: need {}, have {}", inst.op, effect.need, height),
                            inst.span.clone(),
                        ));
                    }
                    height += effect.net;
                }
            }
        }
        if live {
            peak = peak.max(height);
        }
    }

    if !control.is_empty() {
        return Err(error("unclosed control region", terminal_span(code)));
    }
    if live && height != 0 {
        return Err(error(format!("region exits with stack height {height}, expected 0"), terminal_span(code)));
    }

    Ok(peak)
}

fn error(message: impl Into<String>, span: Span) -> Diagnostic {
    Diagnostic::new(DiagnosticCode::IvmValidation, message, span)
}

fn terminal_span(code: &[Inst]) -> Span {
    code.last().map(|i| i.span.clone()).unwrap_or_else(|| Span::new(0, 0, 1, 1))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ControlKind { Block, If }

#[derive(Debug, Clone, Copy)]
struct Control {
    kind: ControlKind,
    entry_height: i32,
    entry_live: bool,
    then_live: Option<bool>,
    then_height: i32,
}

impl Control {
    fn block(height: i32, live: bool) -> Self {
        Self { kind: ControlKind::Block, entry_height: height, entry_live: live, then_live: None, then_height: 0 }
    }

    fn if_(height: i32, live: bool) -> Self {
        Self { kind: ControlKind::If, entry_height: height, entry_live: live, then_live: None, then_height: 0 }
    }
}
