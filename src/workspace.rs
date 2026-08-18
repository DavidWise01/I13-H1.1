//! Native-only bounded coding workspace for E1.TECH-001.
//!
//! This module deliberately owns host filesystem/process authority and must not
//! be compiled into the wasm32 core. It operates only inside an existing local
//! Git working tree and never invokes network Git operations.

use std::collections::BTreeSet;
use std::fs;
use std::io::{self, Write};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Output, Stdio};

pub const MAX_READ_BYTES: usize = 256 * 1024;
pub const MAX_PATCH_BYTES: usize = 64 * 1024;
pub const MAX_PATCH_FILES: usize = 4;
pub const MAX_CAPTURE_BYTES: usize = 1024 * 1024;

#[repr(i32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AgentTrit {
    N1 = -1,
    P0 = 0,
    P1 = 1,
}

impl AgentTrit {
    pub fn symbol(self) -> &'static str {
        match self {
            Self::N1 => "n1",
            Self::P0 => "p0",
            Self::P1 => "p1",
        }
    }

    pub fn authority(self) -> AgentAuthority {
        match self {
            Self::N1 => AgentAuthority::Hold,
            Self::P0 => AgentAuthority::Flay,
            Self::P1 => AgentAuthority::Proceed,
        }
    }
}

impl TryFrom<i32> for AgentTrit {
    type Error = WorkspaceError;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            -1 => Ok(Self::N1),
            0 => Ok(Self::P0),
            1 => Ok(Self::P1),
            _ => Err(WorkspaceError::InvalidTrit(value)),
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AgentAuthority {
    Hold,
    Flay,
    Proceed,
}

impl AgentAuthority {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Hold => "HOLD",
            Self::Flay => "FLAY",
            Self::Proceed => "PROCEED",
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WorkspaceCapability {
    Read,
    Build,
    Test,
    Patch,
    Git,
}

impl WorkspaceCapability {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Build => "build",
            Self::Test => "test",
            Self::Patch => "patch",
            Self::Git => "git",
        }
    }
}

#[derive(Debug)]
pub enum WorkspaceError {
    Io(io::Error),
    InvalidTrit(i32),
    NotGitRepo(String),
    InvalidPath(String),
    PathEscape(String),
    GitMetadataDenied(String),
    NotTracked(String),
    DirtyTarget(String),
    TooLarge { what: &'static str, size: usize, limit: usize },
    NonUtf8(String),
    Unsupported(String),
    CommandFailed { program: String, code: i32, stderr: String },
}

impl std::fmt::Display for WorkspaceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(e) => write!(f, "io: {e}"),
            Self::InvalidTrit(v) => write!(f, "invalid trit {v}; expected -1, 0, or +1"),
            Self::NotGitRepo(p) => write!(f, "not a Git worktree: {p}"),
            Self::InvalidPath(p) => write!(f, "invalid repository-relative path: {p}"),
            Self::PathEscape(p) => write!(f, "path escapes repository root: {p}"),
            Self::GitMetadataDenied(p) => write!(f, "direct .git access denied: {p}"),
            Self::NotTracked(p) => write!(f, "patch target is not a tracked regular file: {p}"),
            Self::DirtyTarget(p) => write!(f, "patch target already has local changes: {p}"),
            Self::TooLarge { what, size, limit } => write!(f, "{what} is {size} bytes; limit is {limit}"),
            Self::NonUtf8(p) => write!(f, "text operation requires UTF-8: {p}"),
            Self::Unsupported(s) => write!(f, "unsupported workspace operation: {s}"),
            Self::CommandFailed { program, code, stderr } => write!(f, "{program} failed with exit {code}: {stderr}"),
        }
    }
}

impl std::error::Error for WorkspaceError {}

