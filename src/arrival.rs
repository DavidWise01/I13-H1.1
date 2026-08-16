//! Stage 14.7 arrival execution.
//!
//! Movement only changes the Queen's surface root. Arrival execution is a
//! separate, authority-gated step. The default corpus action is read/resolve;
//! only explicitly registered roots receive a bounded I13 micro-program.
//!
//! Opcode numbers match the preserved I13 v0.4 VM. Stage 14.7 intentionally
//! ports a smaller arrival-safe subset first: Const, Ask, Attr, Answer, Drop,
//! Bin, Cmp, If, Block, Else, End, Halt. Func/Call/Ret are rejected here rather
//! than silently emulated. This is not a claim of full frozen VM parity.

use crate::corpus::fnv1a32;
use crate::{corpus_walker, CortexChild, OlogyPoint};

pub const OP_CONST: u8 = 0;
pub const OP_ASK: u8 = 1;
pub const OP_ATTR: u8 = 2;
pub const OP_RET: u8 = 3;
pub const OP_ANSWER: u8 = 4;
pub const OP_DROP: u8 = 5;
pub const OP_BIN: u8 = 6;
pub const OP_CMP: u8 = 7;
pub const OP_IF: u8 = 8;
pub const OP_CALL: u8 = 9;
pub const OP_BLOCK: u8 = 10;
pub const OP_ELSE: u8 = 11;
pub const OP_END: u8 = 12;
pub const OP_FUNC: u8 = 13;
pub const OP_HALT: u8 = 14;
pub const OPCODE_COUNT: u32 = 15;

