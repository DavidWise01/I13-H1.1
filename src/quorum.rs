#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OddSplit {
    pub width: u32,
    pub internal: u32,
    pub external: u32,
}

impl OddSplit {
    pub fn resolve(width: u32) -> Option<Self> {
        if width < 3 || width % 2 == 0 {
            return None;
        }
        let internal = width / 2;
        Some(Self { width, internal, external: internal + 1 })
    }

    pub const fn decision_width(self) -> u32 { 1 }
}
