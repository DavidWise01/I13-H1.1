#[path = "../compiler/mod.rs"]
mod compiler;

use std::{env, fs, process};

use compiler::{build_wasm, compile, run, SourceFile};

fn main() {
    let args = env::args().skip(1).collect::<Vec<_>>();
    let command = args.first().map(String::as_str).unwrap_or("");

    let (path, output_path) = match args.as_slice() {
        [command, path] if matches!(command.as_str(), "check" | "run") => (path.clone(), None),
        [command, path, flag, output] if command == "build" && flag == "-o" => (path.clone(), Some(output.clone())),
        _ => usage(),
    };

    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) => {
            eprintln!("{path}: {error}");
            process::exit(2);
        }
    };

    let source = SourceFile::new(path.clone(), text);
    let result = match command {
        "check" => match compile(source) {
            Ok(output) => {
                println!(
                    "VALID · IVM {} ops · {} region(s) · peak stack {}",
                    compiler::ivm::OPCODE_COUNT,
                    output.validation.regions,
                    output.validation.peak_height,
                );
                Ok(())
            }
            Err(errors) => Err(errors),
        },
        "run" => match run(source, compiler::vm::VmConfig::default()) {
            Ok((output, execution)) => {
                println!(
                    "RUN OK · {} step(s) · peak stack {} · call depth {}",
                    execution.steps,
                    execution.peak_stack,
                    execution.max_call_depth,
                );
                for (slot, name) in output.ivm.globals.iter().enumerate() {
                    if let Some(compiler::vm::Value::Number(value)) = execution.globals.get(slot).copied().flatten() {
                        println!("{name} = {value}");
                    }
                }
                Ok(())
            }
            Err(errors) => Err(errors),
        },
        "build" => match build_wasm(source) {
            Ok((output, bytes)) => {
                let target = output_path.expect("build output path is parsed above");
                if let Err(error) = fs::write(&target, &bytes) {
                    eprintln!("{target}: {error}");
                    process::exit(2);
                }
                println!(
                    "BUILD OK · {} byte(s) · {} I13 global(s) · {}",
                    bytes.len(),
                    output.ivm.globals.len(),
                    target,
                );
                Ok(())
            }
            Err(errors) => Err(errors),
        },
        _ => unreachable!(),
    };

    if let Err(errors) = result {
        for error in errors {
            eprintln!("{}:{}:{} {} {}", path, error.span.line, error.span.column, error.code.as_str(), error.message);
        }
        process::exit(1);
    }
}

fn usage() -> ! {
    eprintln!("usage:");
    eprintln!("  i13 check <file.i13>");
    eprintln!("  i13 run <file.i13>");
    eprintln!("  i13 build <file.i13> -o <file.wasm>");
    process::exit(2);
}
