use super::{
    diagnostic::{Diagnostic, DiagnosticCode},
    ivm::{answer, bin, cmp, Inst, IvmProgram, Op, I13_FRAME_LIMIT},
    source::Span,
    validator,
};

const I32: u8 = 0x7f;
const F64: u8 = 0x7c;
const FUNCREF: u8 = 0x70;
const EMPTY_BLOCK: u8 = 0x40;

const KIND_NUMBER: i32 = 0;
const KIND_FUNCTION: i32 = 1;

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
const OP_I32_NE: u8 = 0x47;
const OP_I32_GE_U: u8 = 0x4f;
const OP_I32_ADD: u8 = 0x6a;
const OP_I32_SUB: u8 = 0x6b;
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
/// IVM values remain tagged across lowering:
///
/// ```text
/// [ kind:i32 | payload:f64 ]
///
/// NUMBER   = [0 | numeric f64]
/// FUNCTION = [1 | table/function id as f64]
/// ```
///
/// Storage is three-plane:
///
/// ```text
/// [ kind | payload | bound ]
/// ```
///
/// Generated modules export:
/// - `i13_run` — resets the program globals and executes main.
/// - `i13.global.<name>` — mutable f64 payload for each I13 global.
/// - `i13.kind.<name>` — mutable i32 value-kind tag.
/// - `i13.state.<name>` — mutable i32 declaration/binding state.
///
/// User functions accept and return tagged value pairs. Calls use a Wasm table and
/// `call_indirect`, preserving recursion and IVM value identity without Rust host recursion.
/// An internal I13-owned frame-depth global enforces I13_FRAME_LIMIT independent of
/// the host WebAssembly engine's native stack capacity.
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
    // type (arity + 1):
    //   ([kind:i32, payload:f64] x arity) -> [kind:i32, payload:f64]
    u32_leb((max_arity + 2) as u32, &mut payload);

    payload.push(0x60);
    u32_leb(0, &mut payload);
    u32_leb(0, &mut payload);

    for arity in 0..=max_arity {
        payload.push(0x60);
        u32_leb((arity * 2) as u32, &mut payload);
        for _ in 0..arity {
            payload.push(I32);
            payload.push(F64);
        }
        u32_leb(2, &mut payload);
        payload.push(I32);
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
    // Three user-global planes plus one private I13 execution-frame counter.
    u32_leb((global_count * 3 + 1) as u32, &mut payload);

    // Payload plane: mutable f64.
    for _ in 0..global_count {
        payload.push(F64);
        payload.push(0x01);
        f64_const(0.0, &mut payload);
        payload.push(OP_END);
    }

    // Kind plane: mutable i32.
    for _ in 0..global_count {
        payload.push(I32);
        payload.push(0x01);
        i32_const(KIND_NUMBER, &mut payload);
        payload.push(OP_END);
    }

    // Bound-state plane: mutable i32. 0 = unbound, 1 = bound.
    for _ in 0..global_count {
        payload.push(I32);
        payload.push(0x01);
        i32_const(0, &mut payload);
        payload.push(OP_END);
    }

    // Private frame-depth counter. Main/root is frame 1.
    payload.push(I32);
    payload.push(0x01);
    i32_const(1, &mut payload);
    payload.push(OP_END);

    section(6, payload, module);
}

fn emit_export_section(module: &mut Vec<u8>, program: &IvmProgram) {
    let mut payload = Vec::new();
    u32_leb((1 + program.globals.len() * 3) as u32, &mut payload);

    string("i13_run", &mut payload);
    payload.push(0x00); // function
    u32_leb(0, &mut payload);

    let global_count = program.globals.len();
    for (slot, name) in program.globals.iter().enumerate() {
        string(&format!("i13.global.{name}"), &mut payload);
        payload.push(0x03);
        u32_leb(global_value_index(slot) as u32, &mut payload);

        string(&format!("i13.kind.{name}"), &mut payload);
        payload.push(0x03);
        u32_leb(global_kind_index(global_count, slot) as u32, &mut payload);

        string(&format!("i13.state.{name}"), &mut payload);
        payload.push(0x03);
        u32_leb(global_bound_index(global_count, slot) as u32, &mut payload);
    }

    section(7, payload, module);
}

