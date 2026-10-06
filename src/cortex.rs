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

// ---- TOROID-5 deterministic commit timing ---------------------------------

/// Five exact transfer phases between unresolved 0 and closure witness 1.
/// Internal representation is integer phase/5, avoiding floating-point drift.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Toroid5Clock {
    phase: u8,
    commits: u64,
}

impl Default for Toroid5Clock {
    fn default() -> Self { Self { phase: 0, commits: 0 } }
}

impl Toroid5Clock {
    pub const DENOMINATOR: u8 = 5;

    pub fn phase_numerator(&self) -> u8 { self.phase }
    pub fn commits(&self) -> u64 { self.commits }

    /// Advance exactly one 1/5 transfer. Returns true only on 5/5 closure.
    pub fn step(&mut self) -> Option<bool> {
        if self.phase >= Self::DENOMINATOR { return None; }
        self.phase += 1;
        let commit = self.phase == Self::DENOMINATOR;
        if commit { self.commits += 1; }
        Some(commit)
    }

    /// Identify closure witness 1 with the next cycle origin 0.
    pub fn wrap(&mut self) -> bool {
        if self.phase != Self::DENOMINATOR { return false; }
        self.phase = 0;
        true
    }

    pub fn mother_nature_gate(neg: i32, zero: i32, pos: i32) -> bool {
        neg + zero + pos == 0
    }
}

#[cfg(test)]
mod toroid5_tests {
    use super::Toroid5Clock;

    #[test]
    fn toroid5_commits_only_on_fifth_transfer() {
        let mut c = Toroid5Clock::default();
        for n in 1..=5 {
            let commit = c.step().unwrap();
            assert_eq!(c.phase_numerator(), n);
            assert_eq!(commit, n == 5);
        }
        assert_eq!(c.commits(), 1);
        assert!(c.wrap());
        assert_eq!(c.phase_numerator(), 0);
    }

    #[test]
    fn toroid5_rejects_early_wrap_and_extra_step() {
        let mut c = Toroid5Clock::default();
        assert_eq!(c.step(), Some(false));
        assert!(!c.wrap());
        for _ in 0..4 { c.step(); }
        assert_eq!(c.step(), None);
    }

    #[test]
    fn toroid5_stress_is_exact() {
        let mut c = Toroid5Clock::default();
        for _ in 0..10_000 {
            for n in 1..=5 { assert_eq!(c.step(), Some(n == 5)); }
            assert!(c.wrap());
        }
        assert_eq!(c.commits(), 10_000);
        assert_eq!(c.phase_numerator(), 0);
        assert!(Toroid5Clock::mother_nature_gate(-1, 0, 1));
    }
}
