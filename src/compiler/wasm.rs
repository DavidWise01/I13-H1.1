use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    ivm::{answer, bin, cmp, Inst, IvmProgram, Op},
    source::Span,
    validator,
};

const I32: u8 = 0x7f;
const F64: u8 = 0x7c;
const FUNCREF: u8 = 0x70;
const EMPTY_BLOCK: u8 = 0x40;

const OP_UNREACHABLE: u8 = 0x00;
const OP_BLOCK: u8 = 0x02;
const OP_IF: u8 = 0x04;
const OP_ELSE: u8 = 0x05;
const OP_END: u8 = 0x0b;
const OP_RETURN: u8 = 0x0f;
const OP_CALL_INDIRECT: u8 = 0x11;
const OP_DROP: u8 = 0x1a;
const OP_LOCAL_GET: u8 = 0x20;
const OP_LOCAL_SET: u8 = 0x21;
const OP_GLOBAL_GET: u8 = 0x23;
const OP_GLOBAL_SET: u8 = 0x24;
const OP_I32_CONST: u8 = 0x41;
const OP_F64_CONST: u8 = 0x44;
const OP_I32_EQZ: u8 = 0x45;
const OP_F64_EQ: u8 = 0x61;
const OP_F64_NE: u8 = 0x62;
const OP_F64_LT: u8 = 0x63;
const OP_F64_GT: u8 = 0x64;
const OP_F64_LE: u8 = 0x65;
const OP_F64_GE: u8 = 0x66;
const OP_F64_ADD: u8 = 0xa0;
const OP_F64_SUB: u8 = 0xa1;
const OP_F64_MUL: u8 = 0xa2;
const OP_F64_DIV: u8 = 0xa3;
const OP_I32_TRUNC_F64_S: u8 = 0xaa;
const OP_F64_CONVERT_I32_S: u8 = 0xb7;

/// Emit a standalone WebAssembly module from validated IVM-13.
///
/// The generated module exports:
/// - `i13_run` — resets the program globals and executes main.
/// - `i13.global.<name>` — mutable f64 value for each I13 global.
/// - `i13.state.<name>` — mutable i32 declaration/binding state for each global.
///
/// User functions are placed in a Wasm table. IVM function handles remain numeric
/// table indices, and IVM Call lowers to `call_indirect`, preserving recursive calls
/// without using the Rust host stack.
pub fn emit(program: &IvmProgram) -> Result<Vec<u8>, Diagnostic> {
    if let Err(mut errors) = validator::validate(program) {
        return Err(errors.remove(0));
    }

    let max_arity = max_arity(program);
    let mut module = Vec::new();
    module.extend_from_slice(b"\0asm");
    module.extend_from_slice(&[0x01, 0x00, 0x00, 0x00]);

    emit_type_section(&mut module, max_arity);
    emit_function_section(&mut module, program);
    emit_table_section(&mut module, program.functions.len());
    emit_global_section(&mut module, program.globals.len());
    emit_export_section(&mut module, program);
    emit_element_section(&mut module, program.functions.len());
    emit_code_section(&mut module, program)?;

    Ok(module)
}

fn max_arity(program: &IvmProgram) -> usize {
    let mut max = program.functions.iter().map(|f| f.params.len()).max().unwrap_or(0);
    for inst in program.main.iter().chain(program.functions.iter().flat_map(|f| f.code.iter())) {
        if inst.op == Op::Call && inst.a > 0 {
            max = max.max(inst.a as usize);
        }
    }
    max
}

fn emit_type_section(module: &mut Vec<u8>, max_arity: usize) {
    let mut payload = Vec::new();
    // type 0: i13_run () -> ()
    // type (arity + 1): (f64 x arity) -> f64
    u32_leb((max_arity + 2) as u32, &mut payload);
    payload.push(0x60);
    u32_leb(0, &mut payload);
    u32_leb(0, &mut payload);

    for arity in 0..=max_arity {
        payload.push(0x60);
        u32_leb(arity as u32, &mut payload);
        for _ in 0..arity { payload.push(F64); }
        u32_leb(1, &mut payload);
        payload.push(F64);
    }
    section(1, payload, module);
}

