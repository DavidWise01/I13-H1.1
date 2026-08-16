---
name: automate-the-boring-stuff-sweigart
description: "Use when automating real-world desktop/file/web tasks with Python (Al Sweigart, Automate the Boring Stuff, 2018). Covers the practical Python toolchain: regex, files, web scraping, Office docs, GUI automation, email."
category: tooling
---

# Automate the Boring Stuff with Python — Sweigart (2018)

Practical-Python automation skill. Source: archive.org item
`automatetheboringstuffwithpython_new` — Al Sweigart, *Automate the Boring
Stuff with Python: Practical Programming for Total Beginners*, No Starch
Press, 2018. Public, programming_books / folkscanomy.

## What this skill is for
The "get a thing done with Python" layer of the mesh: glue the OS, files,
the web, and Office formats together. Directly affinitive to `awk` (text
stream/transform) and `flay` (pull + fold sources) — this is the Python
expression of the same automate-the-drudge axis AWK pioneered. NOT a systems
primitive (that's `c-modern-approach-king`); this is **applied tooling**.

## The two parts (from real OCR TOC)
**PART I — Python Programming Basics**
- Ch1 Python Basics (expressions, data types, variables, print/input/len/str/int/float)
- Ch2 Flow Control (bool/comparison ops, if/else/elif, while, break/continue, for+range, import)
- Ch3 Functions
- Ch4 Lists
- Ch5 Dictionaries and Structuring Data
- Ch6 Manipulating Strings

**PART II — Automating Tasks**
- Ch7 Pattern Matching with Regular Expressions
- Ch8 Reading and Writing Files
- Ch9 Organizing Files
- Ch10 Debugging
- Ch11 Web Scraping (HTML, requests/bs4)
- Ch12 Working with Excel Spreadsheets
- Ch13 Working with PDF and Word Documents
- Ch14 Working with CSV Files and JSON Data
- Ch15 Keeping Time, Scheduling Tasks, and Launching Programs
- Ch16 Sending Email and Text Messages (SMTP, IMAP)
- Ch17 Manipulating Images
- Ch18 Controlling the Keyboard and Mouse with GUI Automation

## Real corpus (in `corpus/`)
- `atbs_djvu.txt` — 1.07 MB OCR text (grep-able; verified, 1,065,247 bytes)
- `atbs.pdf` — 14.88 MB Text PDF (verified `%PDF-`, 14,880,335 bytes; < 100 MB → pushable)

Dropped from git (per mesh rule): `…_jp2.zip` (168 MB, over GitHub's 100 MB
hard limit) — local-only reference only.

## Distill -> Synthesize -> StandUp -> Read (flay discipline)
- DISTILL: TOC above is read from the actual `_djvu.txt`, not memory.
- SYNTHESIZE: tooling/automation layer; affinitive to `awk-programming`,
  `flay`, and the `ia-unofficial-guide` harvest tooling. Pairs naturally with
  a `python-stdlib` reference and an `openpyxl`/`pyautogui` skill.
- STAND UP: promoted live to `~/.hermes/skills/automate-the-boring-stuff-sweigart`;
  folded into shared I13 repo (PR scoped to `skills/<name>/` only, no `.io`).
- READ: LIT proof = `ls` of live + pushed path; PDF byte size matches metadata.

## Quick grep examples (run against corpus/atbs_djvu.txt)
- Regex chapter: `grep -n "Pattern Matching with Regular Expressions" corpus/atbs_djvu.txt`
- GUI automation: `grep -ni "pyautogui" corpus/atbs_djvu.txt | head`
- Web scraping: `grep -ni "BeautifulSoup\|requests.get" corpus/atbs_djvu.txt | head`
