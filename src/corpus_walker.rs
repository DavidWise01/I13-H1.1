//! Stage 14.2 compact corpus walker.
//!
//! The admitted Stage 14 corpus and Stage 14.1 mesh are compiled by `build.rs`
//! into static CSR adjacency tables. Runtime traversal is numeric: the public
//! node key is the same 32-bit OLOGY root address already used by the corpus.

use crate::corpus::CorpusAddress;
use crate::{CortexVerifier, CvContext, CvVerdict, OlogyPoint, VoxelCursor, VoxelTransition};

pub const EDGE_DOMAIN: u8 = 0x01;
pub const EDGE_WORLD_PATH: u8 = 0x02;

mod generated {
    include!(concat!(env!("OUT_DIR"), "/corpus_mesh_generated.rs"));
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CorpusNeighbor {
    pub address: u32,
    pub flags: u8,
    pub weight: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WalkStep {
    /// First OLOGY root to enter from the current node.
    pub next_address: u32,
    /// Shortest known distance from current node to goal, in edges.
    pub distance: u32,
}

pub const fn node_count() -> usize { generated::NODE_COUNT }
pub const fn edge_count() -> usize { generated::EDGE_COUNT }
pub const fn directed_edge_count() -> usize { generated::DIRECTED_EDGE_COUNT }
pub const fn world_step_count() -> usize { generated::WORLD_STEP_COUNT }
pub const fn source_fingerprint() -> u32 { generated::CORPUS_FINGERPRINT }
pub const fn world_fingerprint() -> u32 { generated::WORLD_FINGERPRINT }

fn ordinal_for_address(address: u32) -> Option<usize> {
    generated::NODE_ADDRESSES.iter().position(|candidate| *candidate == address)
}

pub fn node_address(ordinal: usize) -> Option<u32> {
    generated::NODE_ADDRESSES.get(ordinal).copied()
}

pub fn is_evidence(address: u32) -> bool {
    ordinal_for_address(address)
        .map(|ordinal| generated::NODE_EVIDENCE[ordinal] != 0)
        .unwrap_or(false)
}

fn raw_range(ordinal: usize) -> core::ops::Range<usize> {
    let start = generated::OFFSETS[ordinal] as usize;
    let end = generated::OFFSETS[ordinal + 1] as usize;
    start..end
}

fn neighbor_allowed(source: usize, directed_index: usize, evidence_only: bool) -> bool {
    if !evidence_only {
        return true;
    }
    if generated::NODE_EVIDENCE[source] == 0 {
        return false;
    }
    let neighbor = generated::NEIGHBORS[directed_index] as usize;
    generated::NODE_EVIDENCE[neighbor] != 0
}

pub fn neighbor_count(address: u32, evidence_only: bool) -> usize {
    let Some(source) = ordinal_for_address(address) else { return 0; };
    raw_range(source)
        .filter(|directed_index| neighbor_allowed(source, *directed_index, evidence_only))
        .count()
}

pub fn neighbor(address: u32, slot: usize, evidence_only: bool) -> Option<CorpusNeighbor> {
    let source = ordinal_for_address(address)?;
    let directed_index = raw_range(source)
        .filter(|directed_index| neighbor_allowed(source, *directed_index, evidence_only))
        .nth(slot)?;
    let neighbor_ordinal = generated::NEIGHBORS[directed_index] as usize;
    Some(CorpusNeighbor {
        address: generated::NODE_ADDRESSES[neighbor_ordinal],
        flags: generated::EDGE_FLAGS[directed_index],
        weight: generated::EDGE_WEIGHTS[directed_index],
    })
}

/// Return the first hop of a bounded shortest-path walk.
///
/// `evidence_only` preserves Stage 14.1 semantics: contextual/Vogel nodes are
/// excluded, while edge provenance flags remain available to the caller. A
/// curated world-path edge never changes a node's evidence authority.
pub fn walk_next(start_address: u32, goal_address: u32, evidence_only: bool, max_steps: u32) -> Option<WalkStep> {
    let start = ordinal_for_address(start_address)?;
    let goal = ordinal_for_address(goal_address)?;
    if evidence_only && (generated::NODE_EVIDENCE[start] == 0 || generated::NODE_EVIDENCE[goal] == 0) {
        return None;
    }
    if start == goal {
        return Some(WalkStep { next_address: goal_address, distance: 0 });
    }
    if max_steps == 0 {
        return None;
    }

    let mut visited = [false; generated::NODE_COUNT];
    let mut parent = [u16::MAX; generated::NODE_COUNT];
    let mut distance = [u16::MAX; generated::NODE_COUNT];
    let mut queue = [0u16; generated::NODE_COUNT];
    let mut head = 0usize;
    let mut tail = 0usize;

    visited[start] = true;
    distance[start] = 0;
    queue[tail] = start as u16;
    tail += 1;

    'search: while head < tail {
        let current = queue[head] as usize;
        head += 1;
        let current_distance = distance[current] as u32;
        if current_distance >= max_steps {
            continue;
        }

        for directed_index in raw_range(current) {
            if !neighbor_allowed(current, directed_index, evidence_only) {
                continue;
            }
            let next = generated::NEIGHBORS[directed_index] as usize;
            if visited[next] {
                continue;
            }
            visited[next] = true;
            parent[next] = current as u16;
            distance[next] = distance[current].saturating_add(1);
            if next == goal {
                break 'search;
            }
            queue[tail] = next as u16;
            tail += 1;
        }
    }

    if !visited[goal] || distance[goal] as u32 > max_steps {
        return None;
    }

    let mut next = goal;
    while parent[next] != u16::MAX && parent[next] as usize != start {
        next = parent[next] as usize;
    }
    if parent[next] == u16::MAX {
        return None;
    }

    Some(WalkStep {
        next_address: generated::NODE_ADDRESSES[next],
        distance: distance[goal] as u32,
    })
}

/// Enter a corpus voxel at `address`, burrow to `depth`, and pass the actual
/// same-root transition through the Cortex Verifier before returning it.
pub fn verified_burrow(address: u32, depth: u32, max_depth: u32, authority: bool) -> Option<CorpusAddress> {
    ordinal_for_address(address)?;
    let root = OlogyPoint::unpack(address);
    let transition = VoxelTransition {
        entered: VoxelCursor::enter(root),
        emerged: VoxelCursor { root, depth },
    };
    if CortexVerifier::verify(transition, CvContext { authority, max_depth }) != CvVerdict::Pass {
        return None;
    }
    Some(CorpusAddress { root, depth })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::corpus::fnv1a32;

    #[test]
    fn generated_mesh_matches_stage_14_1_baseline() {
        assert_eq!(node_count(), 54);
        assert_eq!(edge_count(), 187);
        assert_eq!(directed_edge_count(), 374);
        assert_eq!(world_step_count(), 9);
        assert_ne!(source_fingerprint(), 0);
        assert_ne!(world_fingerprint(), 0);
    }

    #[test]
    fn every_ordinal_has_a_unique_ology_root() {
        for ordinal in 0..node_count() {
            let address = node_address(ordinal).unwrap();
            assert_eq!(ordinal_for_address(address), Some(ordinal));
        }
    }

    #[test]
    fn cortex_can_walk_sonia_to_fractint() {
        let mut current = fnv1a32(b"sonia-001");
        let goal = fnv1a32(b"fractal-007");
        for _ in 0..16 {
            if current == goal {
                return;
            }
            let step = walk_next(current, goal, false, 16).expect("Sonia -> Fractint route");
            assert!(step.distance > 0);
            assert_ne!(step.next_address, current);
            current = step.next_address;
        }
        panic!("Sonia -> Fractint route exceeded bound");
    }

    #[test]
    fn evidence_mode_rejects_vogel_goal() {
        let start = fnv1a32(b"sonia-001");
        let vogel_goal = fnv1a32(b"fractal-007");
        assert!(is_evidence(start));
        assert!(!is_evidence(vogel_goal));
        assert_eq!(walk_next(start, vogel_goal, true, 16), None);
    }

    #[test]
    fn neighbor_api_exposes_edge_provenance_bits() {
        let sonia = fnv1a32(b"sonia-003");
        assert!(neighbor_count(sonia, false) > 0);
        let first = neighbor(sonia, 0, false).unwrap();
        assert_ne!(first.address, sonia);
        assert_ne!(first.flags & (EDGE_DOMAIN | EDGE_WORLD_PATH), 0);
        assert!(first.weight > 0);
    }

    #[test]
    fn verified_burrow_keeps_surface_root_and_respects_cv() {
        let address = fnv1a32(b"sonia-003");
        let deep = verified_burrow(address, 81, 81, true).unwrap();
        assert_eq!(deep.root.pack(), address);
        assert_eq!(deep.depth, 81);
        assert_eq!(verified_burrow(address, 82, 81, true), None);
        assert_eq!(verified_burrow(address, 1, 81, false), None);
        assert_eq!(verified_burrow(0xffff_fffe, 1, 81, true), None);
    }
}
