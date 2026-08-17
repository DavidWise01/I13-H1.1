#[path = "../compiler/mod.rs"]
mod compiler;

use std::{env, fs, process};

use compiler::{compile, SourceFile};

fn main() {
    let mut args = env::args().skip(1);
    let command = args.next().unwrap_or_default();
    let path = args.next().unwrap_or_default();

    if command != "check" || path.is_empty() || args.next().is_some() {
        eprintln!("usage: i13 check <file.i13>");
        process::exit(2);
    }

    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) => {
            eprintln!("{path}: {error}");
            process::exit(2);
        }
    };

    match compile(SourceFile::new(path.clone(), text)) {
        Ok(output) => println!(
            "VALID · IVM {} ops · {} region(s) · peak stack {}",
            compiler::ivm::OPCODE_COUNT,
            output.validation.regions,
            output.validation.peak_height,
        ),
        Err(errors) => {
            for error in errors {
                eprintln!("{}:{}:{} {} {}", path, error.span.line, error.span.column, error.code.as_str(), error.message);
            }
            process::exit(1);
        }
    }
}