fn emit_element_section(module: &mut Vec<u8>, function_count: usize) {
    let mut payload = Vec::new();
    u32_leb(1, &mut payload);
    u32_leb(0, &mut payload); // active table 0
    i32_const(0, &mut payload);
    payload.push(OP_END);
    u32_leb(function_count as u32, &mut payload);

    // Wasm function index 0 is i13_run. User function fid N is index N + 1.
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

        // Parameters arrive as tagged pairs and are bound on function entry.
        for slot in 0..function.params.len() {
            i32_const(1, &mut body);
            local_set(layout.bound(slot), &mut body);
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
        global_set(global_value_index(slot) as u32, out);

        i32_const(KIND_NUMBER, out);
        global_set(global_kind_index(global_count, slot) as u32, out);

        i32_const(0, out);
        global_set(global_bound_index(global_count, slot) as u32, out);
    }

    // The root/main execution frame is always frame 1.
    i32_const(1, out);
    global_set(frame_depth_index(global_count) as u32, out);
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
            Op::MakeArray | Op::Index | Op::ArraySet => {
                return Err(backend_error(
                    "arrays are not yet supported in the wasm backend; use `i13 run` (reference VM) for now",
                    inst.span.clone(),
                ));
            }
            Op::ToBig => {
                return Err(backend_error(
                    "bignum (big) is not yet supported in the wasm backend; use `i13 run` (reference VM) for now",
                    inst.span.clone(),
                ));
            }
            Op::Const => {
                i32_const(KIND_NUMBER, out);
                f64_const(inst.imm, out);
            }
            Op::Ask => {
                let slot = nonnegative(inst.a, "Ask slot", inst)?;
                match inst.b {
                    1 => {
                        if slot >= global_count {
                            return Err(backend_error(
                                format!("global Ask slot {slot} is out of range"),
                                inst.span.clone(),
                            ));
                        }
                        require_global_bound(global_count, slot, out);
                        global_get(global_kind_index(global_count, slot) as u32, out);
                        global_get(global_value_index(slot) as u32, out);
                    }
                    0 => {
                        if slot >= layout.local_count {
                            return Err(backend_error(
                                format!("local Ask slot {slot} is out of range"),
                                inst.span.clone(),
                            ));
                        }
                        require_local_bound(layout, slot, out);
                        local_get(layout.kind(slot), out);
                        local_get(layout.value(slot), out);
                    }
                    other => {
                        return Err(backend_error(
                            format!("invalid Ask scope {other}"),
                            inst.span.clone(),
                        ))
                    }
                }
            }
            Op::Attr => {
                return Err(backend_error(
                    "Attr reached the Wasm backend without executable semantics",
                    inst.span.clone(),
                ));
            }
            Op::Ret => {
                if is_main {
                    return Err(backend_error(
                        "Return is not valid in the main Wasm region",
                        inst.span.clone(),
                    ));
                }
                out.push(OP_RETURN);
            }
            Op::Answer => {
                let slot = nonnegative(inst.a, "Answer slot", inst)?;

                // Expression stack is [kind, payload]. Preserve both before checking state.
                local_set(layout.scratch_value(0), out);
                local_set(layout.scratch_kind(0), out);

                match inst.b {
                    answer::LOCAL_DECLARE | answer::LOCAL_ASSIGN => {
                        if slot >= layout.local_count {
                            return Err(backend_error(
                                format!("local Answer slot {slot} is out of range"),
                                inst.span.clone(),
                            ));
                        }
                        if inst.b == answer::LOCAL_ASSIGN {
                            require_local_bound(layout, slot, out);
                        }

                        local_get(layout.scratch_value(0), out);
                        local_set(layout.value(slot), out);
                        local_get(layout.scratch_kind(0), out);
                        local_set(layout.kind(slot), out);
                        i32_const(1, out);
                        local_set(layout.bound(slot), out);
                    }
                    answer::GLOBAL_DECLARE | answer::GLOBAL_ASSIGN => {
                        if slot >= global_count {
                            return Err(backend_error(
                                format!("global Answer slot {slot} is out of range"),
                                inst.span.clone(),
                            ));
                        }
                        if inst.b == answer::GLOBAL_ASSIGN {
                            require_global_bound(global_count, slot, out);
                        }

                        local_get(layout.scratch_value(0), out);
                        global_set(global_value_index(slot) as u32, out);
                        local_get(layout.scratch_kind(0), out);
                        global_set(global_kind_index(global_count, slot) as u32, out);
                        i32_const(1, out);
                        global_set(global_bound_index(global_count, slot) as u32, out);
                    }
                    other => {
                        return Err(backend_error(
                            format!("invalid Answer mode {other}"),
                            inst.span.clone(),
                        ))
                    }
                }
            }
            Op::Drop => {
                out.push(OP_DROP); // payload
                out.push(OP_DROP); // kind
            }
            Op::Bin => emit_numeric_bin(inst, layout, out)?,
            Op::Cmp => emit_numeric_cmp(inst, layout, out)?,
            Op::If => {
                // IVM If requires a numeric condition.
                local_set(layout.scratch_value(0), out);
                local_set(layout.scratch_kind(0), out);
                require_local_kind(layout.scratch_kind(0), KIND_NUMBER, out);
                local_get(layout.scratch_value(0), out);
                f64_const(0.0, out);
                out.push(OP_F64_NE);
                out.push(OP_IF);
                out.push(EMPTY_BLOCK);
            }
            Op::Call => emit_call(inst, layout, global_count, out)?,
            Op::Block => {
                out.push(OP_BLOCK);
                out.push(EMPTY_BLOCK);
            }
            Op::Else => out.push(OP_ELSE),
            Op::End => out.push(OP_END),
            Op::Func => {
                if !is_main {
                    return Err(backend_error(
                        "Func binding is only valid in main",
                        inst.span.clone(),
                    ));
                }

                let slot = nonnegative(inst.a, "Func global slot", inst)?;
                let fid = nonnegative(inst.b, "Func id", inst)?;
                if slot >= global_count || fid >= program.functions.len() {
                    return Err(backend_error("Func binding is out of range", inst.span.clone()));
                }

                f64_const(fid as f64, out);
                global_set(global_value_index(slot) as u32, out);
                i32_const(KIND_FUNCTION, out);
                global_set(global_kind_index(global_count, slot) as u32, out);
                i32_const(1, out);
                global_set(global_bound_index(global_count, slot) as u32, out);
            }
            Op::Halt => {
                if !is_main {
                    return Err(backend_error(
                        "Halt is only valid in main",
                        inst.span.clone(),
                    ));
                }
                out.push(OP_RETURN);
            }
        }
    }

    Ok(())
}

