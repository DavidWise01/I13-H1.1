//! E1 external primer boundary contract.
//!
//! E1 itself is external. This module deliberately implements only the I13/Cortex
//! side of the `[ y | x ]` boundary: bounded capsules, independent 8n reach, and
//! closed-loop receipt verification. No E1 factory state or calibration corpus is
//! imported into the Rust/Wasm core.

#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum E1Side {
    Internal = 0,
    External = 1,
}

impl TryFrom<u32> for E1Side {
    type Error = ();

    fn try_from(value: u32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::Internal),
            1 => Ok(Self::External),
            _ => Err(()),
        }
    }
}

#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum E1Verdict {
    Veto = 0,
    Pass = 1,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct E1Capsule {
    pub from: E1Side,
    pub to: E1Side,
    pub request_hash: u32,
    pub payload_hash: u32,
    pub parent_hash: u32,
    pub witness: u32,
    pub shared_live_state: bool,
}

pub struct E1Boundary;

impl E1Boundary {
    pub fn verify(capsule: E1Capsule) -> E1Verdict {
        let crosses_partition = capsule.from != capsule.to;
        let witnessed = capsule.witness != 0;
        let addressed = capsule.request_hash != 0 && capsule.payload_hash != 0;
        let isolated = !capsule.shared_live_state;

        if crosses_partition && witnessed && addressed && isolated {
            E1Verdict::Pass
        } else {
            E1Verdict::Veto
        }
    }
}

/// One side gets a complete crawl/walk/run/sprint gearbox: n, 2n, 4n, 8n.
/// The other side owns its own independent copy; widths are never pooled.
pub fn vortex_width_8n(n: u32) -> Option<u32> {
    n.checked_mul(8)
}

/// A return closes only when it explicitly names the request it answers, both
/// traversals were witnessed, and the caller confirms no live mutable state was
/// shared across the partition.
pub fn verify_closed_loop(
    request_hash: u32,
    return_parent_hash: u32,
    request_witness: u32,
    return_witness: u32,
    shared_live_state: bool,
) -> bool {
    request_hash != 0
        && request_hash == return_parent_hash
        && request_witness != 0
        && return_witness != 0
        && !shared_live_state
}

#[cfg(test)]
mod tests {
    use super::*;

    fn good_capsule(from: E1Side, to: E1Side) -> E1Capsule {
        E1Capsule {
            from,
            to,
            request_hash: 0x11,
            payload_hash: 0x22,
            parent_hash: 0,
            witness: 0x33,
            shared_live_state: false,
        }
    }

    #[test]
    fn partition_requires_a_real_crossing() {
        assert_eq!(E1Boundary::verify(good_capsule(E1Side::Internal, E1Side::External)), E1Verdict::Pass);
        assert_eq!(E1Boundary::verify(good_capsule(E1Side::External, E1Side::Internal)), E1Verdict::Pass);
        assert_eq!(E1Boundary::verify(good_capsule(E1Side::Internal, E1Side::Internal)), E1Verdict::Veto);
    }

    #[test]
    fn live_state_can_never_cross() {
        let mut capsule = good_capsule(E1Side::Internal, E1Side::External);
        capsule.shared_live_state = true;
        assert_eq!(E1Boundary::verify(capsule), E1Verdict::Veto);
    }

    #[test]
    fn witness_and_addresses_are_required() {
        let mut capsule = good_capsule(E1Side::Internal, E1Side::External);
        capsule.witness = 0;
        assert_eq!(E1Boundary::verify(capsule), E1Verdict::Veto);
        capsule.witness = 1;
        capsule.payload_hash = 0;
        assert_eq!(E1Boundary::verify(capsule), E1Verdict::Veto);
    }

    #[test]
    fn each_side_gets_full_8n_reach() {
        assert_eq!(vortex_width_8n(1), Some(8));
        assert_eq!(vortex_width_8n(4), Some(32));
        assert_eq!(vortex_width_8n(u32::MAX), None);
    }

    #[test]
    fn return_must_close_on_the_original_request() {
        assert!(verify_closed_loop(0xaaaa, 0xaaaa, 1, 2, false));
        assert!(!verify_closed_loop(0xaaaa, 0xbbbb, 1, 2, false));
        assert!(!verify_closed_loop(0xaaaa, 0xaaaa, 1, 2, true));
    }
}