fn emit_function_section(module: &mut Vec<u8>, program: &IvmProgram) {
    let mut payload = Vec::new();
    u32_leb((1 + program.functions.len()) as u32, &mut payload);
    u32_leb(0, &mut payload); // i13_run
    for function in &program.functions {
        u32_leb((function.params.len() + 1) as u32, &mut payload);
    }
    section(3, payload, module);
}

fn emit_table_section(module: &mut Vec<u8>, function_count: usize) {
    let mut payload = Vec::new();
    u32_leb(1, &mut payload);
    payload.push(FUNCREF);
    payload.push(0x00); // min only
    u32_leb(function_count as u32, &mut payload);
    section(4, payload, module);
}

fn emit_global_section(module: &mut Vec<u8>, global_count: usize) {
    let mut payload = Vec::new();
    u32_leb((global_count * 2) as u32, &mut payload);

    // Value plane: mutable f64 globals.
    for _ in 0..global_count {
        payload.push(F64);
        payload.push(0x01);
        f64_const(0.0, &mut payload);
        payload.push(OP_END);
    }

    // State plane: mutable i32 globals. 0 = unbound, 1 = bound.
    for _ in 0..global_count {
        payload.push(I32);
        payload.push(0x01);
        i32_const(0, &mut payload);
        payload.push(OP_END);
    }
    section(6, payload, module);
}

fn emit_export_section(module: &mut Vec<u8>, program: &IvmProgram) {
    let mut payload = Vec::new();
    u32_leb((1 + program.globals.len() * 2) as u32, &mut payload);

    string("i13_run", &mut payload);
    payload.push(0x00); // function
    u32_leb(0, &mut payload);

    let global_count = program.globals.len();
    for (slot, name) in program.globals.iter().enumerate() {
        string(&format!("i13.global.{name}"), &mut payload);
        payload.push(0x03); // global
        u32_leb(slot as u32, &mut payload);

        string(&format!("i13.state.{name}"), &mut payload);
        payload.push(0x03);
        u32_leb((global_count + slot) as u32, &mut payload);
    }
    section(7, payload, module);
}

fn emit_element_section(module: &mut Vec<u8>, function_count: usize) {
    let mut payload = Vec::new();
    u32_leb(1, &mut payload); // one active segment
    u32_leb(0, &mut payload); // flags: active table 0, function indices
    i32_const(0, &mut payload);
    payload.push(OP_END);
    u32_leb(function_count as u32, &mut payload);
    // Function index 0 is i13_run. User function fid N lives at Wasm index N + 1.
    for fid in 0..function_count {
        u32_leb((fid + 1) as u32, &mut payload);
    }
    section(9, payload, module);
}

fn emit_code_section(module: &mut Vec<u8>, program: &IvmProgram) -> Result<(), Diagnostic> {
    let mut payload = Vec::new();
    u32_leb((1 + program.functions.len()) as u32, &mut payload);

    let main_layout = LocalLayout::new(0, 0, &program.main);
    let mut main_body = Vec::new();
    emit_local_decls(&main_layout, &mut main_body);
    emit_main_reset(program.globals.len(), &mut main_body);
    emit_region(program, &program.main, &main_layout, true, &mut main_body)?;
    main_body.push(OP_END);
    sized(main_body, &mut payload);

    for function in &program.functions {
        let layout = LocalLayout::new(function.local_count, function.params.len(), &function.code);
        let mut body = Vec::new();
        emit_local_decls(&layout, &mut body);
        // Parameters are bound on function entry; other local state bits default to zero.
        for slot in 0..function.params.len() {
            i32_const(1, &mut body);
            local_set(layout.state(slot), &mut body);
        }
        emit_region(program, &function.code, &layout, false, &mut body)?;
        // Reference VM rejects falling off a value-returning function. Wasm traps too.
        body.push(OP_UNREACHABLE);
        body.push(OP_END);
        sized(body, &mut payload);
    }

    section(10, payload, module);
    Ok(())
}

