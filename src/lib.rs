//! I13 H1.1 live reference core.
//! H1.0/VH1 historical and frozen material lives under `reference/`.

pub mod child;
pub mod cortex;
pub mod corpus;
pub mod ology;
pub mod pulse;
pub mod quorum;
pub mod width;

pub use child::{ChildPhase, ChildReceipt, CortexChild};
pub use cortex::{CortexVerifier, CvContext, CvVerdict, Queen};
pub use corpus::{fnv1a32 as corpus_fingerprint32, CorpusAddress, CorpusCvContext, CorpusVerifier};
pub use ology::{Direction, OlogyPoint, VoxelCursor, VoxelTransition};
pub use quorum::OddSplit;
pub use width::{mixed_width, natural_width, vh1_width};

#[no_mangle]
pub extern "C" fn i13_ology_pack(x: u32, y: u32) -> u32 {
    OlogyPoint::new(x as u16, y as u16).pack()
}

#[no_mangle]
pub extern "C" fn i13_ology_x(address: u32) -> u32 {
    OlogyPoint::unpack(address).x as u32
}

#[no_mangle]
pub extern "C" fn i13_ology_y(address: u32) -> u32 {
    OlogyPoint::unpack(address).y as u32
}

/// Returns bit32=1 plus the packed next point on success; 0 on invalid/bounds failure.
#[no_mangle]
pub extern "C" fn i13_queen_step(address: u32, direction: i32) -> u64 {
    let Ok(direction) = Direction::try_from(direction) else { return 0; };
    let Some(next) = OlogyPoint::unpack(address).step(direction) else { return 0; };
    (1u64 << 32) | next.pack() as u64
}

#[no_mangle]
pub extern "C" fn i13_cv_verify(
    address: u32,
    entered_depth: u32,
    emerged_depth: u32,
    max_depth: u32,
    authority: u32,
) -> u32 {
    let root = OlogyPoint::unpack(address);
    CortexVerifier::verify(
        VoxelTransition {
            entered: VoxelCursor { root, depth: entered_depth },
            emerged: VoxelCursor { root, depth: emerged_depth },
        },
        CvContext { authority: authority != 0, max_depth },
    ) as u32
}

/// Authority-gated surface move. Same result encoding as i13_queen_step.
#[no_mangle]
pub extern "C" fn i13_queen_move(address: u32, direction: i32, cv_pass: u32) -> u64 {
    let Ok(direction) = Direction::try_from(direction) else { return 0; };
    let verdict = if cv_pass == CvVerdict::Pass as u32 { CvVerdict::Pass } else { CvVerdict::Veto };
    let Some(next) = Queen::move_after_cv(OlogyPoint::unpack(address), direction, verdict) else { return 0; };
    (1u64 << 32) | next.pack() as u64
}

#[no_mangle]
pub extern "C" fn i13_vh1_width(depth: u32) -> u32 {
    vh1_width(depth).unwrap_or(0)
}

