#[repr(u32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChildPhase {
    Zero = 0,
    Resolve = 1,
    Bind = 2,
    Spawn = 3,
    Decode = 4,
    Execute = 5,
    Return = 6,
    Witness = 7,
    Terminate = 8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChildReceipt {
    pub child_id: u64,
    pub depth: u32,
    pub width: u64,
    pub witness: u64,
    pub terminated: bool,
}

#[derive(Debug)]
pub struct CortexChild {
    id: u64,
    depth: u32,
    width: u64,
    phase: ChildPhase,
    private_state: u64,
}

impl CortexChild {
    pub fn spawn(id: u64, depth: u32, width: u64) -> Self {
        Self { id, depth, width, phase: ChildPhase::Spawn, private_state: 0 }
    }

    pub const fn phase(&self) -> ChildPhase { self.phase }

    pub fn execute(mut self, private_state: u64, witness: u64) -> ChildReceipt {
        self.phase = ChildPhase::Execute;
        self.private_state = private_state;
        self.phase = ChildPhase::Return;
        self.phase = ChildPhase::Witness;
        self.phase = ChildPhase::Terminate;
        // Only the explicit receipt leaves this scope. private_state is deliberately omitted.
        ChildReceipt {
            child_id: self.id,
            depth: self.depth,
            width: self.width,
            witness,
            terminated: true,
        }
    }
}