fn emit_main_reset(global_count: usize, out: &mut Vec<u8>) {
    for slot in 0..global_count {
        f64_const(0.0, out);
        global_set(slot as u32, out);
        i32_const(0, out);
        global_set((global_count + slot) as u32, out);
    }
}

fn emit_region(
    program: &IvmProgram,
    code: &[Inst],
    layout: &LocalLayout,
    is_main: bool,
    out: &mut Vec<u8>,
) -> Result<(), Diagnostic> {
    let global_count = program.globals.len();

    for inst in code {
        match inst.op {
            Op::Const => f64_const(inst.imm, out),
            Op::Ask => {
                let slot = nonnegative(inst.a, "Ask slot", inst)?;
                match inst.b {
                    1 => {
                        if slot >= global_count {
                            return Err(backend_error(format!("global Ask slot {slot} is out of range"), inst.span.clone()));
                        }
                        require_global_bound(global_count, slot, out);
                        global_get(slot as u32, out);
                    }
                    0 => {
                        if slot >= layout.local_count {
                            return Err(backend_error(format!("local Ask slot {slot} is out of range"), inst.span.clone()));
                        }
                        require_local_bound(layout, slot, out);
                        local_get(slot as u32, out);
                    }
                    other => return Err(backend_error(format!("invalid Ask scope {other}"), inst.span.clone())),
                }
            }
            Op::Attr => {
                return Err(backend_error("Attr reached the Wasm backend without executable semantics", inst.span.clone()));
            }
            Op::Ret => {
                if is_main {
                    return Err(backend_error("Return is not valid in the main Wasm region", inst.span.clone()));
                }
                out.push(OP_RETURN);
            }
            Op::Answer => {
                let slot = nonnegative(inst.a, "Answer slot", inst)?;
                local_set(layout.scratch(0), out); // preserve the value while checking binding state
                match inst.b {
                    answer::LOCAL_DECLARE | answer::LOCAL_ASSIGN => {
                        if slot >= layout.local_count {
                            return Err(backend_error(format!("local Answer slot {slot} is out of range"), inst.span.clone()));
                        }
                        if inst.b == answer::LOCAL_ASSIGN { require_local_bound(layout, slot, out); }
                        local_get(layout.scratch(0), out);
                        local_set(slot as u32, out);
                        i32_const(1, out);
                        local_set(layout.state(slot), out);
                    }
                    answer::GLOBAL_DECLARE | answer::GLOBAL_ASSIGN => {
                        if slot >= global_count {
                            return Err(backend_error(format!("global Answer slot {slot} is out of range"), inst.span.clone()));
                        }
                        if inst.b == answer::GLOBAL_ASSIGN { require_global_bound(global_count, slot, out); }
                        local_get(layout.scratch(0), out);
                        global_set(slot as u32, out);
                        i32_const(1, out);
                        global_set((global_count + slot) as u32, out);
                    }
                    other => return Err(backend_error(format!("invalid Answer mode {other}"), inst.span.clone())),
                }
            }
            Op::Drop => out.push(OP_DROP),
            Op::Bin => match inst.a {
                bin::ADD => out.push(OP_F64_ADD),
                bin::SUB => out.push(OP_F64_SUB),
                bin::MUL => out.push(OP_F64_MUL),
                bin::DIV => emit_checked_div(layout, out),
                other => return Err(backend_error(format!("invalid Bin operator {other}"), inst.span.clone())),
            },
            Op::Cmp => {
                out.push(match inst.a {
                    cmp::LT => OP_F64_LT,
                    cmp::GT => OP_F64_GT,
                    cmp::LTE => OP_F64_LE,
                    cmp::GTE => OP_F64_GE,
                    cmp::EQ => OP_F64_EQ,
                    cmp::NE => OP_F64_NE,
                    other => return Err(backend_error(format!("invalid Cmp operator {other}"), inst.span.clone())),
                });
                out.push(OP_F64_CONVERT_I32_S);
            }
            Op::If => {
                f64_const(0.0, out);
                out.push(OP_F64_NE);
                out.push(OP_IF);
                out.push(EMPTY_BLOCK);
            }
            Op::Call => emit_call(inst, layout, out)?,
            Op::Block => {
                out.push(OP_BLOCK);
                out.push(EMPTY_BLOCK);
            }
            Op::Else => out.push(OP_ELSE),
            Op::End => out.push(OP_END),
            Op::Func => {
                if !is_main {
                    return Err(backend_error("Func binding is only valid in main", inst.span.clone()));
                }
                let slot = nonnegative(inst.a, "Func global slot", inst)?;
                let fid = nonnegative(inst.b, "Func id", inst)?;
                if slot >= global_count || fid >= program.functions.len() {
                    return Err(backend_error("Func binding is out of range", inst.span.clone()));
                }
                f64_const(fid as f64, out);
                global_set(slot as u32, out);
                i32_const(1, out);
                global_set((global_count + slot) as u32, out);
            }
            Op::Halt => {
                if !is_main {
                    return Err(backend_error("Halt is only valid in main", inst.span.clone()));
                }
                out.push(OP_RETURN);
            }
        }
    }
    Ok(())
}