const MAX_STACK: usize = 32;
const GLOBAL_COUNT: usize = 5;
const OUTPUT_SLOT: usize = 4;
const HARD_STEP_LIMIT: u32 = 256;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArrivalKind {
    None = 0,
    Context = 1,
    Program = 2,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ArrivalReceipt {
    pub kind: ArrivalKind,
    pub program_id: u8,
    pub result: i32,
    pub steps: u16,
    pub witness: u32,
    pub terminated: bool,
}

#[derive(Debug, Clone, Copy)]
struct Inst {
    op: u8,
    a: i32,
    b: i32,
    imm: f64,
}

const fn inst(op: u8, a: i32, b: i32, imm: f64) -> Inst {
    Inst { op, a, b, imm }
}

// Program 1 is deliberately a contract fixture, not a semantic claim about
// Kovalevskaya: read x and y from the arrived OLOGY root, add them in the I13
// numeric VM, write the result to the private child output slot, then halt.
const PROGRAM_OLOGY_SUM: [Inst; 5] = [
    inst(OP_ASK, 0, 1, 0.0),
    inst(OP_ASK, 1, 1, 0.0),
    inst(OP_BIN, 0, 0, 0.0),
    inst(OP_ANSWER, OUTPUT_SLOT as i32, 2, 0.0),
    inst(OP_HALT, 0, 0, 0.0),
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum VmError {
    StepLimit,
    StackUnderflow,
    StackOverflow,
    BadSlot,
    Unbound,
    AssignUndeclared,
    DivZero,
    BadBin,
    BadCmp,
    BadJump,
    Unsupported,
    BadResult,
    NoHalt,
}

fn known_address(address: u32) -> bool {
    (0..corpus_walker::node_count()).any(|ordinal| corpus_walker::node_address(ordinal) == Some(address))
}

pub fn arrival_kind(address: u32) -> ArrivalKind {
    if !known_address(address) {
        return ArrivalKind::None;
    }
    if address == fnv1a32(b"sonia-003") {
        ArrivalKind::Program
    } else {
        ArrivalKind::Context
    }
}

pub fn arrival_program(address: u32) -> u8 {
    if address == fnv1a32(b"sonia-003") && known_address(address) { 1 } else { 0 }
}

fn pop(stack: &mut [f64; MAX_STACK], sp: &mut usize) -> Result<f64, VmError> {
    if *sp == 0 {
        return Err(VmError::StackUnderflow);
    }
    *sp -= 1;
    Ok(stack[*sp])
}

fn push(stack: &mut [f64; MAX_STACK], sp: &mut usize, value: f64) -> Result<(), VmError> {
    if *sp >= MAX_STACK {
        return Err(VmError::StackOverflow);
    }
    stack[*sp] = value;
    *sp += 1;
    Ok(())
}

fn do_bin(kind: i32, a: f64, b: f64) -> Result<f64, VmError> {
    match kind {
        0 => Ok(a + b),
        1 => Ok(a - b),
        2 => Ok(a * b),
        3 if b == 0.0 => Err(VmError::DivZero),
        3 => Ok(a / b),
        _ => Err(VmError::BadBin),
    }
}

fn do_cmp(kind: i32, a: f64, b: f64) -> Result<f64, VmError> {
    let pass = match kind {
        0 => a < b,
        1 => a > b,
        2 => a <= b,
        3 => a >= b,
        4 => a == b,
        5 => a != b,
        _ => return Err(VmError::BadCmp),
    };
    Ok(if pass { 1.0 } else { 0.0 })
}

fn run_program(code: &[Inst], address: u32, step_limit: u32) -> Result<(i32, u16), VmError> {
    let limit = step_limit.min(HARD_STEP_LIMIT);
    if limit == 0 {
        return Err(VmError::StepLimit);
    }

    let root = OlogyPoint::unpack(address);
    let mut globals = [0.0f64; GLOBAL_COUNT];
    let mut state = [false; GLOBAL_COUNT];
    globals[0] = root.x as f64;
    globals[1] = root.y as f64;
    globals[2] = if corpus_walker::is_evidence(address) { 1.0 } else { 0.0 };
    globals[3] = corpus_walker::neighbor_count(address, false) as f64;
    state[0] = true;
    state[1] = true;
    state[2] = true;
    state[3] = true;

    let mut stack = [0.0f64; MAX_STACK];
    let mut sp = 0usize;
    let mut pc = 0usize;
    let mut steps = 0u32;
    let mut halted = false;

    while pc < code.len() {
        steps = steps.checked_add(1).ok_or(VmError::StepLimit)?;
        if steps > limit {
            return Err(VmError::StepLimit);
        }
        let current = code[pc];
        match current.op {
            OP_CONST => {
                push(&mut stack, &mut sp, current.imm)?;
                pc += 1;
            }
            OP_ASK => {
                if current.b != 1 || current.a < 0 || current.a as usize >= GLOBAL_COUNT {
                    return Err(VmError::BadSlot);
                }
                let slot = current.a as usize;
                if !state[slot] {
                    return Err(VmError::Unbound);
                }
                push(&mut stack, &mut sp, globals[slot])?;
                pc += 1;
            }
            OP_ATTR => {
                if sp == 0 {
                    return Err(VmError::StackUnderflow);
                }
                pc += 1;
            }
            OP_ANSWER => {
                if current.a < 0 || current.a as usize >= GLOBAL_COUNT {
                    return Err(VmError::BadSlot);
                }
                let mode = current.b & 1;
                let scope = (current.b >> 1) & 1;
                if scope != 1 {
                    return Err(VmError::BadSlot);
                }
                let slot = current.a as usize;
                if mode == 1 && !state[slot] {
                    return Err(VmError::AssignUndeclared);
                }
                globals[slot] = pop(&mut stack, &mut sp)?;
                state[slot] = true;
                pc += 1;
            }
            OP_DROP => {
                let _ = pop(&mut stack, &mut sp)?;
                pc += 1;
            }
            OP_BIN => {
                let b = pop(&mut stack, &mut sp)?;
                let a = pop(&mut stack, &mut sp)?;
                let value = do_bin(current.a, a, b)?;
                push(&mut stack, &mut sp, value)?;
                pc += 1;
            }
            OP_CMP => {
                let b = pop(&mut stack, &mut sp)?;
                let a = pop(&mut stack, &mut sp)?;
                let value = do_cmp(current.a, a, b)?;
                push(&mut stack, &mut sp, value)?;
                pc += 1;
            }
            OP_IF => {
                let condition = pop(&mut stack, &mut sp)?;
                if condition == 0.0 {
                    if current.a < 0 || current.a as usize >= code.len() {
                        return Err(VmError::BadJump);
                    }
                    pc = current.a as usize;
                } else {
                    pc += 1;
                }
            }
            OP_ELSE => {
                if current.a < 0 || current.a as usize >= code.len() {
                    return Err(VmError::BadJump);
                }
                pc = current.a as usize;
            }
            OP_BLOCK | OP_END => pc += 1,
            OP_HALT => {
                halted = true;
                break;
            }
            OP_RET | OP_CALL | OP_FUNC => return Err(VmError::Unsupported),
            _ => return Err(VmError::Unsupported),
        }
    }

    if !halted {
        return Err(VmError::NoHalt);
    }
    if sp != 0 || !state[OUTPUT_SLOT] {
        return Err(VmError::BadResult);
    }
    let output = globals[OUTPUT_SLOT];
    if !output.is_finite() || output.fract() != 0.0 || output < i32::MIN as f64 || output > i32::MAX as f64 {
        return Err(VmError::BadResult);
    }
    Ok((output as i32, steps as u16))
}

pub fn witness32(address: u32, result: i32, steps: u16, kind: ArrivalKind, program_id: u8) -> u32 {
    let mut bytes = [0u8; 12];
    bytes[0..4].copy_from_slice(&address.to_le_bytes());
    bytes[4..8].copy_from_slice(&(result as u32).to_le_bytes());
    bytes[8..10].copy_from_slice(&steps.to_le_bytes());
    bytes[10] = kind as u8;
    bytes[11] = program_id;
    fnv1a32(&bytes)
}

pub fn execute_arrival(address: u32, step_limit: u32, authority: bool) -> Option<ArrivalReceipt> {
    if !authority || !known_address(address) {
        return None;
    }

    let kind = arrival_kind(address);
    let program_id = arrival_program(address);
    let (result, steps) = match kind {
        ArrivalKind::Context => (0, 0u16),
        ArrivalKind::Program if program_id == 1 => run_program(&PROGRAM_OLOGY_SUM, address, step_limit).ok()?,
        _ => return None,
    };

    let witness = witness32(address, result, steps, kind, program_id);
    let private_state = ((result as u32 as u64) << 32) | steps as u64;
    let child = CortexChild::spawn(address as u64, 0, 1).execute(private_state, witness as u64);
    if !child.terminated || child.witness as u32 != witness {
        return None;
    }

    Some(ArrivalReceipt {
        kind,
        program_id,
        result,
        steps,
        witness,
        terminated: true,
    })
}

// ---- Stage 14.7 Wasm ABI -------------------------------------------------

#[no_mangle]
pub extern "C" fn i13_arrival_opcode_count() -> u32 { OPCODE_COUNT }

#[no_mangle]
pub extern "C" fn i13_arrival_kind(address: u32) -> u32 { arrival_kind(address) as u32 }

#[no_mangle]
pub extern "C" fn i13_arrival_program(address: u32) -> u32 { arrival_program(address) as u32 }

/// Receipt encoding:
/// bit63 success | bits56..62 kind | bits48..55 program | bits32..47 steps |
/// bits0..31 signed i32 result bits. Zero is VETO.
#[no_mangle]
pub extern "C" fn i13_arrival_execute(address: u32, step_limit: u32, authority: u32) -> u64 {
    let Some(receipt) = execute_arrival(address, step_limit, authority != 0) else { return 0; };
    (1u64 << 63)
        | ((receipt.kind as u64) << 56)
        | ((receipt.program_id as u64) << 48)
        | ((receipt.steps as u64) << 32)
        | (receipt.result as u32 as u64)
}

#[no_mangle]
pub extern "C" fn i13_arrival_witness(address: u32, result_bits: u32, steps: u32, kind: u32, program_id: u32) -> u32 {
    let kind = match kind {
        1 => ArrivalKind::Context,
        2 => ArrivalKind::Program,
        _ => return 0,
    };
    if steps > u16::MAX as u32 || program_id > u8::MAX as u32 {
        return 0;
    }
    witness32(address, result_bits as i32, steps as u16, kind, program_id as u8)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opcode_ids_match_preserved_i13_vm() {
        assert_eq!([
            OP_CONST, OP_ASK, OP_ATTR, OP_RET, OP_ANSWER, OP_DROP, OP_BIN, OP_CMP,
            OP_IF, OP_CALL, OP_BLOCK, OP_ELSE, OP_END, OP_FUNC, OP_HALT,
        ], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        assert_eq!(OPCODE_COUNT, 15);
    }

    #[test]
    fn ordinary_corpus_root_resolves_without_program_execution() {
        let address = fnv1a32(b"sonia-001");
        assert_eq!(arrival_kind(address), ArrivalKind::Context);
        let receipt = execute_arrival(address, 8, true).unwrap();
        assert_eq!(receipt.kind, ArrivalKind::Context);
        assert_eq!(receipt.program_id, 0);
        assert_eq!(receipt.result, 0);
        assert_eq!(receipt.steps, 0);
        assert!(receipt.terminated);
        assert_ne!(receipt.witness, 0);
    }

    #[test]
    fn first_world_iv_hop_has_real_bounded_i13_program() {
        let address = fnv1a32(b"sonia-003");
        assert_eq!(arrival_kind(address), ArrivalKind::Program);
        assert_eq!(arrival_program(address), 1);
        let root = OlogyPoint::unpack(address);
        let receipt = execute_arrival(address, 8, true).unwrap();
        assert_eq!(receipt.result, root.x as i32 + root.y as i32);
        assert_eq!(receipt.steps, 5);
        assert!(receipt.terminated);
    }

    #[test]
    fn execution_requires_authority_and_step_budget() {
        let address = fnv1a32(b"sonia-003");
        assert_eq!(execute_arrival(address, 8, false), None);
        assert_eq!(execute_arrival(address, 4, true), None);
        assert!(execute_arrival(address, 5, true).is_some());
    }

    #[test]
    fn unknown_root_cannot_execute() {
        assert_eq!(arrival_kind(0xffff_fffe), ArrivalKind::None);
        assert_eq!(execute_arrival(0xffff_fffe, 8, true), None);
    }

    #[test]
    fn witness_is_deterministic_and_result_sensitive() {
        let address = fnv1a32(b"sonia-003");
        let a = witness32(address, 7, 5, ArrivalKind::Program, 1);
        let b = witness32(address, 7, 5, ArrivalKind::Program, 1);
        let c = witness32(address, 8, 5, ArrivalKind::Program, 1);
        assert_eq!(a, b);
        assert_ne!(a, c);
    }
}
