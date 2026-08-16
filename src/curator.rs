//! Stage 14.9.1 bounded corpus inlet / curator.
//!
//! Canonical scaffold:
//! [c[v[corpus[curator[[ (source), (context), (candidate), {skill}, {personas}, {occupation} ]]]]cv]
//!
//! The curator may observe, compare, and propose. Skill and occupation bound
//! capability; personas are interpretive lenses only and add zero authority.
//! The curator never writes corpus data, moves the Queen, creates navigation
//! pending state, or grants itself commit authority. The returned proposal must
//! still pass the outer Cortex verifier.

use crate::corpus::fnv1a32;
use crate::{corpus_walker, CortexChild};

pub const CURATOR_PROTOCOL_VERSION: u32 = 2;
const LEGACY_PROTOCOL_VERSION: u8 = 1;

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

pub const PERSONA_ARCHIVIST: u32 = 0x01;
pub const PERSONA_MATHEMATICIAN: u32 = 0x02;
pub const PERSONA_SKEPTIC: u32 = 0x04;
pub const PERSONA_ENGINEER: u32 = 0x08;
pub const PERSONA_ALL: u32 =
    PERSONA_ARCHIVIST | PERSONA_MATHEMATICIAN | PERSONA_SKEPTIC | PERSONA_ENGINEER;

pub const OCCUPATION_INGEST: u32 = 1;
pub const OCCUPATION_REVIEW: u32 = 2;
pub const OCCUPATION_CLASSIFY: u32 = 3;
pub const OCCUPATION_RELATE: u32 = 4;
pub const OCCUPATION_DUPLICATE_AUDIT: u32 = 5;

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CuratorReceiptV2 {
    pub skill: u8,
    pub personas: u8,
    pub occupation: u8,
    pub status: u8,
    pub mask: u16,
    pub witness: u32,
    pub terminated: bool,
}

fn known_address(address: u32) -> bool {
    (0..corpus_walker::node_count())
        .any(|ordinal| corpus_walker::node_address(ordinal) == Some(address))
}

pub const fn skill_mask(skill: u32) -> Option<u32> {
    match skill {
        SKILL_BIBLIOGRAPHY => Some(CAP_BASE | CAP_PROVENANCE),
        SKILL_MATHEMATICS => Some(CAP_BASE | CAP_RELATE),
        SKILL_CODE => Some(CAP_BASE | CAP_CODE_INSPECT),
        _ => None,
    }
}

pub const fn persona_mask_valid(personas: u32) -> bool {
    personas != 0 && (personas & !PERSONA_ALL) == 0
}

pub const fn occupation_mask(occupation: u32) -> Option<u32> {
    match occupation {
        OCCUPATION_INGEST => Some(CAP_BASE | CAP_PROVENANCE),
        OCCUPATION_REVIEW => Some(CAP_BASE),
        OCCUPATION_CLASSIFY => Some(CAP_BASE | CAP_RELATE),
        OCCUPATION_RELATE => Some(CAP_BASE | CAP_RELATE),
        OCCUPATION_DUPLICATE_AUDIT => Some(CAP_BASE | CAP_PROVENANCE),
        _ => None,
    }
}

