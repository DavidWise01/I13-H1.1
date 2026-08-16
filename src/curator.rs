//! Stage 14.9 bounded corpus inlet / curator.
//!
//! Canonical scaffold:
//! [c[v[corpus[curator[[ (source), (context), (candidate), {skill} ]]]]cv]
//!
//! The curator may observe, compare, and propose. It never writes corpus data,
//! moves the Queen, creates navigation pending state, or grants itself commit
//! authority. The returned proposal must still pass the outer Cortex verifier.

use crate::corpus::fnv1a32;
use crate::{corpus_walker, CortexChild};

pub const CURATOR_PROTOCOL_VERSION: u32 = 1;

pub const CAP_OBSERVE: u32 = 0x0001;
pub const CAP_COMPARE: u32 = 0x0002;
pub const CAP_PROPOSE: u32 = 0x0004;
pub const CAP_PROVENANCE: u32 = 0x0008;
pub const CAP_RELATE: u32 = 0x0010;
pub const CAP_CODE_INSPECT: u32 = 0x0020;
pub const CAP_BASE: u32 = CAP_OBSERVE | CAP_COMPARE | CAP_PROPOSE;

pub const SKILL_BIBLIOGRAPHY: u32 = 1;
pub const SKILL_MATHEMATICS: u32 = 2;
pub const SKILL_CODE: u32 = 3;

pub const STATUS_NEW_ROOT: u8 = 1;
pub const STATUS_ADDRESS_OCCUPIED: u8 = 2;

const MAX_SOURCE_BYTES: u32 = 4096;
const MAX_ID_BYTES: u32 = 64;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CuratorReceipt {
    pub skill: u8,
    pub status: u8,
    pub mask: u16,
    pub witness: u32,
    pub terminated: bool,
}

fn known_address(address: u32) -> bool {
    (0..corpus_walker::node_count()).any(|ordinal| corpus_walker::node_address(ordinal) == Some(address))
}

pub const fn skill_mask(skill: u32) -> Option<u32> {
    match skill {
        SKILL_BIBLIOGRAPHY => Some(CAP_BASE | CAP_PROVENANCE),
        SKILL_MATHEMATICS => Some(CAP_BASE | CAP_RELATE),
        SKILL_CODE => Some(CAP_BASE | CAP_CODE_INSPECT),
        _ => None,
    }
}

pub fn candidate_status(candidate_address: u32) -> u8 {
    if known_address(candidate_address) {
        STATUS_ADDRESS_OCCUPIED
    } else {
        STATUS_NEW_ROOT
    }
}

fn curator_witness32(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    status: u8,
    mask: u16,
) -> u32 {
    let mut bytes = [0u8; 36];
    bytes[0..4].copy_from_slice(b"CUR9");
    bytes[4..8].copy_from_slice(&source_fingerprint.to_le_bytes());
    bytes[8..12].copy_from_slice(&source_bytes.to_le_bytes());
    bytes[12..16].copy_from_slice(&context_address.to_le_bytes());
    bytes[16..20].copy_from_slice(&candidate_address.to_le_bytes());
    bytes[20..24].copy_from_slice(&candidate_bytes.to_le_bytes());
    bytes[24..28].copy_from_slice(&skill.to_le_bytes());
    bytes[28] = status;
    bytes[29..31].copy_from_slice(&mask.to_le_bytes());
    bytes[31] = CURATOR_PROTOCOL_VERSION as u8;
    bytes[32..36].copy_from_slice(&corpus_walker::source_fingerprint().to_le_bytes());
    fnv1a32(&bytes)
}

pub fn curate(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    authority: bool,
) -> Option<CuratorReceipt> {
    if !authority
        || source_bytes == 0
        || source_bytes > MAX_SOURCE_BYTES
        || candidate_bytes == 0
        || candidate_bytes > MAX_ID_BYTES
        || !known_address(context_address)
    {
        return None;
    }

    let mask = skill_mask(skill)?;
    let mask16 = u16::try_from(mask).ok()?;
    let status = candidate_status(candidate_address);
    let witness = curator_witness32(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        status,
        mask16,
    );

    // Ephemeral curator state dies with the child. Only the witnessed proposal
    // receipt escapes. No corpus mutation API exists in this stage.
    let private_state = ((source_fingerprint as u64) << 32) | candidate_address as u64;
    let child = CortexChild::spawn(candidate_address as u64, 0, 1)
        .execute(private_state, witness as u64);
    if !child.terminated || child.witness as u32 != witness {
        return None;
    }

    Some(CuratorReceipt {
        skill: skill as u8,
        status,
        mask: mask16,
        witness,
        terminated: true,
    })
}

