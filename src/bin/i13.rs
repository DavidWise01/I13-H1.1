#[path = "../compiler/mod.rs"]
mod compiler;

use std::{
    env,
    fs,
    io::{self, BufRead, Write},
    process,
};

use compiler::{build_wasm, compile, run, DumpKind, SourceFile};

fn main() {
    let args = env::args().skip(1).collect::<Vec<_>>();
    let command = args.first().map(String::as_str).unwrap_or("");

    let (path, output_path, dump_kind) = match args.as_slice() {
        [command, path] if matches!(command.as_str(), "check" | "run" | "trace" | "debug") => (path.clone(), None, None),
        [command, path, flag, output] if command == "build" && flag == "-o" => (path.clone(), Some(output.clone()), None),
        [command, path, flag] if command == "dump" => {
            let Some(kind) = DumpKind::from_flag(flag) else { usage() };
            (path.clone(), None, Some(kind))
        }
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
    let diagnostic_source = source.clone();
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
                print_numeric_globals(&output.ivm, &execution);
                Ok(())
            }
            Err(errors) => Err(errors),
        },
        "trace" => match compile(source) {
            Ok(output) => {
                let config = compiler::vm::VmConfig::default();
                print!("{}", compiler::trace::header(config.step_limit, config.frame_limit.min(compiler::ivm::I13_FRAME_LIMIT)));
                let mut observer = |event: &compiler::TraceEvent| {
                    println!("{}", compiler::trace::render_event(&output.ivm, event));
                };
                match compiler::vm::run_observed(&output.ivm, config, &mut observer) {
                    Ok(execution) => {
                        println!(
                            "TRACE OK · {} step(s) · peak stack {} · call depth {}",
                            execution.steps,
                            execution.peak_stack,
                            execution.max_call_depth,
                        );
                        print_numeric_globals(&output.ivm, &execution);
                        Ok(())
                    }
                    Err(error) => Err(vec![error]),
                }
            }
            Err(errors) => Err(errors),
        },
        "debug" => match compile(source.clone()) {
            Ok(output) => {
                let config = compiler::vm::VmConfig::default();
                print!(
                    "{}",
                    compiler::debugger::header(
                        config.step_limit,
                        config.frame_limit.min(compiler::ivm::I13_FRAME_LIMIT),
                    )
                );
                let debug_source = source.clone();
                let stdin = io::stdin();
                let mut input = stdin.lock();
                let mut line = String::new();
                let mut debugger = compiler::Debugger::new();

                let mut observer = |snapshot: &compiler::vm::DebugSnapshot| {
                    let Some(reason) = debugger.should_pause(snapshot) else {
                        return compiler::vm::DebugControl::Continue;
                    };

                    println!(
                        "{}",
                        compiler::debugger::render_pause(&output.ivm, &debug_source, snapshot, reason)
                    );

                    loop {
                        print!("i13dbg> ");
                        let _ = io::stdout().flush();
                        line.clear();
                        match input.read_line(&mut line) {
                            Ok(0) => {
                                println!("DEBUG EOF");
                                return compiler::vm::DebugControl::Quit;
                            }
                            Ok(_) => {}
                            Err(error) => {
                                eprintln!("debugger input: {error}");
                                return compiler::vm::DebugControl::Quit;
                            }
                        }

                        match debugger.command(&line, &output.ivm, &debug_source, snapshot) {
                            compiler::debugger::CommandEffect::Stay(text) => println!("{text}"),
                            compiler::debugger::CommandEffect::Resume(text) => {
                                println!("{text}");
                                return compiler::vm::DebugControl::Continue;
                            }
                            compiler::debugger::CommandEffect::Quit(text) => {
                                println!("{text}");
                                return compiler::vm::DebugControl::Quit;
                            }
                        }
                    }
                };

                match compiler::vm::run_debugged(&output.ivm, config, &mut observer) {
                    Ok(compiler::vm::DebugRunResult::Completed(execution)) => {
                        println!(
                            "DEBUG OK · {} step(s) · peak stack {} · call depth {}",
                            execution.steps,
                            execution.peak_stack,
                            execution.max_call_depth,
                        );
                        print_numeric_globals(&output.ivm, &execution);
                        Ok(())
                    }
                    Ok(compiler::vm::DebugRunResult::Quit) => Ok(()),
                    Err(error) => Err(vec![error]),
                }
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
        "dump" => {
            let kind = dump_kind.expect("dump kind is parsed above");
            match compiler::dump_compiler(&source, kind) {
                Ok(text) => {
                    print!("{text}");
                    Ok(())
                }
                Err(errors) => Err(errors),
            }
        }
        _ => unreachable!(),
    };

    if let Err(errors) = result {
        for (index, error) in errors.iter().enumerate() {
            if index > 0 {
                eprintln!();
            }
            eprintln!("{}", error.render(&diagnostic_source));
        }
        process::exit(1);
    }
}

fn print_numeric_globals(program: &compiler::ivm::IvmProgram, execution: &compiler::vm::VmResult) {
    for (slot, name) in program.globals.iter().enumerate() {
        if let Some(compiler::vm::Value::Number(value)) = execution.globals.get(slot).copied().flatten() {
            println!("{name} = {value}");
        }
    }
}

fn usage() -> ! {
    eprintln!("usage:");
    eprintln!("  i13 check <file.i13>");
    eprintln!("  i13 run <file.i13>");
    eprintln!("  i13 trace <file.i13>");
    eprintln!("  i13 debug <file.i13>");
    eprintln!("  i13 build <file.i13> -o <file.wasm>");
    eprintln!("  i13 dump <file.i13> --tokens|--ast|--hir|--ivm");
    process::exit(2);
}
