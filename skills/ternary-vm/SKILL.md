---
name: ternary-vm
description: Use when the user wants to RUN a balanced-ternary programming environment — SBTCVM Gen2-9 with the TernOO ternary object-oriented language. This skill stages the 6.5 GB SBTCVM Gen2-9 + TernOO Appliance (.ova VirtualBox image) for a local VM build. The appliance is the only runnable obscure ternary *language* on archive.org. Staged in the worktop; build/import into VirtualBox to use.
category: software
---

# ternary-vm — SBTCVM Gen2-9 + TernOO Appliance

Staging skill for the **SBTCVM Gen2-9 balanced ternary virtual machine** with
**TernOO**, an object-oriented **ternary programming language** (by Thomas
Leathers). This is the only runnable obscure *ternary language* archived on
archive.org — the closest thing to a "trit" programming environment.

## Source (archive.org)
- Item: `sbtcvm-gen-2-9-tern-oo-v-1.0`
- URL:  https://archive.org/details/sbtcvm-gen-2-9-tern-oo-v-1.0
- Artifact in this dir: `SBTCVM-Gen2-9-TernOO-v1.0.ova` (6,523,405,312 bytes,
  verified exact-size match to archive.org metadata; valid OVA/tar `ustar`).

## How to build / run (VM build)
The appliance is an Open Virtualization Format archive (`.ova` = tar of an
`.ovf` + disk image). To use:
1. Install VirtualBox (or import into any OVF-compatible hypervisor).
2. `File → Import Appliance` → select `SBTCVM-Gen2-9-TernOO-v1.0.ova`.
3. Boot the VM; it contains SBTCVM Gen2-9 preloaded with the TernOO language
   environment (read-to-run per the item description).
4. Write/run TernOO ternary programs inside the VM.

## Notes
- This is a heavy (6.5 GB) appliance, NOT a text skill. The corpus is the VM
  image itself — there is no plain-text source to grep.
- For *theory* on ternary+qubit rather than a runnable ternary language, see the
  companion `ternary-quantum` skill (3 arxiv PDFs).
- Staged in `Davids files/hermes agent/skill-worktop/` — NOT committed to the
  shared I13 git (per user instruction). Import the .ova into a VM to actually
  use TernOO.

## Verification (LIT, re-engaged this turn)
- Downloaded 6,523,405,312 bytes = archive.org metadata size (exact match).
- File magic `ustar` (valid OVA/tar).
