#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OlogyPoint {
    pub x: u16,
    pub y: u16,
}

impl OlogyPoint {
    pub const fn new(x: u16, y: u16) -> Self { Self { x, y } }

    pub const fn pack(self) -> u32 {
        ((self.x as u32) << 16) | self.y as u32
    }

    pub const fn unpack(address: u32) -> Self {
        Self { x: (address >> 16) as u16, y: address as u16 }
    }

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
pub enum Direction {
    Up = 0,
    Down = 1,
    Right = 2,
    Left = 3,
    UpRight = 4,
    UpLeft = 5,
    DownRight = 6,
    DownLeft = 7,
}

impl TryFrom<i32> for Direction {
    type Error = ();

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::Up),
            1 => Ok(Self::Down),
            2 => Ok(Self::Right),
            3 => Ok(Self::Left),
            4 => Ok(Self::UpRight),
            5 => Ok(Self::UpLeft),
            6 => Ok(Self::DownRight),
            7 => Ok(Self::DownLeft),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VoxelCursor {
    pub root: OlogyPoint,
    pub depth: u32,
}

impl VoxelCursor {
    pub const fn enter(root: OlogyPoint) -> Self { Self { root, depth: 0 } }

    pub fn burrow(self, delta: i32) -> Option<Self> {
        let depth = if delta >= 0 {
            self.depth.checked_add(delta as u32)?
        } else {
            self.depth.checked_sub(delta.unsigned_abs())?
        };
        Some(Self { depth, ..self })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VoxelTransition {
    pub entered: VoxelCursor,
    pub emerged: VoxelCursor,
}