fn emit_checked_div(layout: &LocalLayout, out: &mut Vec<u8>) {
    // IVM division by zero is a runtime error. Native f64.div would produce infinity,
    // so preserve the IVM law with an explicit zero guard before the Wasm division.
    local_set(layout.scratch(0), out); // right
    local_set(layout.scratch(1), out); // left
    local_get(layout.scratch(0), out);
    f64_const(0.0, out);
    out.push(OP_F64_EQ);
    out.push(OP_IF);
    out.push(EMPTY_BLOCK);
    out.push(OP_UNREACHABLE);
    out.push(OP_END);
    local_get(layout.scratch(1), out);
    local_get(layout.scratch(0), out);
    out.push(OP_F64_DIV);
}

fn emit_call(inst: &Inst, layout: &LocalLayout, out: &mut Vec<u8>) -> Result<(), Diagnostic> {
    let argc = nonnegative(inst.a, "Call arity", inst)?;
    if argc > layout.scratch_count {
        return Err(backend_error("Call arity exceeds allocated Wasm scratch locals", inst.span.clone()));
    }

    // IVM stack before Call: [ ... function, arg0, arg1, ... argN ]
    // Wasm call_indirect expects: [ ... arg0, arg1, ... argN, table_index ]
    // Spill arguments, convert the function handle to the table index, then reload.
    for index in (0..argc).rev() {
        local_set(layout.scratch(index), out);
    }
    out.push(OP_I32_TRUNC_F64_S);
    local_set(layout.target_i32, out);
    for index in 0..argc {
        local_get(layout.scratch(index), out);
    }
    local_get(layout.target_i32, out);
    out.push(OP_CALL_INDIRECT);
    u32_leb((argc + 1) as u32, out); // type index
    u32_leb(0, out); // table index
    Ok(())
}

fn require_global_bound(global_count: usize, slot: usize, out: &mut Vec<u8>) {
    global_get((global_count + slot) as u32, out);
    trap_if_zero(out);
}

fn require_local_bound(layout: &LocalLayout, slot: usize, out: &mut Vec<u8>) {
    local_get(layout.state(slot), out);
    trap_if_zero(out);
}

fn trap_if_zero(out: &mut Vec<u8>) {
    out.push(OP_I32_EQZ);
    out.push(OP_IF);
    out.push(EMPTY_BLOCK);
    out.push(OP_UNREACHABLE);
    out.push(OP_END);
}

#[derive(Debug, Clone)]
struct LocalLayout {
    local_count: usize,
    param_count: usize,
    state_base: u32,
    scratch_base: u32,
    scratch_count: usize,
    target_i32: u32,
}

