//! I13 H1.1 reference core.
//!
//! The 32-bit OLOGY address is a two-dimensional surface root:
//! `[x:16 | y:16]`. Local voxel depth is nested state and is not
//! encoded into that 32-bit value.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OlogyPoint {
    pub x: u16,
    pub y: u16,
}

impl OlogyPoint {
    pub const fn new(x: u16, y: u16) -> Self { Self { x, y } }
    pub const fn pack(self) -> u32 { ((self.x as u32) << 16) | self.y as u32 }
    pub const fn unpack(address: u32) -> Self { Self { x: (address >> 16) as u16, y: address as u16 } }
    pub fn step(self, direction: Direction) -> Option<Self> {
        let (x, y) = match direction {
            Direction::Up => (self.x.checked_add(1)?, self.y),
            Direction::Down => (self.x.checked_sub(1)?, self.y),
            Direction::Right => (self.x, self.y.checked_add(1)?),
            Direction::Left => (self.x, self.y.checked_sub(1)?),
            Direction::UpRight => (self.x.checked_add(1)?, self.y.checked_add(1)?),
            Direction::UpLeft => (self.x.checked_add(1)?, self.y.checked_sub(1)?),
            Direction::DownRight => (self.x.checked_sub(1)?, self.y.checked_add(1)?),
            Direction::DownLeft => (self.x.checked_sub(1)?, self.y.checked_sub(1)?),
        };
        Some(Self { x, y })
    }
}

#[repr(i32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction { Up=0, Down=1, Right=2, Left=3, UpRight=4, UpLeft=5, DownRight=6, DownLeft=7 }

impl TryFrom<i32> for Direction {
    type Error = ();
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value { 0=>Ok(Self::Up),1=>Ok(Self::Down),2=>Ok(Self::Right),3=>Ok(Self::Left),4=>Ok(Self::UpRight),5=>Ok(Self::UpLeft),6=>Ok(Self::DownRight),7=>Ok(Self::DownLeft),_=>Err(()) }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VoxelCursor { pub root: OlogyPoint, pub depth: u32 }
impl VoxelCursor {
    pub const fn enter(root: OlogyPoint) -> Self { Self { root, depth: 0 } }
    pub fn burrow(self, delta: i32) -> Option<Self> {
        let depth = if delta >= 0 { self.depth.checked_add(delta as u32)? } else { self.depth.checked_sub(delta.unsigned_abs())? };
        Some(Self { depth, ..self })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VoxelTransition { pub entered: VoxelCursor, pub emerged: VoxelCursor }

#[repr(u32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CvVerdict { Veto=0, Pass=1 }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CvContext { pub authority: bool, pub max_depth: u32 }

pub struct CortexVerifier;
impl CortexVerifier {
    pub fn verify(transition: VoxelTransition, context: CvContext) -> CvVerdict {
        if !context.authority { return CvVerdict::Veto; }
        if transition.entered.root != transition.emerged.root { return CvVerdict::Veto; }
        if transition.emerged.depth > context.max_depth { return CvVerdict::Veto; }
        CvVerdict::Pass
    }
}

#[no_mangle]
pub extern "C" fn i13_ology_pack(x: u32, y: u32) -> u32 { OlogyPoint::new(x as u16, y as u16).pack() }
#[no_mangle]
pub extern "C" fn i13_ology_x(address: u32) -> u32 { OlogyPoint::unpack(address).x as u32 }
#[no_mangle]
pub extern "C" fn i13_ology_y(address: u32) -> u32 { OlogyPoint::unpack(address).y as u32 }
#[no_mangle]
pub extern "C" fn i13_queen_step(address: u32, direction: i32) -> u64 {
    let Ok(direction) = Direction::try_from(direction) else { return 0; };
    let Some(next) = OlogyPoint::unpack(address).step(direction) else { return 0; };
    (1u64 << 32) | next.pack() as u64
}
#[no_mangle]
pub extern "C" fn i13_cv_verify(address:u32,entered_depth:u32,emerged_depth:u32,max_depth:u32,authority:u32)->u32 {
    let root=OlogyPoint::unpack(address);
    CortexVerifier::verify(VoxelTransition{entered:VoxelCursor{root,depth:entered_depth},emerged:VoxelCursor{root,depth:emerged_depth}},CvContext{authority:authority!=0,max_depth}) as u32
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn address_roundtrip_is_exact(){for p in [OlogyPoint::new(0,0),OlogyPoint::new(1,2),OlogyPoint::new(0xffff,0xffff),OlogyPoint::new(0xc0a8,0x012a)]{assert_eq!(OlogyPoint::unpack(p.pack()),p);}}
    #[test] fn user_axis_convention_is_preserved(){let p=OlogyPoint::new(10,10);assert_eq!(p.step(Direction::Up),Some(OlogyPoint::new(11,10)));assert_eq!(p.step(Direction::Down),Some(OlogyPoint::new(9,10)));assert_eq!(p.step(Direction::Right),Some(OlogyPoint::new(10,11)));assert_eq!(p.step(Direction::Left),Some(OlogyPoint::new(10,9)));}
    #[test] fn surface_bounds_do_not_wrap(){assert_eq!(OlogyPoint::new(u16::MAX,0).step(Direction::Up),None);assert_eq!(OlogyPoint::new(0,0).step(Direction::Down),None);assert_eq!(OlogyPoint::new(0,u16::MAX).step(Direction::Right),None);assert_eq!(OlogyPoint::new(0,0).step(Direction::Left),None);}
    #[test] fn voxel_depth_is_local_not_packed_into_address(){let root=OlogyPoint::new(42,7);let a=VoxelCursor::enter(root);let b=a.burrow(81).unwrap();assert_eq!(a.root.pack(),b.root.pack());assert_eq!(b.depth,81);}
    #[test] fn cv_requires_authority(){let root=OlogyPoint::new(3,5);let t=VoxelTransition{entered:VoxelCursor::enter(root),emerged:VoxelCursor{root,depth:2}};assert_eq!(CortexVerifier::verify(t,CvContext{authority:false,max_depth:5}),CvVerdict::Veto);assert_eq!(CortexVerifier::verify(t,CvContext{authority:true,max_depth:5}),CvVerdict::Pass);}
    #[test] fn cv_rejects_escape_to_another_root_inside_voxel(){let t=VoxelTransition{entered:VoxelCursor::enter(OlogyPoint::new(3,5)),emerged:VoxelCursor{root:OlogyPoint::new(3,6),depth:0}};assert_eq!(CortexVerifier::verify(t,CvContext{authority:true,max_depth:5}),CvVerdict::Veto);}
    #[test] fn cv_enforces_depth_bound(){let root=OlogyPoint::new(3,5);let t=VoxelTransition{entered:VoxelCursor::enter(root),emerged:VoxelCursor{root,depth:6}};assert_eq!(CortexVerifier::verify(t,CvContext{authority:true,max_depth:5}),CvVerdict::Veto);}
}
