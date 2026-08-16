---
name: sbtcvm
description: "Use when running or building for SBTCVM-Gen2-9 — the balanced-ternary 9-trit virtual machine (Thomas Leathers et al). Covers clone, the three frontends (bare/curses/pygame), the XAS assembler shell, writing+assembling SSTNPL programs, AND a local HTML web wrapper (web/ subdir) that drives the real VM in a browser. Replaces the abandoned ternary-vm archive.org .ova flay with a verified local running build."
category: computational-primitive
---

# SBTCVM-Gen2-9 — balanced-ternary 9-trit VM

Computational-primitive skill for the **balanced-ternary** VM. Source:
`https://github.com/SBTCVM/SBTCVM-Gen2-9` (master). This skill is built from
a **real, running local clone** (not an archive.org `.ova` that 500'd) — every
command below was executed and captured in `corpus/`.

## What this is
SBTCVM Gen2-9 is a 9-trit balanced-ternary virtual machine (v2.1.0.alpha).
Trits are -, 0, + (ternary). It has dual "CPUs" (MEM0/IO0/CPU0 + MEM1/IO1/CPU1),
an assembler (XAS / g2asm), and a high-level language **SSTNPL**.

## The three frontends (from guide.md)
- **bare** (`./bare_sbtcvm.py <trom>`) — HEADLESS, no deps. Intended for
  non-interactive use. **This is the one that works everywhere.**
- **curses** (`./cur_sbtcvm.py <trom>`) — needs a real TTY.
- **pygame** (`./pyg_sbtcvm.py <trom>`) — needs pygame + SDL2 (graphics/sound).

## Verified setup (LIT on Python 3.14.6, Windows MSYS)
```
git clone --depth 1 https://github.com/SBTCVM/SBTCVM-Gen2-9.git
cd SBTCVM-Gen2-9
python3 -m venv .venv && . .venv/Scripts/activate
pip install windows-curses        # OK
pip install pygame                # WALL on py3.14: no prebuilt wheel + build needs SDL2 dev headers; see PITFALLS
```
Run from the repo root (scripts `os.chdir` to their own location, but `vmuser`
etc. must be reachable).

## What actually ran (LIT — see corpus/)
1. `python bare_sbtcvm.py counttestprint` → VM boots dual 9-trit CPUs, runs a
   countdown 9840→1244. Evidence: `corpus/bare_counttestprint_run.txt`.
2. `python xas.py` → XAS shell "v2.1.0. Ready"; `help` + `trominfo` work.
   (py2/py3 shim prints a harmless `raw_input` NameError at EOF when piped.)
3. **Full author→execute loop (LIT):** wrote `corpus/hello_count.stnp`,
   assembled it, ran it:
   ```
   python stnpcom.py hello_count.stnp     # -> vmuser/hello_count.trom (943 B)
   python bare_sbtcvm.py hello_count      # prints 1 2 3 4 5, "done.", clean halt
   ```
   Evidence: `corpus/hello_run.txt`.

## SSTNPL mini-reference (from real docs in references/textdocs/SSTNPL/)
- Vars: `var x=@10` (decimal `@`, char `:`, ternary no prefix `*`).
- Print: `print [s]` (raw), `prline [s]` (raw + newline), `newline`, `space`.
- Math: `add a,b` then `set result` (also sub/mul/div/divmod/sum).
- Loop: `for i in urange @1,@5,@1` ... `end`  (COMMAS, not spaces!).
- Halt: `stop` (emits VMSYSHALT soft stop).
- Compile: `python stnpcom.py file.stnp` → `file.trom` (auto-runs g2asm).
- Run: `python bare_sbtcvm.py file` (no `.trom` extension needed).

## PITFALLS (carried + this session)
- **WALL: pygame on Python 3.14.** No prebuilt wheel exists for py3.14, and the
  source build's backend tries to `pacman`-install SDL2 dev libs (FileNotFoundError
  — bare `pacman` not on PATH, and only the runtime SDL2 DLL was installed via
  `/c/msys64/usr/bin/pacman.exe -S mingw-w64-x86_64-SDL2`). To get graphics you
  need a Python ≤3.12 with a pygame wheel, OR wire mingw64/bin + SDL2 dev headers
  into pip's build env. **Bare frontend is the reliable path.**
- **`for` syntax uses COMMAS**: `for i in urange @1,@5,@1` — spaces fail with
  "invalid argument sequence".
- XAS `runb` via the shell errored ("plugin command error") in this session —
  use `python bare_sbtcvm.py <trom>` directly instead; it works.
- trit vocabulary: `-`/`0`/`+`. Nonets = 9 trits. The VM reports sizes in
  Nonets/Kt9 and words.

## Web wrapper (HTML frontend — drives the REAL VM in a browser)
Location: **`web/`** subdir of this skill (`sbtcvm/web/sbtcvm_web.py` + `index.html`).
This is the "see the ternary VM run in a browser" path — no pygame/curses needed.

```
cd SBTCVM-Gen2-9      # or copy web/ next to a SBTCVM checkout
python -m venv .venv && . .venv/Scripts/activate
pip install windows-curses
python web/sbtcvm_web.py     # serves http://127.0.0.1:8000/
```
Open `http://127.0.0.1:8000/` — two panels:
1. **Run a TROM** (dropdown of real ROMs) + **LIVE** button streams stdout via SSE.
2. **Write SSTNPL → Compile & Run** + **LIVE** button.

API:
- `GET /api/list` — trom inventory (roms/vmuser/apps)
- `GET /api/run?trom=X` — JSON, halting troms
- `POST /api/stnp` (body `{"src":"..."}`) — compile+run JSON
- `GET /api/stream/run?trom=X` — **SSE**, live 9-trit VM stdout (looping troms)
- `POST /api/stream/stnp` — SSE, compile+run live

Verified LIT: SSE streamed 6400 `event: line` frames in 6s for `counttestprint`;
`/api/run?trom=hello_count` returns `ok=True` clean halt. (See corpus/ for
`bare_counttestprint_run.txt` + `hello_run.txt`.) NOTE: the wrapper must run
from a SBTCVM repo root (it shells out to `bare_sbtcvm.py`/`stnpcom.py`).

## Mesh placement
Computational primitive — the **ternary** axis. Affinitive to
`automate-the-boring-stuff-sweigart` (Python tooling that drives it) and the
I13 primitive stack (php/awk). Directly supersedes the stuck `ternary-vm`
archive.org flay (that `.ova` download 500'd; this is a live, verified build).
