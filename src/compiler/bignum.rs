//! Arbitrary-precision signed integers for I-13 (the "bignum" the SONNY 5 darts converged on:
//! Rabin-Miller, Diffie-Hellman, Karatsuba, Chinese Remainder). No external crates — the
//! project builds offline, so this is a self-contained schoolbook implementation.
//!
//! Representation: sign-magnitude. `mag` is little-endian base 2^32 with no trailing zero limbs;
//! zero is the empty magnitude with `neg = false`. Division is truncated toward zero and the
//! remainder takes the sign of the dividend, matching I-13's f64 `%` on integer values.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BigInt {
    neg: bool,
    mag: Vec<u32>, // little-endian, base 2^32, normalized (no trailing zeros)
}

impl BigInt {
    pub fn zero() -> Self {
        BigInt { neg: false, mag: Vec::new() }
    }

    pub fn is_zero(&self) -> bool {
        self.mag.is_empty()
    }

    pub fn from_i64(mut n: i64) -> Self {
        if n == 0 {
            return Self::zero();
        }
        let neg = n < 0;
        // careful with i64::MIN
        let mut u = if neg { (n as i128).unsigned_abs() as u128 } else { n as u128 };
        n = 0;
        let _ = n;
        let mut mag = Vec::new();
        while u > 0 {
            mag.push((u & 0xFFFF_FFFF) as u32);
            u >>= 32;
        }
        let mut b = BigInt { neg, mag };
        b.normalize();
        b
    }

    /// Exact f64 integer -> BigInt. Returns None if not a finite integer.
    pub fn from_f64_exact(x: f64) -> Option<Self> {
        if !x.is_finite() || x.fract() != 0.0 {
            return None;
        }
        // build from the absolute value by repeated division by 2^32 using f64 (exact while the
        // value is an integer <= 2^53; for larger inputs the caller already lost precision in f64,
        // so we accept the f64's exact integer value as-is).
        let neg = x < 0.0;
        let mut a = x.abs();
        let mut mag = Vec::new();
        let base = 4294967296.0_f64; // 2^32
        while a >= 1.0 {
            let limb = (a % base) as u32;
            mag.push(limb);
            a = (a / base).floor();
        }
        let mut b = BigInt { neg, mag };
        b.normalize();
        Some(b)
    }

    fn normalize(&mut self) {
        while let Some(&0) = self.mag.last() {
            self.mag.pop();
        }
        if self.mag.is_empty() {
            self.neg = false;
        }
    }

    // ---- magnitude helpers (operate on Vec<u32>) ----

    fn cmp_mag(a: &[u32], b: &[u32]) -> std::cmp::Ordering {
        use std::cmp::Ordering::*;
        if a.len() != b.len() {
            return if a.len() < b.len() { Less } else { Greater };
        }
        for i in (0..a.len()).rev() {
            if a[i] != b[i] {
                return if a[i] < b[i] { Less } else { Greater };
            }
        }
        Equal
    }

