use crate::{CvVerdict, OlogyPoint};

/// Stable 32-bit non-cryptographic fingerprint shared with Stage 14 ingest.
/// This is an address function, not a security primitive.
pub fn fnv1a32(bytes: &[u8]) -> u32 {
    let mut hash = 0x811c_9dc5u32;
    for byte in bytes {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(0x0100_0193);
    }
    hash
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct CorpusAddress {
    pub root: OlogyPoint,
    pub depth: u32,
}

impl CorpusAddress {
    pub fn from_id(id: &str) -> Self {
        Self { root: OlogyPoint::unpack(fnv1a32(id.as_bytes())), depth: 0 }
    }

    pub const fn at_depth(self, depth: u32) -> Self {
        Self { depth, ..self }
    }

    /// Burrow inside the voxel rooted at this OLOGY point.
    /// The 32-bit surface root never changes; only local depth moves.
    pub fn burrow(self, delta: i32) -> Option<Self> {
        let depth = if delta >= 0 {
            self.depth.checked_add(delta as u32)?
        } else {
            self.depth.checked_sub(delta.unsigned_abs())?
        };
        Some(Self { depth, ..self })
    }
}

/// Corpus-specific pre-commit verification state.
///
/// A Vogel record may exist as context, but it cannot claim evidence authority
/// by itself. Structural/provenance failures veto ingestion entirely.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CorpusCvContext {
    pub schema_valid: bool,
    pub provenance_present: bool,
    pub id_unique: bool,
    pub address_unique: bool,
    pub vogel: bool,
    pub evidence_claim: bool,
}

pub struct CorpusVerifier;

impl CorpusVerifier {
    pub const fn verify(context: CorpusCvContext) -> CvVerdict {
        if !context.schema_valid
            || !context.provenance_present
            || !context.id_unique
            || !context.address_unique
        {
            return CvVerdict::Veto;
        }
        if context.vogel && context.evidence_claim {
            return CvVerdict::Veto;
        }
        CvVerdict::Pass
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn good() -> CorpusCvContext {
        CorpusCvContext {
            schema_valid: true,
            provenance_present: true,
            id_unique: true,
            address_unique: true,
            vogel: false,
            evidence_claim: true,
        }
    }

    #[test]
    fn canonical_id_maps_to_stable_ology_root() {
        let address = CorpusAddress::from_id("radix-001");
        assert_eq!(fnv1a32(b"radix-001"), 0x3b47_0e7f);
        assert_eq!(address.root, OlogyPoint::new(15175, 3711));
        assert_eq!(address.depth, 0);
    }

    #[test]
    fn burrow_depth_does_not_change_surface_root() {
        let root = CorpusAddress::from_id("ada-001");
        let deep = root.at_depth(81);
        assert_eq!(root.root, deep.root);
        assert_eq!(deep.depth, 81);
    }

    #[test]
    fn signed_burrow_is_bounded_and_keeps_root() {
        let root = CorpusAddress::from_id("sonia-003").at_depth(10);
        let deep = root.burrow(71).unwrap();
        assert_eq!(deep.root, root.root);
        assert_eq!(deep.depth, 81);
        let up = deep.burrow(-80).unwrap();
        assert_eq!(up.root, root.root);
        assert_eq!(up.depth, 1);
        assert!(up.burrow(-2).is_none());
    }

    #[test]
    fn structural_or_provenance_failure_vetoes() {
        let mut c = good();
        c.provenance_present = false;
        assert_eq!(CorpusVerifier::verify(c), CvVerdict::Veto);
    }

    #[test]
    fn vogel_can_exist_but_cannot_self_promote_to_evidence() {
        let mut c = good();
        c.vogel = true;
        assert_eq!(CorpusVerifier::verify(c), CvVerdict::Veto);
        c.evidence_claim = false;
        assert_eq!(CorpusVerifier::verify(c), CvVerdict::Pass);
    }
}
