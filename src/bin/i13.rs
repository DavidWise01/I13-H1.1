#[path = "../compiler/mod.rs"]
mod compiler;

use std::{env, fs, process};

use compiler::{compile, run, SourceFile};

fn main() {
    let mut args = env::args().skip(1);
    let command = args.next().unwrap_or_default();
    let path = args.next().unwrap_or_default();

    if path.is_empty() || args.next().is_some() || !matches!(command.as_str(), "check" | "run") {
        eprintln!("usage: i13 <check|run> <file.i13>");
        process::exit(2);
    }

    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) => {
            eprintln!("{path}: {error}");
            process::exit(2);
        }
    };

    let source = SourceFile::new(path.clone(), text);
    let result = match command.as_str() {
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
        _ => unreachable!(),
    };

    if let Err(errors) = result {
        for error in errors {
            eprintln!("{}:{}:{} {} {}", path, error.span.line, error.span.column, error.code.as_str(), error.message);
        }
        process::exit(1);
    }
}