fn emit_numeric_bin(inst: &Inst, layout: &LocalLayout, out: &mut Vec<u8>) -> Result<(), Diagnostic> {
    spill_binary_values(layout, out);
    require_local_kind(layout.scratch_kind(1), KIND_NUMBER, out);
    require_local_kind(layout.scratch_kind(0), KIND_NUMBER, out);

    i32_const(KIND_NUMBER, out);
    match inst.a {
        bin::ADD => {
            local_get(layout.scratch_value(1), out);
            local_get(layout.scratch_value(0), out);
            out.push(OP_F64_ADD);
        }
        bin::SUB => {
            local_get(layout.scratch_value(1), out);
            local_get(layout.scratch_value(0), out);
            out.push(OP_F64_SUB);
        }
        bin::MUL => {
            local_get(layout.scratch_value(1), out);
            local_get(layout.scratch_value(0), out);
            out.push(OP_F64_MUL);
        }
        bin::DIV => emit_checked_div(layout, out),
        bin::MOD => {
            return Err(backend_error(
                "modulo (%) is not yet supported in the wasm backend; use `i13 run` (reference VM) for now",
                inst.span.clone(),
            ))
        }
        bin::AND | bin::OR | bin::XOR | bin::SHL | bin::SHR => {
            return Err(backend_error(
                "bitwise operators (& | ^ << >>) are not yet supported in the wasm backend; use `i13 run` (reference VM) for now",
                inst.span.clone(),
            ))
        }
        other => {
            return Err(backend_error(
                format!("invalid Bin operator {other}"),
                inst.span.clone(),
            ))
        }
    }

    Ok(())
}

fn emit_numeric_cmp(inst: &Inst, layout: &LocalLayout, out: &mut Vec<u8>) -> Result<(), Diagnostic> {
    spill_binary_values(layout, out);
    require_local_kind(layout.scratch_kind(1), KIND_NUMBER, out);
    require_local_kind(layout.scratch_kind(0), KIND_NUMBER, out);

    i32_const(KIND_NUMBER, out);
    local_get(layout.scratch_value(1), out);
    local_get(layout.scratch_value(0), out);
    out.push(match inst.a {
        cmp::LT => OP_F64_LT,
        cmp::GT => OP_F64_GT,
        cmp::LTE => OP_F64_LE,
        cmp::GTE => OP_F64_GE,
        cmp::EQ => OP_F64_EQ,
        cmp::NE => OP_F64_NE,
        other => {
            return Err(backend_error(
                format!("invalid Cmp operator {other}"),
                inst.span.clone(),
            ))
        }
    });
    out.push(OP_F64_CONVERT_I32_S);

    Ok(())
}

