use crate::ology::{Direction, OlogyPoint, VoxelTransition};

#[repr(u32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CvVerdict {
    Veto = 0,
    Pass = 1,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CvContext {
    pub authority: bool,
    pub max_depth: u32,
}

pub struct CortexVerifier;

impl CortexVerifier {
    pub fn verify(transition: VoxelTransition, context: CvContext) -> CvVerdict {
        if !context.authority {
            return CvVerdict::Veto;
        }
        if transition.entered.root != transition.emerged.root {
            return CvVerdict::Veto;
        }
        if transition.emerged.depth > context.max_depth {
            return CvVerdict::Veto;
        }
        CvVerdict::Pass
    }
}

pub struct Queen;

impl Queen {
    /// Surface movement is enabled only after a Cortex-verifier PASS.
    pub fn move_after_cv(
        current: OlogyPoint,
        direction: Direction,
        verdict: CvVerdict,
    ) -> Option<OlogyPoint> {
        if verdict != CvVerdict::Pass {
            return None;
        }
        current.step(direction)
    }
}
