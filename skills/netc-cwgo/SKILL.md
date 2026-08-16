---
name: netc-cwgo
description: Use when the user wants Morse code (CW) — encode/decode text to Morse, build ham-radio practice sheets, or generate audible CW audio (WAV) for receive training, using the NETC_CWGO archive. Reproduces the DOS MC/FL/MT training modes on a modern host without 16-bit EXEs.
category: communication
---

# netc-cwgo — Morse / CW Trainer (modern host port)

Wraps the classic **NETC CW GO** DOS package (`CW.COM`, `MORSE.EXE`, `MORSETU*.EXE`,
`MORSE.DCT` word list, ham-radio config) as a usable Hermes skill. The original
16-bit `.EXE`/`.COM` binaries do NOT run on modern Windows, so this skill ships a
**stdlib-only Python tool** (`cw_tool.py`) that reproduces the package's training
intent on the host:

- **MC** (Morse tutor) → decode/receive practice: text → Morse, with random-char drills.
- **FL** (flashing lights) → on/off keying pattern (timing table) for visual copying.
- **MT** (training) → learn-chars / receive / send / test modes, all driven from text.

## When to use
- "convert this to Morse", "what's the Morse for SOS", "make me a CW practice sheet"
- "generate Morse audio / a WAV I can copy by ear", "flash-card drill for K, M, R"
- "build a random code group at 15 wpm", "what does dah-dit-dah mean"

## Files in this skill dir (verbatim archive)
- `CW.COM`, `MORSE.EXE`, `MORSETU1.EXE`, `MORSETU2.EXE` — original DOS binaries (historical; won't run on Win11)
- `CWGUIDE.TXT` — Brian Murrey's 1987 CW learning guide (chart + suggested learning order)
- `MORSE.DCT` — 90KB English word list used for practice texts
- `ANTENNAS.CW`, `CITIES.CW`, `RIGS.CW`, `GROUPS.*.CW`, `NAMES.CW`, `WORDS.CW` — ham config/data
- `README.1ST` — speed-calibration procedure (PARIS = 50 units = 1 word)
- `GO.BAT` — describes the 3 programs (MC / FL / MT)

## Core reference: ITU Morse (canonical, embedded in cw_tool.py)
Learning order from CWGUIDE.TXT (receive-first):
1. E I S H 5 (all dits)
2. T M O 0 (all dahs)
3. A W J R L P 1 (start with one dit)
4. N D B K Y X C 6 (start with one dah)
5. U F V G Q Z + 2 3 4 7 8 9 (the rest)

Standard word **PARIS** = 50 dot-units = defines "words per minute".

## Commands (all via cw_tool.py, no pip)
Encode text → Morse:
  python3 cw_tool.py encode "CQ CQ DE GRIDOSPHERE 73"
Decode Morse → text:
  python3 cw_tool.py decode "...-.- --.-"
Practice sheet (random groups, N words, W wpm):
  python3 cw_tool.py sheet --groups 10 --wpm 15 --out sheet.txt
Flash timing table (visual keying, Dah=3 units, gap=1, letter=3, word=7):
  python3 cw_tool.py flash "CQ DE"
Generate audible CW WAV (copy-by-ear training):
  python3 cw_tool.py audio "CQ CQ DE GRIDOSPHERE 73" --wpm 15 --out cq.wav

Audio uses stdlib `wave` (sine tone keyed on/off). Tone freq default 600 Hz,
unit ms derived from wpm: unit_ms = 1200 / wpm (PARIS rule).

## Verification
- Run `python3 cw_tool.py encode "SOS"` → expect `... --- ...`
- Run `python3 cw_tool.py decode "... --- ..."` → expect `SOS`
- Run `python3 cw_tool.py audio "CQ" --wpm 20 --out /tmp/cq.wav` → file should be a
  valid WAV (verify with `python3 -c "import wave;wave.open('/tmp/cq.wav')"`).

## Notes / honesty
- The DOS binaries are preserved for provenance only; they are NOT executed.
- All "training" is generated locally; no network calls.
- This skill is staged in `Davids files/hermes agent/skill-worktop/` and is NOT
  committed to the shared I13 git (repo is shared with ChatGPT per user instruction).