fn spill_binary_values(layout: &LocalLayout, out: &mut Vec<u8>) {
    // IVM logical stack: [..., left(kind,payload), right(kind,payload)]
    local_set(layout.scratch_value(0), out);
    local_set(layout.scratch_kind(0), out);
    local_set(layout.scratch_value(1), out);
    local_set(layout.scratch_kind(1), out);
}

fn emit_checked_div(layout: &LocalLayout, out: &mut Vec<u8>) {
    // IVM division by zero is a runtime error. Native f64.div would produce infinity.
    local_get(layout.scratch_value(0), out);
    f64_const(0.0, out);
    out.push(OP_F64_EQ);
    out.push(OP_IF);
    out.push(EMPTY_BLOCK);
    out.push(OP_UNREACHABLE);
    out.push(OP_END);

    local_get(layout.scratch_value(1), out);
    local_get(layout.scratch_value(0), out);
    out.push(OP_F64_DIV);
}

fn emit_call(inst: &Inst, layout: &LocalLayout, global_count: usize, out: &mut Vec<u8>) -> Result<(), Diagnostic> {
    let argc = nonnegative(inst.a, "Call arity", inst)?;
    if argc > layout.scratch_count {
        return Err(backend_error(
            "Call arity exceeds allocated Wasm scratch locals",
            inst.span.clone(),
        ));
    }

    // IVM stack before Call:
    // [... function(kind,payload), arg0(kind,payload), ..., argN(kind,payload)]
    //
    // Wasm call_indirect expects the physical argument list followed by table index.
    for index in (0..argc).rev() {
        local_set(layout.scratch_value(index), out);
        local_set(layout.scratch_kind(index), out);
    }

    local_set(layout.target_value, out);
    local_set(layout.target_kind, out);
    require_local_kind(layout.target_kind, KIND_FUNCTION, out);

    local_get(layout.target_value, out);
    out.push(OP_I32_TRUNC_F64_S);
    local_set(layout.target_i32, out);

    // I13-EXEC-LIMIT-001: main/root counts as frame 1. A Call is legal only
    // while the current active frame count is strictly below I13_FRAME_LIMIT.
    global_get(frame_depth_index(global_count) as u32, out);
    i32_const(I13_FRAME_LIMIT as i32, out);
    out.push(OP_I32_GE_U);
    trap_if_nonzero(out);

    global_get(frame_depth_index(global_count) as u32, out);
    i32_const(1, out);
    out.push(OP_I32_ADD);
    global_set(frame_depth_index(global_count) as u32, out);

    for index in 0..argc {
        local_get(layout.scratch_kind(index), out);
        local_get(layout.scratch_value(index), out);
    }

    local_get(layout.target_i32, out);
    out.push(OP_CALL_INDIRECT);
    u32_leb((argc + 1) as u32, out);
    u32_leb(0, out);

    // Successful return closes exactly one active I13 frame. If the call traps,
    // this code is not reached; the next i13_run resets the counter to root=1.
    global_get(frame_depth_index(global_count) as u32, out);
    i32_const(1, out);
    out.push(OP_I32_SUB);
    global_set(frame_depth_index(global_count) as u32, out);

    Ok(())
}

fn require_global_bound(global_count: usize, slot: usize, out: &mut Vec<u8>) {
    global_get(global_bound_index(global_count, slot) as u32, out);
    trap_if_zero(out);
}

fn require_local_bound(layout: &LocalLayout, slot: usize, out: &mut Vec<u8>) {
    local_get(layout.bound(slot), out);
    trap_if_zero(out);
}

fn require_local_kind(kind_local: u32, expected: i32, out: &mut Vec<u8>) {
    local_get(kind_local, out);
    i32_const(expected, out);
    out.push(OP_I32_NE);
    trap_if_nonzero(out);
}

fn trap_if_zero(out: &mut Vec<u8>) {
    out.push(OP_I32_EQZ);
    trap_if_nonzero(out);
}

fn trap_if_nonzero(out: &mut Vec<u8>) {
    out.push(OP_IF);
    out.push(EMPTY_BLOCK);
    out.push(OP_UNREACHABLE);
    out.push(OP_END);
}

fn global_value_index(slot: usize) -> usize {
    slot
}

fn global_kind_index(global_count: usize, slot: usize) -> usize {
    global_count + slot
}

fn global_bound_index(global_count: usize, slot: usize) -> usize {
    global_count * 2 + slot
}

fn frame_depth_index(global_count: usize) -> usize {
    global_count * 3
}

#[derive(Debug, Clone)]
struct LocalLayout {
    local_count: usize,
    param_count: usize,
    extra_count: usize,
    extra_value_base: u32,
    extra_kind_base: u32,
    bound_base: u32,
    scratch_value_base: u32,
    scratch_kind_base: u32,
    scratch_count: usize,
    target_value: u32,
    target_kind: u32,
    target_i32: u32,
}

