#[path = "../src/compiler/mod.rs"]
mod compiler;

use std::{fs, process::Command};

use compiler::{dump_compiler, DiagnosticCode, DumpKind, SourceFile};

fn sample() -> SourceFile {
    SourceFile::new(
        "introspect.i13",
        "def add(I a, I b) { -> a + b }\nI x <- 1\nx.p <- 2\nI OUT <- add(x, 3)\n",
    )
}

#[test]
fn all_dump_layers_are_byte_deterministic() {
    for kind in [DumpKind::Tokens, DumpKind::Ast, DumpKind::Hir, DumpKind::Ivm] {
        let first = dump_compiler(&sample(), kind).unwrap();
        let second = dump_compiler(&sample(), kind).unwrap();
        assert_eq!(first, second, "{} dump drifted across identical runs", kind.label());
        assert!(first.starts_with(&format!("I13 INTROSPECT {} v0.1\n", kind.label())));
    }
}

#[test]
fn dumps_expose_layer_changes_without_becoming_authority() {
    let tokens = dump_compiler(&sample(), DumpKind::Tokens).unwrap();
    assert!(tokens.contains("Ident(add)"));
    assert!(tokens.contains("NEWLINE"));
    assert!(tokens.contains("EOF"));
    assert!(tokens.contains("@1:1 [0..3]"));

    let ast = dump_compiler(&sample(), DumpKind::Ast).unwrap();
    assert!(ast.contains("FunctionDef add params=[a,b]"));
    assert!(ast.contains("Declare x"));
    assert!(ast.contains("Assign x.p"));
    assert!(ast.contains("Call add argc=2"));

    let hir = dump_compiler(&sample(), DumpKind::Hir).unwrap();
    assert!(hir.contains("FunctionDef add args=[a,b]"));
    assert!(hir.contains("Assign mode=declare target=x"));
    assert!(hir.contains("Assign mode=osmotic target=x"));
    assert!(hir.contains("Assign mode=declare target=OUT"));

    let ivm = dump_compiler(&sample(), DumpKind::Ivm).unwrap();
    assert!(ivm.contains("frame_limit 4096"));
    assert!(ivm.contains("g0000 add"));
    assert!(ivm.contains("g0001 x"));
    assert!(ivm.contains("g0002 OUT"));
    assert!(ivm.contains("global=g0:add function=fn0:add"));
    assert!(ivm.contains("mode=global-declare"));
    assert!(ivm.contains("op=Add"));
    assert!(ivm.contains("argc=2"));
}

#[test]
fn later_dump_layers_preserve_normal_diagnostic_gates() {
    let source = SourceFile::new("bad.i13", "I OUT <- nope(1)\n");

    assert!(dump_compiler(&source, DumpKind::Tokens).is_ok());
    assert!(dump_compiler(&source, DumpKind::Ast).is_ok());

    for kind in [DumpKind::Hir, DumpKind::Ivm] {
        let errors = dump_compiler(&source, kind).unwrap_err();
        assert!(errors.iter().any(|d| d.code == DiagnosticCode::SemanticUnknownFunction));
    }
}

#[test]
fn cli_exposes_all_four_dump_modes() {
    let path = std::env::temp_dir().join(format!("i13-introspect-{}.i13", std::process::id()));
    fs::write(&path, sample().text).unwrap();

    for (flag, label) in [
        ("--tokens", "TOKENS"),
        ("--ast", "AST"),
        ("--hir", "HIR"),
        ("--ivm", "IVM"),
    ] {
        let output = Command::new(env!("CARGO_BIN_EXE_i13"))
            .arg("dump")
            .arg(&path)
            .arg(flag)
            .output()
            .unwrap();
        assert!(output.status.success(), "dump {flag} failed: {}", String::from_utf8_lossy(&output.stderr));
        let stdout = String::from_utf8(output.stdout).unwrap();
        assert!(stdout.starts_with(&format!("I13 INTROSPECT {label} v0.1\n")));
    }

    let _ = fs::remove_file(path);
}