impl From<io::Error> for WorkspaceError {
    fn from(value: io::Error) -> Self { Self::Io(value) }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommandReceipt {
    pub program: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

impl CommandReceipt {
    pub fn success(&self) -> bool { self.exit_code == 0 }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PatchReceipt {
    pub files: Vec<String>,
    pub diff_check: CommandReceipt,
}

#[derive(Clone, Debug)]
pub struct GitWorkspace {
    root: PathBuf,
}

impl GitWorkspace {
    pub fn open(start: impl AsRef<Path>) -> Result<Self, WorkspaceError> {
        let start = fs::canonicalize(start.as_ref())?;
        if !start.is_dir() {
            return Err(WorkspaceError::NotGitRepo(start.display().to_string()));
        }
        let output = Command::new("git")
            .arg("-C").arg(&start)
            .args(["rev-parse", "--show-toplevel"])
            .env("GIT_TERMINAL_PROMPT", "0")
            .output()?;
        if !output.status.success() {
            return Err(WorkspaceError::NotGitRepo(start.display().to_string()));
        }
        let raw = String::from_utf8(output.stdout).map_err(|_| WorkspaceError::NonUtf8("git root".into()))?;
        let root = fs::canonicalize(raw.trim())?;
        Ok(Self { root })
    }

    pub fn root(&self) -> &Path { &self.root }

    pub fn head(&self) -> Result<String, WorkspaceError> {
        let out = self.run_git(&["rev-parse", "HEAD"], None)?;
        if !out.success() {
            return Err(command_error("git rev-parse HEAD", &out));
        }
        Ok(out.stdout.trim().to_string())
    }

    pub fn inspect(&self, relative: &str) -> Result<String, WorkspaceError> {
        let path = self.resolve_existing(relative)?;
        let meta = fs::metadata(&path)?;
        let size = meta.len() as usize;
        if size > MAX_READ_BYTES {
            return Err(WorkspaceError::TooLarge { what: "read target", size, limit: MAX_READ_BYTES });
        }
        let bytes = fs::read(&path)?;
        String::from_utf8(bytes).map_err(|_| WorkspaceError::NonUtf8(relative.to_string()))
    }

    pub fn status(&self) -> Result<CommandReceipt, WorkspaceError> {
        self.run_git(&["status", "--porcelain=v1", "--untracked-files=all"], None)
    }

    pub fn diff(&self, relative: Option<&str>) -> Result<CommandReceipt, WorkspaceError> {
        match relative {
            None => self.run_git(&["diff", "--no-ext-diff", "--no-color"], None),
            Some(path) => {
                let normalized = validate_relative(path)?;
                self.resolve_existing(&normalized)?;
                self.run_git(&["diff", "--no-ext-diff", "--no-color", "--", &normalized], None)
            }
        }
    }

    pub fn build_i13_offline(&self) -> Result<CommandReceipt, WorkspaceError> {
        self.require_cargo_repo()?;
        self.run_program("cargo", &["build", "--offline", "--bin", "i13"])
    }

    pub fn test_all_offline(&self) -> Result<CommandReceipt, WorkspaceError> {
        self.require_cargo_repo()?;
        self.run_program("cargo", &["test", "--offline", "--all-targets"])
    }

    pub fn apply_patch(&self, patch: &str) -> Result<PatchReceipt, WorkspaceError> {
        let bytes = patch.len();
        if bytes == 0 || bytes > MAX_PATCH_BYTES {
            return Err(WorkspaceError::TooLarge { what: "patch", size: bytes, limit: MAX_PATCH_BYTES });
        }
        let files = parse_patch_files(patch)?;
        if files.is_empty() || files.len() > MAX_PATCH_FILES {
            return Err(WorkspaceError::Unsupported(format!("patch must touch 1..={MAX_PATCH_FILES} tracked files")));
        }

        for file in &files {
            self.resolve_existing(file)?;
            if !self.is_regular_tracked(file)? {
                return Err(WorkspaceError::NotTracked(file.clone()));
            }
            let status = self.run_git(&["status", "--porcelain=v1", "--", file], None)?;
            if !status.stdout.trim().is_empty() {
                return Err(WorkspaceError::DirtyTarget(file.clone()));
            }
        }

        let check = self.run_git(&["apply", "--check", "--whitespace=error-all", "-"], Some(patch.as_bytes()))?;
        if !check.success() {
            return Err(command_error("git apply --check", &check));
        }
        let apply = self.run_git(&["apply", "--whitespace=error-all", "-"], Some(patch.as_bytes()))?;
        if !apply.success() {
            return Err(command_error("git apply", &apply));
        }

        let mut args = vec!["diff", "--check", "--"];
        for file in &files { args.push(file.as_str()); }
        let diff_check = self.run_git(&args, None)?;
        if !diff_check.success() {
            let mut restore = vec!["checkout", "--"];
            for file in &files { restore.push(file.as_str()); }
            let _ = self.run_git(&restore, None);
            return Err(command_error("git diff --check", &diff_check));
        }

        Ok(PatchReceipt { files, diff_check })
    }

    fn require_cargo_repo(&self) -> Result<(), WorkspaceError> {
        if !self.root.join("Cargo.toml").is_file() {
            return Err(WorkspaceError::Unsupported("build/test v0.1 requires Cargo.toml at repository root".into()));
        }
        Ok(())
    }

    fn is_regular_tracked(&self, relative: &str) -> Result<bool, WorkspaceError> {
        let out = self.run_git(&["ls-files", "-s", "--", relative], None)?;
        if !out.success() || out.stdout.trim().is_empty() { return Ok(false); }
        let mode = out.stdout.split_whitespace().next().unwrap_or("");
        Ok(mode.starts_with("100"))
    }

    fn resolve_existing(&self, relative: &str) -> Result<PathBuf, WorkspaceError> {
        let normalized = validate_relative(relative)?;
        let joined = self.root.join(&normalized);
        let canonical = fs::canonicalize(&joined)?;
        if !canonical.starts_with(&self.root) {
            return Err(WorkspaceError::PathEscape(relative.to_string()));
        }
        if !canonical.is_file() {
            return Err(WorkspaceError::InvalidPath(relative.to_string()));
        }
        Ok(canonical)
    }

    fn run_program(&self, program: &str, args: &[&str]) -> Result<CommandReceipt, WorkspaceError> {
        let output = Command::new(program)
            .args(args)
            .current_dir(&self.root)
            .env("CARGO_NET_OFFLINE", "true")
            .env("GIT_TERMINAL_PROMPT", "0")
            .env("I13_WORKSPACE_OFFLINE", "1")
            .output()?;
        Ok(receipt(program, args, output))
    }

    fn run_git(&self, args: &[&str], input: Option<&[u8]>) -> Result<CommandReceipt, WorkspaceError> {
        let mut cmd = Command::new("git");
        cmd.arg("-C").arg(&self.root).args(args)
            .env("GIT_TERMINAL_PROMPT", "0")
            .stdin(if input.is_some() { Stdio::piped() } else { Stdio::null() })
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let mut child = cmd.spawn()?;
        if let Some(bytes) = input {
            let mut stdin = child.stdin.take().ok_or_else(|| WorkspaceError::Unsupported("git stdin unavailable".into()))?;
            stdin.write_all(bytes)?;
        }
        let output = child.wait_with_output()?;
        Ok(receipt("git", args, output))
    }
}

pub fn validate_relative(path: &str) -> Result<String, WorkspaceError> {
    if path.trim().is_empty() {
        return Err(WorkspaceError::InvalidPath(path.to_string()));
    }
    let p = Path::new(path);
    if p.is_absolute() {
        return Err(WorkspaceError::InvalidPath(path.to_string()));
    }
    let mut parts = Vec::new();
    for component in p.components() {
        match component {
            Component::Normal(part) => {
                let text = part.to_string_lossy();
                if text == ".git" {
                    return Err(WorkspaceError::GitMetadataDenied(path.to_string()));
                }
                parts.push(text.into_owned());
            }
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(WorkspaceError::InvalidPath(path.to_string()));
            }
        }
    }
    if parts.is_empty() {
        return Err(WorkspaceError::InvalidPath(path.to_string()));
    }
    Ok(parts.join("/"))
}

pub fn parse_patch_files(patch: &str) -> Result<Vec<String>, WorkspaceError> {
    for banned in ["new file mode", "deleted file mode", "rename from ", "rename to ", "old mode ", "new mode ", "GIT binary patch", "Binary files ", "--- /dev/null", "+++ /dev/null"] {
        if patch.contains(banned) {
            return Err(WorkspaceError::Unsupported(format!("patch feature denied: {banned}")));
        }
    }

    let mut files = BTreeSet::new();
    for line in patch.lines() {
        let Some(rest) = line.strip_prefix("diff --git a/") else { continue; };
        let Some((left, right)) = rest.split_once(" b/") else {
            return Err(WorkspaceError::Unsupported("malformed diff --git header".into()));
        };
        if left != right {
            return Err(WorkspaceError::Unsupported("rename/cross-path patch denied".into()));
        }
        files.insert(validate_relative(left)?);
    }
    if files.is_empty() {
        return Err(WorkspaceError::Unsupported("unified patch has no diff --git header".into()));
    }

    for line in patch.lines() {
        if let Some(path) = line.strip_prefix("--- a/") {
            let p = validate_relative(path)?;
            if !files.contains(&p) { return Err(WorkspaceError::Unsupported("--- path does not match diff header".into())); }
        } else if line.starts_with("--- ") {
            return Err(WorkspaceError::Unsupported("unsupported --- patch path".into()));
        }
        if let Some(path) = line.strip_prefix("+++ b/") {
            let p = validate_relative(path)?;
            if !files.contains(&p) { return Err(WorkspaceError::Unsupported("+++ path does not match diff header".into())); }
        } else if line.starts_with("+++ ") {
            return Err(WorkspaceError::Unsupported("unsupported +++ patch path".into()));
        }
    }

    Ok(files.into_iter().collect())
}

fn receipt(program: &str, args: &[&str], output: Output) -> CommandReceipt {
    CommandReceipt {
        program: format!("{} {}", program, args.join(" ")),
        exit_code: output.status.code().unwrap_or(-1),
        stdout: capture(output.stdout),
        stderr: capture(output.stderr),
    }
}

fn capture(mut bytes: Vec<u8>) -> String {
    if bytes.len() > MAX_CAPTURE_BYTES {
        bytes.truncate(MAX_CAPTURE_BYTES);
        bytes.extend_from_slice(b"\n[I13 capture truncated]\n");
    }
    String::from_utf8_lossy(&bytes).into_owned()
}

fn command_error(program: &str, receipt: &CommandReceipt) -> WorkspaceError {
    WorkspaceError::CommandFailed {
        program: program.to_string(),
        code: receipt.exit_code,
        stderr: receipt.stderr.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TempRepo { path: PathBuf }
    impl Drop for TempRepo { fn drop(&mut self) { let _ = fs::remove_dir_all(&self.path); } }

    fn git(path: &Path, args: &[&str]) {
        let status = Command::new("git").arg("-C").arg(path).args(args).status().unwrap();
        assert!(status.success(), "git {:?} failed", args);
    }

    fn repo() -> TempRepo {
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let path = std::env::temp_dir().join(format!("i13-ws-{}-{nonce}", std::process::id()));
        fs::create_dir_all(&path).unwrap();
        git(&path, &["init", "-q"]);
        git(&path, &["config", "user.email", "i13@example.invalid"]);
        git(&path, &["config", "user.name", "I13 Test"]);
        fs::write(path.join("a.txt"), "alpha\nbeta\n").unwrap();
        git(&path, &["add", "a.txt"]);
        git(&path, &["commit", "-qm", "seed"]);
        TempRepo { path }
    }

    #[test]
    fn trit_gate_is_native_three_state() {
        assert_eq!(AgentTrit::try_from(-1).unwrap().authority(), AgentAuthority::Hold);
        assert_eq!(AgentTrit::try_from(0).unwrap().authority(), AgentAuthority::Flay);
        assert_eq!(AgentTrit::try_from(1).unwrap().authority(), AgentAuthority::Proceed);
        assert!(AgentTrit::try_from(2).is_err());
    }

    #[test]
    fn paths_cannot_escape_or_enter_git_metadata() {
        assert!(validate_relative("src/lib.rs").is_ok());
        assert!(validate_relative("../outside").is_err());
        assert!(validate_relative(".git/config").is_err());
        assert!(validate_relative("x/.git/config").is_err());
    }

    #[test]
    fn opens_local_repo_and_reads_inside_only() {
        let r = repo();
        let ws = GitWorkspace::open(&r.path).unwrap();
        assert_eq!(ws.inspect("a.txt").unwrap(), "alpha\nbeta\n");
        assert!(!ws.head().unwrap().is_empty());
    }

    #[test]
    fn patch_requires_clean_tracked_existing_target() {
        let r = repo();
        let ws = GitWorkspace::open(&r.path).unwrap();
        fs::write(r.path.join("a.txt"), "dirty\n").unwrap();
        let patch = "diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1,2 +1,2 @@\n-alpha\n+gamma\n beta\n";
        assert!(matches!(ws.apply_patch(patch), Err(WorkspaceError::DirtyTarget(_))));
    }

    #[test]
    fn patch_is_git_native_and_bounded() {
        let r = repo();
        let ws = GitWorkspace::open(&r.path).unwrap();
        let patch = "diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1,2 +1,2 @@\n-alpha\n+gamma\n beta\n";
        let receipt = ws.apply_patch(patch).unwrap();
        assert_eq!(receipt.files, vec!["a.txt"]);
        assert!(receipt.diff_check.success());
        assert_eq!(fs::read_to_string(r.path.join("a.txt")).unwrap(), "gamma\nbeta\n");
    }

    #[test]
    fn patch_refuses_creation_deletion_and_traversal() {
        assert!(parse_patch_files("diff --git a/a.txt b/a.txt\nnew file mode 100644\n").is_err());
        assert!(parse_patch_files("diff --git a/../x b/../x\n").is_err());
        assert!(parse_patch_files("not a patch").is_err());
    }
}