impl LocalLayout {
    fn new(local_count: usize, param_count: usize, code: &[Inst]) -> Self {
        let call_scratch = code
            .iter()
            .filter(|inst| inst.op == Op::Call && inst.a > 0)
            .map(|inst| inst.a as usize)
            .max()
            .unwrap_or(0);

        // Binary/compare operations always need two tagged scratch values.
        let scratch_count = call_scratch.max(2);
        let extra_count = local_count.saturating_sub(param_count);

        // Wasm parameters are [kind,payload] pairs, so they occupy 2 * param_count indices.
        let params_end = (param_count * 2) as u32;
        let extra_value_base = params_end;
        let extra_kind_base = extra_value_base + extra_count as u32;
        let bound_base = extra_kind_base + extra_count as u32;
        let scratch_value_base = bound_base + local_count as u32;
        let scratch_kind_base = scratch_value_base + scratch_count as u32;
        let target_value = scratch_kind_base + scratch_count as u32;
        let target_kind = target_value + 1;
        let target_i32 = target_kind + 1;

        Self {
            local_count,
            param_count,
            extra_count,
            extra_value_base,
            extra_kind_base,
            bound_base,
            scratch_value_base,
            scratch_kind_base,
            scratch_count,
            target_value,
            target_kind,
            target_i32,
        }
    }

    fn value(&self, slot: usize) -> u32 {
        if slot < self.param_count {
            (slot * 2 + 1) as u32
        } else {
            self.extra_value_base + (slot - self.param_count) as u32
        }
    }

    fn kind(&self, slot: usize) -> u32 {
        if slot < self.param_count {
            (slot * 2) as u32
        } else {
            self.extra_kind_base + (slot - self.param_count) as u32
        }
    }

    fn bound(&self, slot: usize) -> u32 {
        self.bound_base + slot as u32
    }

    fn scratch_value(&self, slot: usize) -> u32 {
        self.scratch_value_base + slot as u32
    }

    fn scratch_kind(&self, slot: usize) -> u32 {
        self.scratch_kind_base + slot as u32
    }
}

fn emit_local_decls(layout: &LocalLayout, out: &mut Vec<u8>) {
    let mut groups = Vec::<(usize, u8)>::new();

    if layout.extra_count > 0 {
        groups.push((layout.extra_count, F64));
        groups.push((layout.extra_count, I32));
    }
    if layout.local_count > 0 {
        groups.push((layout.local_count, I32)); // bound bits
    }
    if layout.scratch_count > 0 {
        groups.push((layout.scratch_count, F64));
        groups.push((layout.scratch_count, I32));
    }

    groups.push((1, F64)); // target payload
    groups.push((1, I32)); // target kind
    groups.push((1, I32)); // call target table index

    u32_leb(groups.len() as u32, out);
    for (count, ty) in groups {
        u32_leb(count as u32, out);
        out.push(ty);
    }
}

fn nonnegative(raw: i32, label: &str, inst: &Inst) -> Result<usize, Diagnostic> {
    if raw < 0 {
        Err(backend_error(
            format!("{label} cannot be negative: {raw}"),
            inst.span.clone(),
        ))
    } else {
        Ok(raw as usize)
    }
}

fn backend_error(message: impl Into<String>, span: Span) -> Diagnostic {
    Diagnostic::new(DiagnosticCode::WasmBackend, message, span)
}

fn local_get(index: u32, out: &mut Vec<u8>) {
    out.push(OP_LOCAL_GET);
    u32_leb(index, out);
}

fn local_set(index: u32, out: &mut Vec<u8>) {
    out.push(OP_LOCAL_SET);
    u32_leb(index, out);
}

fn global_get(index: u32, out: &mut Vec<u8>) {
    out.push(OP_GLOBAL_GET);
    u32_leb(index, out);
}

fn global_set(index: u32, out: &mut Vec<u8>) {
    out.push(OP_GLOBAL_SET);
    u32_leb(index, out);
}

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
        if value != 0 {
            byte |= 0x80;
        }
        out.push(byte);
        if value == 0 {
            break;
        }
    }
}

fn i32_leb(mut value: i32, out: &mut Vec<u8>) {
    loop {
        let byte = (value as u8) & 0x7f;
        value >>= 7;
        let sign_set = (byte & 0x40) != 0;
        let done = (value == 0 && !sign_set) || (value == -1 && sign_set);
        out.push(if done { byte } else { byte | 0x80 });
        if done {
            break;
        }
    }
}