pub fn verify_curator_receipt(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    status: u32,
    mask: u32,
    witness: u32,
    authority: bool,
) -> bool {
    let Some(expected) = curate(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        authority,
    ) else {
        return false;
    };

    expected.status as u32 == status
        && expected.mask as u32 == mask
        && expected.witness == witness
        && expected.skill as u32 == skill
        && expected.terminated
}

#[no_mangle]
pub extern "C" fn i13_curator_protocol_version() -> u32 {
    CURATOR_PROTOCOL_VERSION
}

#[no_mangle]
pub extern "C" fn i13_curator_skill_mask(skill: u32) -> u32 {
    skill_mask(skill).unwrap_or(0)
}

#[no_mangle]
pub extern "C" fn i13_curator_status(candidate_address: u32) -> u32 {
    candidate_status(candidate_address) as u32
}

/// Proposal encoding:
/// bit63 success | bits56..62 status | bits48..55 skill |
/// bits32..47 capability mask | bits0..31 witness.
#[no_mangle]
pub extern "C" fn i13_curator_propose(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    authority: u32,
) -> u64 {
    let Some(receipt) = curate(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        authority != 0,
    ) else {
        return 0;
    };

    (1u64 << 63)
        | ((receipt.status as u64) << 56)
        | ((receipt.skill as u64) << 48)
        | ((receipt.mask as u64) << 32)
        | receipt.witness as u64
}

/// Outer curator CV. PASS=1, VETO=0. This verifies the proposal only; it does
/// not commit, overwrite, append, route, or execute corpus material.
#[no_mangle]
pub extern "C" fn i13_curator_cv(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    status: u32,
    mask: u32,
    witness: u32,
    authority: u32,
) -> u32 {
    verify_curator_receipt(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        status,
        mask,
        witness,
        authority != 0,
    ) as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skills_are_bounded_and_never_contain_write_authority() {
        assert_eq!(skill_mask(SKILL_BIBLIOGRAPHY), Some(0x000f));
        assert_eq!(skill_mask(SKILL_MATHEMATICS), Some(0x0017));
        assert_eq!(skill_mask(SKILL_CODE), Some(0x0027));
        assert_eq!(skill_mask(99), None);
    }

    #[test]
    fn curator_proposes_new_root_without_mutating_corpus() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-test-001");
        assert_eq!(candidate_status(candidate), STATUS_NEW_ROOT);
        let receipt = curate(0x1234_5678, 128, context, candidate, 16, SKILL_BIBLIOGRAPHY, true).unwrap();
        assert_eq!(receipt.status, STATUS_NEW_ROOT);
        assert_eq!(receipt.mask, 0x000f);
        assert!(receipt.terminated);
        assert_ne!(receipt.witness, 0);
        assert_eq!(candidate_status(candidate), STATUS_NEW_ROOT);
    }

    #[test]
    fn occupied_address_is_hold_not_overwrite() {
        let context = fnv1a32(b"sonia-003");
        let occupied = fnv1a32(b"sonia-003");
        let receipt = curate(0x89ab_cdef, 64, context, occupied, 9, SKILL_MATHEMATICS, true).unwrap();
        assert_eq!(receipt.status, STATUS_ADDRESS_OCCUPIED);
        assert!(known_address(occupied));
    }

    #[test]
    fn authority_bounds_and_context_are_mandatory() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-test-002");
        assert_eq!(curate(1, 1, context, candidate, 1, SKILL_CODE, false), None);
        assert_eq!(curate(1, 0, context, candidate, 1, SKILL_CODE, true), None);
        assert_eq!(curate(1, 4097, context, candidate, 1, SKILL_CODE, true), None);
        assert_eq!(curate(1, 1, 0xffff_fffe, candidate, 1, SKILL_CODE, true), None);
        assert_eq!(curate(1, 1, context, candidate, 65, SKILL_CODE, true), None);
        assert_eq!(curate(1, 1, context, candidate, 1, 99, true), None);
    }

    #[test]
    fn outer_cv_rejects_tampered_curator_receipt() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-test-003");
        let receipt = curate(0xfeed_beef, 32, context, candidate, 16, SKILL_CODE, true).unwrap();
        assert!(verify_curator_receipt(0xfeed_beef, 32, context, candidate, 16, SKILL_CODE, receipt.status as u32, receipt.mask as u32, receipt.witness, true));
        assert!(!verify_curator_receipt(0xfeed_beef, 32, context, candidate, 16, SKILL_CODE, receipt.status as u32, receipt.mask as u32, receipt.witness ^ 1, true));
    }
}
