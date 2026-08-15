pub const VH1_BASE: u32 = 3;
pub const VH1_MAX_DEPTH: u32 = 4;

pub fn natural_width(base: u32, depth: u32) -> Option<u64> {
    if base == 0 {
        return None;
    }
    let mut width = 1u64;
    for _ in 0..depth {
        width = width.checked_mul(base as u64)?;
    }
    Some(width)
}

pub fn mixed_width(radices: &[u32]) -> Option<u64> {
    let mut width = 1u64;
    for &base in radices {
        if base == 0 {
            return None;
        }
        width = width.checked_mul(base as u64)?;
    }
    Some(width)
}

pub fn vh1_width(depth: u32) -> Option<u32> {
    if depth > VH1_MAX_DEPTH {
        return None;
    }
    natural_width(VH1_BASE, depth).and_then(|w| u32::try_from(w).ok())
}