pub const fn effective_mask(skill: u32, occupation: u32) -> Option<u32> {
    match (skill_mask(skill), occupation_mask(occupation)) {
        (Some(skill_cap), Some(job_cap)) => Some(skill_cap & job_cap),
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
    bytes[31] = LEGACY_PROTOCOL_VERSION;
    bytes[32..36].copy_from_slice(&corpus_walker::source_fingerprint().to_le_bytes());
    fnv1a32(&bytes)
}

fn curator_witness32_v2(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    personas: u32,
    occupation: u32,
    status: u8,
    mask: u16,
) -> u32 {
    let mut bytes = [0u8; 44];
    bytes[0..4].copy_from_slice(b"CUR2");
    bytes[4..8].copy_from_slice(&source_fingerprint.to_le_bytes());
    bytes[8..12].copy_from_slice(&source_bytes.to_le_bytes());
    bytes[12..16].copy_from_slice(&context_address.to_le_bytes());
    bytes[16..20].copy_from_slice(&candidate_address.to_le_bytes());
    bytes[20..24].copy_from_slice(&candidate_bytes.to_le_bytes());
    bytes[24..28].copy_from_slice(&skill.to_le_bytes());
    bytes[28..32].copy_from_slice(&personas.to_le_bytes());
    bytes[32..36].copy_from_slice(&occupation.to_le_bytes());
    bytes[36] = status;
    bytes[37..39].copy_from_slice(&mask.to_le_bytes());
    bytes[39] = CURATOR_PROTOCOL_VERSION as u8;
    bytes[40..44].copy_from_slice(&corpus_walker::source_fingerprint().to_le_bytes());
    fnv1a32(&bytes)
}

/// Legacy Stage 14.9 proposal retained for ABI compatibility.
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

pub fn curate_v2(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    personas: u32,
    occupation: u32,
    authority: bool,
) -> Option<CuratorReceiptV2> {
    if !authority
        || source_bytes == 0
        || source_bytes > MAX_SOURCE_BYTES
        || candidate_bytes == 0
        || candidate_bytes > MAX_ID_BYTES
        || !known_address(context_address)
        || !persona_mask_valid(personas)
    {
        return None;
    }

    let mask = effective_mask(skill, occupation)?;
    if (mask & CAP_BASE) != CAP_BASE {
        return None;
    }
    let mask16 = u16::try_from(mask).ok()?;
    let status = candidate_status(candidate_address);
    let witness = curator_witness32_v2(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        personas,
        occupation,
        status,
        mask16,
    );

    // Personas contribute only to the witnessed interpretive context. They add
    // no capability bits and cannot escape the child. Occupation narrows the
    // skill through effective_mask(); only the witnessed proposal survives.
    let private_state = ((source_fingerprint as u64) << 32) | candidate_address as u64;
    let child_id = ((candidate_address as u64) << 8) | (occupation as u64 & 0xff);
    let child = CortexChild::spawn(child_id, 0, 1).execute(private_state, witness as u64);
    if !child.terminated || child.witness as u32 != witness {
        return None;
    }

    Some(CuratorReceiptV2 {
        skill: skill as u8,
        personas: personas as u8,
        occupation: occupation as u8,
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

pub fn verify_curator_receipt_v2(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    personas: u32,
    occupation: u32,
    status: u32,
    mask: u32,
    witness: u32,
    authority: bool,
) -> bool {
    let Some(expected) = curate_v2(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        personas,
        occupation,
        authority,
    ) else {
        return false;
    };

    expected.status as u32 == status
        && expected.mask as u32 == mask
        && expected.witness == witness
        && expected.skill as u32 == skill
        && expected.personas as u32 == personas
        && expected.occupation as u32 == occupation
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
pub extern "C" fn i13_curator_persona_mask_valid(personas: u32) -> u32 {
    persona_mask_valid(personas) as u32
}

#[no_mangle]
pub extern "C" fn i13_curator_occupation_mask(occupation: u32) -> u32 {
    occupation_mask(occupation).unwrap_or(0)
}

#[no_mangle]
pub extern "C" fn i13_curator_effective_mask(skill: u32, occupation: u32) -> u32 {
    effective_mask(skill, occupation).unwrap_or(0)
}

#[no_mangle]
pub extern "C" fn i13_curator_status(candidate_address: u32) -> u32 {
    candidate_status(candidate_address) as u32
}

/// Legacy Stage 14.9 proposal encoding:
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

/// Stage 14.9.1 proposal encoding:
/// bit63 success | bits60..62 status | bits56..59 skill |
/// bits52..55 occupation | bits44..51 persona mask |
/// bits32..43 effective capability mask | bits0..31 witness.
#[no_mangle]
pub extern "C" fn i13_curator_propose_v2(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    personas: u32,
    occupation: u32,
    authority: u32,
) -> u64 {
    let Some(receipt) = curate_v2(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        personas,
        occupation,
        authority != 0,
    ) else {
        return 0;
    };

    (1u64 << 63)
        | (((receipt.status as u64) & 0x7) << 60)
        | (((receipt.skill as u64) & 0xf) << 56)
        | (((receipt.occupation as u64) & 0xf) << 52)
        | ((receipt.personas as u64) << 44)
        | (((receipt.mask as u64) & 0x0fff) << 32)
        | receipt.witness as u64
}

/// Legacy outer curator CV. PASS=1, VETO=0.
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

/// Stage 14.9.1 outer curator CV. It verifies skill, personas, occupation,
/// effective mask, status, and witness. It still does not commit corpus data.
#[no_mangle]
pub extern "C" fn i13_curator_cv_v2(
    source_fingerprint: u32,
    source_bytes: u32,
    context_address: u32,
    candidate_address: u32,
    candidate_bytes: u32,
    skill: u32,
    personas: u32,
    occupation: u32,
    status: u32,
    mask: u32,
    witness: u32,
    authority: u32,
) -> u32 {
    verify_curator_receipt_v2(
        source_fingerprint,
        source_bytes,
        context_address,
        candidate_address,
        candidate_bytes,
        skill,
        personas,
        occupation,
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
    fn personas_are_lenses_not_capabilities() {
        assert!(persona_mask_valid(PERSONA_ARCHIVIST | PERSONA_SKEPTIC));
        assert!(persona_mask_valid(PERSONA_ALL));
        assert!(!persona_mask_valid(0));
        assert!(!persona_mask_valid(0x10));
        assert_eq!(
            effective_mask(SKILL_MATHEMATICS, OCCUPATION_CLASSIFY),
            Some(0x0017)
        );
        assert_eq!(
            effective_mask(SKILL_MATHEMATICS, OCCUPATION_CLASSIFY),
            effective_mask(SKILL_MATHEMATICS, OCCUPATION_CLASSIFY)
        );
    }

    #[test]
    fn occupation_intersects_skill_instead_of_expanding_it() {
        assert_eq!(
            effective_mask(SKILL_CODE, OCCUPATION_REVIEW),
            Some(CAP_BASE)
        );
        assert_eq!(
            effective_mask(SKILL_BIBLIOGRAPHY, OCCUPATION_RELATE),
            Some(CAP_BASE)
        );
        assert_eq!(
            effective_mask(SKILL_MATHEMATICS, OCCUPATION_CLASSIFY),
            Some(0x0017)
        );
        assert_eq!(occupation_mask(99), None);
    }

    #[test]
    fn curator_v2_proposes_new_root_and_binds_identity_profile() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-v2-test-001");
        let personas = PERSONA_ARCHIVIST | PERSONA_SKEPTIC;
        let receipt = curate_v2(
            0x1234_5678,
            128,
            context,
            candidate,
            19,
            SKILL_BIBLIOGRAPHY,
            personas,
            OCCUPATION_INGEST,
            true,
        )
        .unwrap();
        assert_eq!(receipt.status, STATUS_NEW_ROOT);
        assert_eq!(receipt.mask, 0x000f);
        assert_eq!(receipt.personas as u32, personas);
        assert_eq!(receipt.occupation as u32, OCCUPATION_INGEST);
        assert!(receipt.terminated);
        assert_ne!(receipt.witness, 0);

        let changed_persona = curate_v2(
            0x1234_5678,
            128,
            context,
            candidate,
            19,
            SKILL_BIBLIOGRAPHY,
            PERSONA_ARCHIVIST | PERSONA_ENGINEER,
            OCCUPATION_INGEST,
            true,
        )
        .unwrap();
        assert_eq!(changed_persona.mask, receipt.mask);
        assert_ne!(changed_persona.witness, receipt.witness);
    }

    #[test]
    fn occupied_address_is_hold_not_overwrite() {
        let context = fnv1a32(b"sonia-003");
        let occupied = fnv1a32(b"sonia-003");
        let receipt = curate_v2(
            0x89ab_cdef,
            64,
            context,
            occupied,
            9,
            SKILL_MATHEMATICS,
            PERSONA_MATHEMATICIAN | PERSONA_SKEPTIC,
            OCCUPATION_REVIEW,
            true,
        )
        .unwrap();
        assert_eq!(receipt.status, STATUS_ADDRESS_OCCUPIED);
        assert!(known_address(occupied));
    }

    #[test]
    fn authority_bounds_personas_occupation_and_context_are_mandatory() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-v2-test-002");
        let p = PERSONA_ENGINEER | PERSONA_SKEPTIC;
        assert_eq!(
            curate_v2(1, 1, context, candidate, 1, SKILL_CODE, p, OCCUPATION_REVIEW, false),
            None
        );
        assert_eq!(
            curate_v2(1, 0, context, candidate, 1, SKILL_CODE, p, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 4097, context, candidate, 1, SKILL_CODE, p, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, 0xffff_fffe, candidate, 1, SKILL_CODE, p, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, context, candidate, 65, SKILL_CODE, p, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, context, candidate, 1, 99, p, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, context, candidate, 1, SKILL_CODE, 0, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, context, candidate, 1, SKILL_CODE, 0x10, OCCUPATION_REVIEW, true),
            None
        );
        assert_eq!(
            curate_v2(1, 1, context, candidate, 1, SKILL_CODE, p, 99, true),
            None
        );
    }

    #[test]
    fn outer_cv_v2_rejects_tampered_profile_or_witness() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-v2-test-003");
        let personas = PERSONA_ENGINEER | PERSONA_SKEPTIC;
        let occupation = OCCUPATION_REVIEW;
        let receipt = curate_v2(
            0xfeed_beef,
            32,
            context,
            candidate,
            19,
            SKILL_CODE,
            personas,
            occupation,
            true,
        )
        .unwrap();

        assert!(verify_curator_receipt_v2(
            0xfeed_beef,
            32,
            context,
            candidate,
            19,
            SKILL_CODE,
            personas,
            occupation,
            receipt.status as u32,
            receipt.mask as u32,
            receipt.witness,
            true,
        ));
        assert!(!verify_curator_receipt_v2(
            0xfeed_beef,
            32,
            context,
            candidate,
            19,
            SKILL_CODE,
            personas ^ PERSONA_ENGINEER,
            occupation,
            receipt.status as u32,
            receipt.mask as u32,
            receipt.witness,
            true,
        ));
        assert!(!verify_curator_receipt_v2(
            0xfeed_beef,
            32,
            context,
            candidate,
            19,
            SKILL_CODE,
            personas,
            OCCUPATION_CLASSIFY,
            receipt.status as u32,
            receipt.mask as u32,
            receipt.witness,
            true,
        ));
        assert!(!verify_curator_receipt_v2(
            0xfeed_beef,
            32,
            context,
            candidate,
            19,
            SKILL_CODE,
            personas,
            occupation,
            receipt.status as u32,
            receipt.mask as u32,
            receipt.witness ^ 1,
            true,
        ));
    }

    #[test]
    fn legacy_v1_proposal_remains_available() {
        let context = fnv1a32(b"sonia-003");
        let candidate = fnv1a32(b"curator-legacy-test");
        let receipt = curate(
            0x0102_0304,
            16,
            context,
            candidate,
            19,
            SKILL_BIBLIOGRAPHY,
            true,
        )
        .unwrap();
        assert_eq!(receipt.status, STATUS_NEW_ROOT);
        assert_eq!(receipt.mask, 0x000f);
        assert!(receipt.terminated);
    }
}
