//! Native host worker for E1.TECH-001.
//! Usage: i13-workspace <repo> <-1|0|1> <inspect|status|diff|build|test|patch> [path]

#[path = "../workspace.rs"]
mod workspace;

use std::env;
use std::io::{self, Read};
use std::process;
use workspace::{AgentAuthority, AgentTrit, CommandReceipt, GitWorkspace, WorkspaceCapability, WorkspaceError};

fn main() {
    let code = match run() {
        Ok(code) => code,
        Err(error) => {
            eprintln!("I13_WORKSPACE_RECEIPT");
            eprintln!("verdict=VETO");
            eprintln!("error={error}");
            eprintln!("r0=1");
            2
        }
    };
    process::exit(code);
}

fn run() -> Result<i32, WorkspaceError> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        return Err(WorkspaceError::Unsupported(usage().into()));
    }

    let repo = &args[1];
    let raw_trit = args[2]
        .parse::<i32>()
        .map_err(|_| WorkspaceError::Unsupported("trit must be -1, 0, or 1".into()))?;
    let trit = AgentTrit::try_from(raw_trit)?;
    let command = args[3].as_str();
    let capability = capability_for(command)?;
    let authority = trit.authority();

    if authority != AgentAuthority::Proceed {
        print_gate_receipt(repo, trit, capability);
        return Ok(match authority {
            AgentAuthority::Hold => 20,
            AgentAuthority::Flay => 21,
            AgentAuthority::Proceed => 0,
        });
    }

    let ws = GitWorkspace::open(repo)?;
    let head_before = ws.head()?;
    match command {
        "inspect" => {
            require_arity(&args, 5, "inspect requires one repository-relative path")?;
            let text = ws.inspect(&args[4])?;
            print_header(&ws, trit, capability, &head_before);
            println!("exit=0");
            println!("r0=1");
            println!("--- stdout ---");
            print!("{text}");
            Ok(0)
        }
        "status" => {
            require_arity(&args, 4, "status takes no path")?;
            finish_command(&ws, trit, capability, &head_before, ws.status()?)
        }
        "diff" => {
            if args.len() > 5 {
                return Err(WorkspaceError::Unsupported("diff accepts zero or one repository-relative path".into()));
            }
            let path = args.get(4).map(String::as_str);
            finish_command(&ws, trit, capability, &head_before, ws.diff(path)?)
        }
        "build" => {
            require_arity(&args, 4, "build takes no extra arguments")?;
            finish_command(&ws, trit, capability, &head_before, ws.build_i13_offline()?)
        }
        "test" => {
            require_arity(&args, 4, "test takes no extra arguments")?;
            finish_command(&ws, trit, capability, &head_before, ws.test_all_offline()?)
        }
        "patch" => {
            require_arity(&args, 4, "patch reads one bounded unified diff from stdin")?;
            let mut patch = String::new();
            io::stdin().read_to_string(&mut patch)?;
            let receipt = ws.apply_patch(&patch)?;
            print_header(&ws, trit, capability, &head_before);
            println!("exit=0");
            println!("changed_files={}", receipt.files.join(","));
            println!("diff_check={}", if receipt.diff_check.success() { "PASS" } else { "VETO" });
            println!("r0=1");
            Ok(0)
        }
        _ => Err(WorkspaceError::Unsupported(usage().into())),
    }
}

fn capability_for(command: &str) -> Result<WorkspaceCapability, WorkspaceError> {
    match command {
        "inspect" => Ok(WorkspaceCapability::Read),
        "status" | "diff" => Ok(WorkspaceCapability::Git),
        "build" => Ok(WorkspaceCapability::Build),
        "test" => Ok(WorkspaceCapability::Test),
        "patch" => Ok(WorkspaceCapability::Patch),
        _ => Err(WorkspaceError::Unsupported(usage().into())),
    }
}

fn print_gate_receipt(repo: &str, trit: AgentTrit, capability: WorkspaceCapability) {
    println!("I13_WORKSPACE_RECEIPT");
    println!("repo={repo}");
    println!("trit={}", trit.symbol());
    println!("value={}", trit as i32);
    println!("authority={}", trit.authority().as_str());
    println!("capability={}", capability.as_str());
    println!("executed=0");
    println!("r0=1");
}

fn print_header(ws: &GitWorkspace, trit: AgentTrit, capability: WorkspaceCapability, head: &str) {
    println!("I13_WORKSPACE_RECEIPT");
    println!("repo={}", ws.root().display());
    println!("head={head}");
    println!("trit={}", trit.symbol());
    println!("value={}", trit as i32);
    println!("authority={}", trit.authority().as_str());
    println!("capability={}", capability.as_str());
    println!("executed=1");
}

fn finish_command(
    ws: &GitWorkspace,
    trit: AgentTrit,
    capability: WorkspaceCapability,
    head: &str,
    receipt: CommandReceipt,
) -> Result<i32, WorkspaceError> {
    print_header(ws, trit, capability, head);
    println!("program={}", receipt.program);
    println!("exit={}", receipt.exit_code);
    println!("r0=1");
    if !receipt.stdout.is_empty() {
        println!("--- stdout ---");
        print!("{}", receipt.stdout);
    }
    if !receipt.stderr.is_empty() {
        eprintln!("--- stderr ---");
        eprint!("{}", receipt.stderr);
    }
    Ok(if receipt.success() { 0 } else { 30 })
}

fn require_arity(args: &[String], expected: usize, message: &str) -> Result<(), WorkspaceError> {
    if args.len() == expected { Ok(()) } else { Err(WorkspaceError::Unsupported(message.into())) }
}

fn usage() -> &'static str {
    "usage: i13-workspace <repo> <-1|0|1> <inspect PATH|status|diff [PATH]|build|test|patch>; patch reads unified diff on stdin"
}