    fn add_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
        let (big, small) = if a.len() >= b.len() { (a, b) } else { (b, a) };
        let mut out = Vec::with_capacity(big.len() + 1);
        let mut carry = 0u64;
        for i in 0..big.len() {
            let s = big[i] as u64 + (if i < small.len() { small[i] as u64 } else { 0 }) + carry;
            out.push((s & 0xFFFF_FFFF) as u32);
            carry = s >> 32;
        }
        if carry > 0 {
            out.push(carry as u32);
        }
        out
    }

    /// assumes a >= b (magnitudes)
    fn sub_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
        let mut out = Vec::with_capacity(a.len());
        let mut borrow = 0i64;
        for i in 0..a.len() {
            let bi = if i < b.len() { b[i] as i64 } else { 0 };
            let mut d = a[i] as i64 - bi - borrow;
            if d < 0 {
                d += 1i64 << 32;
                borrow = 1;
            } else {
                borrow = 0;
            }
            out.push(d as u32);
        }
        while let Some(&0) = out.last() {
            out.pop();
        }
        out
    }

    fn mul_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
        if a.is_empty() || b.is_empty() {
            return Vec::new();
        }
        let mut out = vec![0u32; a.len() + b.len()];
        for i in 0..a.len() {
            let mut carry = 0u64;
            let ai = a[i] as u64;
            for j in 0..b.len() {
                let idx = i + j;
                let cur = out[idx] as u64 + ai * b[j] as u64 + carry;
                out[idx] = (cur & 0xFFFF_FFFF) as u32;
                carry = cur >> 32;
            }
            let mut idx = i + b.len();
            while carry > 0 {
                let cur = out[idx] as u64 + carry;
                out[idx] = (cur & 0xFFFF_FFFF) as u32;
                carry = cur >> 32;
                idx += 1;
            }
        }
        while let Some(&0) = out.last() {
            out.pop();
        }
        out
    }

    fn bit_len(mag: &[u32]) -> usize {
        match mag.last() {
            None => 0,
            Some(&top) => (mag.len() - 1) * 32 + (32 - top.leading_zeros() as usize),
        }
    }

    fn get_bit(mag: &[u32], i: usize) -> u32 {
        let limb = i / 32;
        if limb >= mag.len() {
            return 0;
        }
        (mag[limb] >> (i % 32)) & 1
    }

    fn set_bit(mag: &mut Vec<u32>, i: usize) {
        let limb = i / 32;
        while mag.len() <= limb {
            mag.push(0);
        }
        mag[limb] |= 1 << (i % 32);
    }

    /// shift magnitude left by one bit (multiply by 2)
    fn shl1_mag(mag: &[u32]) -> Vec<u32> {
        let mut out = Vec::with_capacity(mag.len() + 1);
        let mut carry = 0u32;
        for &limb in mag {
            out.push((limb << 1) | carry);
            carry = limb >> 31;
        }
        if carry > 0 {
            out.push(carry);
        }
        out
    }

    /// unsigned magnitude division: returns (quotient, remainder). Binary long division —
    /// simple and provably correct (O(bits^2), fine for the corpus's demo sizes).
    fn divmod_mag(a: &[u32], b: &[u32]) -> (Vec<u32>, Vec<u32>) {
        debug_assert!(!b.is_empty(), "division by zero magnitude");
        if Self::cmp_mag(a, b) == std::cmp::Ordering::Less {
            return (Vec::new(), a.to_vec());
        }
        let mut q: Vec<u32> = Vec::new();
        let mut r: Vec<u32> = Vec::new();
        let n = Self::bit_len(a);
        for i in (0..n).rev() {
            // r = (r << 1) | bit_i(a)
            r = Self::shl1_mag(&r);
            if Self::get_bit(a, i) == 1 {
                if r.is_empty() {
                    r.push(1);
                } else {
                    r[0] |= 1;
                }
            }
            if Self::cmp_mag(&r, b) != std::cmp::Ordering::Less {
                r = Self::sub_mag(&r, b);
                Self::set_bit(&mut q, i);
            }
        }
        while let Some(&0) = q.last() {
            q.pop();
        }
        while let Some(&0) = r.last() {
            r.pop();
        }
        (q, r)
    }

    // ---- signed operations ----

    pub fn cmp(&self, other: &BigInt) -> std::cmp::Ordering {
        use std::cmp::Ordering::*;
        match (self.neg, other.neg) {
            (false, true) => Greater,
            (true, false) => Less,
            (false, false) => Self::cmp_mag(&self.mag, &other.mag),
            (true, true) => Self::cmp_mag(&other.mag, &self.mag),
        }
    }

    pub fn add(&self, other: &BigInt) -> BigInt {
        if self.neg == other.neg {
            let mut r = BigInt { neg: self.neg, mag: Self::add_mag(&self.mag, &other.mag) };
            r.normalize();
            r
        } else {
            // signs differ: subtract smaller magnitude from larger
            match Self::cmp_mag(&self.mag, &other.mag) {
                std::cmp::Ordering::Equal => BigInt::zero(),
                std::cmp::Ordering::Greater => {
                    let mut r = BigInt { neg: self.neg, mag: Self::sub_mag(&self.mag, &other.mag) };
                    r.normalize();
                    r
                }
                std::cmp::Ordering::Less => {
                    let mut r = BigInt { neg: other.neg, mag: Self::sub_mag(&other.mag, &self.mag) };
                    r.normalize();
                    r
                }
            }
        }
    }

    pub fn sub(&self, other: &BigInt) -> BigInt {
        let neg_other = BigInt { neg: !other.neg && !other.is_zero(), mag: other.mag.clone() };
        self.add(&neg_other)
    }

    pub fn mul(&self, other: &BigInt) -> BigInt {
        let mut r = BigInt {
            neg: self.neg != other.neg,
            mag: Self::mul_mag(&self.mag, &other.mag),
        };
        r.normalize();
        r
    }

    /// truncated division: (quotient, remainder). remainder takes the sign of self (the dividend).
    /// Returns None on division by zero.
    pub fn divmod(&self, other: &BigInt) -> Option<(BigInt, BigInt)> {
        if other.is_zero() {
            return None;
        }
        let (q, r) = Self::divmod_mag(&self.mag, &other.mag);
        let mut quotient = BigInt { neg: self.neg != other.neg, mag: q };
        let mut remainder = BigInt { neg: self.neg, mag: r };
        quotient.normalize();
        remainder.normalize();
        Some((quotient, remainder))
    }

    pub fn to_decimal_string(&self) -> String {
        if self.is_zero() {
            return "0".to_string();
        }
        // repeatedly divide the magnitude by 1_000_000_000 (fits in u32), collecting 9-digit groups
        let mut limbs = self.mag.clone();
        let mut groups: Vec<u32> = Vec::new();
        while !limbs.is_empty() {
            // divmod by 1e9 (single small divisor), returns (quotient limbs, remainder u32)
            let mut rem: u64 = 0;
            for i in (0..limbs.len()).rev() {
                let cur = (rem << 32) | limbs[i] as u64;
                limbs[i] = (cur / 1_000_000_000) as u32;
                rem = cur % 1_000_000_000;
            }
            while let Some(&0) = limbs.last() {
                limbs.pop();
            }
            groups.push(rem as u32);
        }
        let mut s = String::new();
        if self.neg {
            s.push('-');
        }
        s.push_str(&groups.last().unwrap().to_string());
        for i in (0..groups.len() - 1).rev() {
            s.push_str(&format!("{:09}", groups[i]));
        }
        s
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn b(n: i64) -> BigInt {
        BigInt::from_i64(n)
    }

    #[test]
    fn small_roundtrip_and_signs() {
        assert_eq!(b(0).to_decimal_string(), "0");
        assert_eq!(b(42).to_decimal_string(), "42");
        assert_eq!(b(-7).to_decimal_string(), "-7");
        assert_eq!(b(1_000_000_000).to_decimal_string(), "1000000000");
        assert_eq!(b(-1_000_000_001).to_decimal_string(), "-1000000001");
    }

    #[test]
    fn add_sub_across_sign() {
        assert_eq!(b(5).add(&b(3)).to_decimal_string(), "8");
        assert_eq!(b(5).add(&b(-3)).to_decimal_string(), "2");
        assert_eq!(b(3).add(&b(-5)).to_decimal_string(), "-2");
        assert_eq!(b(5).sub(&b(8)).to_decimal_string(), "-3");
        assert_eq!(b(-5).sub(&b(-8)).to_decimal_string(), "3");
    }

    #[test]
    fn multiply_exact_past_f64() {
        // 25! = 15511210043330985984000000  (exceeds 2^53, so f64 cannot hold it exactly)
        let mut f = b(1);
        for k in 1..=25 {
            f = f.mul(&b(k));
        }
        assert_eq!(f.to_decimal_string(), "15511210043330985984000000");
    }

    #[test]
    fn power_of_two_exact() {
        // 2^100 exact
        let mut p = b(1);
        for _ in 0..100 {
            p = p.mul(&b(2));
        }
        assert_eq!(p.to_decimal_string(), "1267650600228229401496703205376");
        // 2^64 - 1 (the Tower of Hanoi count from dart 036, past f64's exact range)
        let mut two64 = b(1);
        for _ in 0..64 {
            two64 = two64.mul(&b(2));
        }
        assert_eq!(two64.sub(&b(1)).to_decimal_string(), "18446744073709551615");
    }

    #[test]
    fn divmod_matches_schoolbook() {
        let (q, r) = b(100).divmod(&b(7)).unwrap();
        assert_eq!(q.to_decimal_string(), "14");
        assert_eq!(r.to_decimal_string(), "2");
        // large / small
        let mut big = b(1);
        for _ in 0..40 {
            big = big.mul(&b(10));
        } // 10^40
        let (q, r) = big.divmod(&b(1_000_000_007)).unwrap();
        // verify q * d + r == big
        let recon = q.mul(&b(1_000_000_007)).add(&r);
        assert_eq!(recon.to_decimal_string(), big.to_decimal_string());
        assert_eq!(r.cmp(&b(0)), std::cmp::Ordering::Greater);
    }

    #[test]
    fn modexp_big() {
        // 7^256 mod 13 by square-and-multiply, all in bignum
        let m = b(13);
        let mut base = b(7);
        let mut result = b(1);
        let mut e = 256u32;
        while e > 0 {
            if e & 1 == 1 {
                result = result.mul(&base).divmod(&m).unwrap().1;
            }
            base = base.mul(&base).divmod(&m).unwrap().1;
            e >>= 1;
        }
        // 7^256 mod 13 : 7^12 ≡ 1 (Fermat), 256 mod 12 = 4, 7^4 = 2401, 2401 mod 13 = 9
        assert_eq!(result.to_decimal_string(), "9");
    }
}