/// Returns [external:32 | internal:32]; zero means invalid/even width.
#[no_mangle]
pub extern "C" fn i13_odd_split(width: u32) -> u64 {
    let Some(s) = OddSplit::resolve(width) else { return 0; };
    ((s.external as u64) << 32) | s.internal as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn address_roundtrip_is_exact() {
        for p in [
            OlogyPoint::new(0, 0),
            OlogyPoint::new(1, 2),
            OlogyPoint::new(0xffff, 0xffff),
            OlogyPoint::new(0xc0a8, 0x012a),
        ] {
            assert_eq!(OlogyPoint::unpack(p.pack()), p);
        }
    }

    #[test]
    fn user_axis_convention_is_preserved() {
        let p = OlogyPoint::new(10, 10);
        assert_eq!(p.step(Direction::Up), Some(OlogyPoint::new(11, 10)));
        assert_eq!(p.step(Direction::Down), Some(OlogyPoint::new(9, 10)));
        assert_eq!(p.step(Direction::Right), Some(OlogyPoint::new(10, 11)));
        assert_eq!(p.step(Direction::Left), Some(OlogyPoint::new(10, 9)));
    }

    #[test]
    fn surface_bounds_do_not_wrap() {
        assert_eq!(OlogyPoint::new(u16::MAX, 0).step(Direction::Up), None);
        assert_eq!(OlogyPoint::new(0, 0).step(Direction::Down), None);
        assert_eq!(OlogyPoint::new(0, u16::MAX).step(Direction::Right), None);
        assert_eq!(OlogyPoint::new(0, 0).step(Direction::Left), None);
    }

    #[test]
    fn voxel_depth_is_local_not_packed_into_address() {
        let root = OlogyPoint::new(42, 7);
        let a = VoxelCursor::enter(root);
        let b = a.burrow(81).unwrap();
        assert_eq!(a.root.pack(), b.root.pack());
        assert_eq!(b.depth, 81);
    }

    #[test]
    fn cv_requires_authority_same_root_and_depth_bound() {
        let root = OlogyPoint::new(3, 5);
        let good = VoxelTransition {
            entered: VoxelCursor::enter(root),
            emerged: VoxelCursor { root, depth: 2 },
        };
        assert_eq!(CortexVerifier::verify(good, CvContext { authority: false, max_depth: 5 }), CvVerdict::Veto);
        assert_eq!(CortexVerifier::verify(good, CvContext { authority: true, max_depth: 5 }), CvVerdict::Pass);

        let escaped = VoxelTransition {
            entered: VoxelCursor::enter(root),
            emerged: VoxelCursor { root: OlogyPoint::new(3, 6), depth: 0 },
        };
        assert_eq!(CortexVerifier::verify(escaped, CvContext { authority: true, max_depth: 5 }), CvVerdict::Veto);

        let too_deep = VoxelTransition {
            entered: VoxelCursor::enter(root),
            emerged: VoxelCursor { root, depth: 6 },
        };
        assert_eq!(CortexVerifier::verify(too_deep, CvContext { authority: true, max_depth: 5 }), CvVerdict::Veto);
    }

    #[test]
    fn queen_cannot_move_on_veto() {
        let p = OlogyPoint::new(10, 10);
        assert_eq!(Queen::move_after_cv(p, Direction::Right, CvVerdict::Veto), None);
        assert_eq!(Queen::move_after_cv(p, Direction::Right, CvVerdict::Pass), Some(OlogyPoint::new(10, 11)));
    }

    #[test]
    fn width_laws_hold() {
        assert_eq!((0..=4).map(|n| vh1_width(n).unwrap()).collect::<Vec<_>>(), vec![1, 3, 9, 27, 81]);
        assert_eq!(vh1_width(5), None);
        assert_eq!(natural_width(10, 3), Some(1000));
        assert_eq!(mixed_width(&[2, 3, 5]), Some(30));
    }

    #[test]
    fn odd_width_law_scales() {
        for (n, expected) in [(3, (1, 2)), (5, (2, 3)), (7, (3, 4)), (9, (4, 5)), (81, (40, 41))] {
            let s = OddSplit::resolve(n).unwrap();
            assert_eq!((s.internal, s.external), expected);
            assert_eq!(s.decision_width(), 1);
        }
        assert!(OddSplit::resolve(2).is_none());
        assert!(OddSplit::resolve(4).is_none());
    }

    #[test]
    fn child_returns_receipt_without_private_state() {
        let child = CortexChild::spawn(1, 4, 81);
        assert_eq!(child.phase(), ChildPhase::Spawn);
        let receipt = child.execute(0xdead_beef, 42);
        assert!(receipt.terminated);
        assert_eq!(receipt.child_id, 1);
        assert_eq!(receipt.depth, 4);
        assert_eq!(receipt.width, 81);
        assert_eq!(receipt.witness, 42);
    }

    #[test]
    fn pulse_strict_boundary_matches_experiment() {
        assert_eq!(pulse::execute_pulse_transition(120.0, 10.0, 2.0), Some(260.0));
        assert_eq!(pulse::execute_pulse_transition(120.0, 8.0, 2.0), None);
    }
}