impl LocalLayout {
    fn new(local_count: usize, param_count: usize, code: &[Inst]) -> Self {
        let call_scratch = code.iter()
            .filter(|inst| inst.op == Op::Call && inst.a > 0)
            .map(|inst| inst.a as usize)
            .max()
            .unwrap_or(0);
        let scratch_count = call_scratch.max(2);
        let state_base = local_count as u32;
        let scratch_base = (local_count * 2) as u32;
        let target_i32 = scratch_base + scratch_count as u32;
        Self { local_count, param_count, state_base, scratch_base, scratch_count, target_i32 }
    }

    fn state(&self, slot: usize) -> u32 { self.state_base + slot as u32 }
    fn scratch(&self, slot: usize) -> u32 { self.scratch_base + slot as u32 }
}

fn emit_local_decls(layout: &LocalLayout, out: &mut Vec<u8>) {
    let extra_values = layout.local_count.saturating_sub(layout.param_count);
    let mut groups = Vec::<(usize, u8)>::new();
    if extra_values > 0 { groups.push((extra_values, F64)); }
    if layout.local_count > 0 { groups.push((layout.local_count, I32)); }
    if layout.scratch_count > 0 { groups.push((layout.scratch_count, F64)); }
    groups.push((1, I32)); // call target scratch

    u32_leb(groups.len() as u32, out);
    for (count, ty) in groups {
        u32_leb(count as u32, out);
        out.push(ty);
    }
}

fn nonnegative(raw: i32, label: &str, inst: &Inst) -> Result<usize, Diagnostic> {
    if raw < 0 {
        Err(backend_error(format!("{label} cannot be negative: {raw}"), inst.span.clone()))
    } else {
        Ok(raw as usize)
    }
}

fn backend_error(message: impl Into<String>, span: Span) -> Diagnostic {
    Diagnostic::new(DiagnosticCode::WasmBackend, message, span)
}

fn local_get(index: u32, out: &mut Vec<u8>) { out.push(OP_LOCAL_GET); u32_leb(index, out); }
fn local_set(index: u32, out: &mut Vec<u8>) { out.push(OP_LOCAL_SET); u32_leb(index, out); }
fn global_get(index: u32, out: &mut Vec<u8>) { out.push(OP_GLOBAL_GET); u32_leb(index, out); }
fn global_set(index: u32, out: &mut Vec<u8>) { out.push(OP_GLOBAL_SET); u32_leb(index, out); }

fn i32_const(value: i32, out: &mut Vec<u8>) {
    out.push(OP_I32_CONST);
    i32_leb(value, out);
}

fn f64_const(value: f64, out: &mut Vec<u8>) {
    out.push(OP_F64_CONST);
    out.extend_from_slice(&value.to_le_bytes());
}

fn section(id: u8, payload: Vec<u8>, module: &mut Vec<u8>) {
    module.push(id);
    u32_leb(payload.len() as u32, module);
    module.extend_from_slice(&payload);
}

fn sized(bytes: Vec<u8>, out: &mut Vec<u8>) {
    u32_leb(bytes.len() as u32, out);
    out.extend_from_slice(&bytes);
}

fn string(value: &str, out: &mut Vec<u8>) {
    u32_leb(value.len() as u32, out);
    out.extend_from_slice(value.as_bytes());
}

fn u32_leb(mut value: u32, out: &mut Vec<u8>) {
    loop {
        let mut byte = (value & 0x7f) as u8;
        value >>= 7;
        if value != 0 { byte |= 0x80; }
        out.push(byte);
        if value == 0 { break; }
    }
}

fn i32_leb(mut value: i32, out: &mut Vec<u8>) {
    loop {
        let byte = (value as u8) & 0x7f;
        value >>= 7;
        let sign_set = (byte & 0x40) != 0;
        let done = (value == 0 && !sign_set) || (value == -1 && sign_set);
        out.push(if done { byte } else { byte | 0x80 });
        if done { break; }
    }
}
