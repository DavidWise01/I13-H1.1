---
name: fluent-python-ramalho
description: "Use when writing idiomatic, internals-deep Python 3 (Luciano Ramalho, Fluent Python, O'Reilly). Covers the data model, built-in data structures, first-class functions, OO idioms, generators/coroutines/asyncio, and metaprogramming. Pairs with automate-the-boring-stuff-sweigart as the 'deep internals' counterpart to 'practical glue'."
category: tooling
---

# Fluent Python — Ramalho (O'Reilly)

Idiomatic-Python-internals skill. Source: archive.org item `fluent_python`
— Luciano Ramalho, *Fluent Python*, O'Reilly, 1st ed (Python 3). Public,
`programming_books` / `folkscanomy`.

## What this skill is for
The "write *idiomatic* Python" layer: leverage the data model, built-in types,
and the deeper machinery (descriptors, decorators, generators, asyncio,
metaclasses) instead of bending Python into another language's patterns.
Directly affinitive to `automate-the-boring-stuff-sweigart` (its practical
counterpart) and `awk-programming` (expressive, idiom-driven transformation).
NOT a beginner text — this is the *proficient-to-mastery* tier.

## The six parts (from real OCR TOC)
**Part I — Prologue**
- Ch1 The Python Data Model (special methods, dunder protocols)

**Part II — Data Structures**
- Ch2 An Array of Sequences (listcomps, generators, tuples, slicing, arrays, memoryviews, NumPy, deques)
- Ch3 Dictionaries and Sets (comprehensions, defaultdict, set theory, hash tables)
- Ch4 Text versus Bytes (Unicode, encode/decode, memoryviews, normalization)

**Part III — Functions as Objects**
- Ch5 First-Class Functions (callables, higher-order, annotations)
- Ch6 Design Patterns with First-Class Functions (Strategy, Command)
- Ch7 Function Decorators and Closures (lru_cache, single dispatch, stacked/parameterized decorators)

**Part IV — Object-Oriented Idioms**
- Ch8 Object References, Mutability, and Recycling (== vs is, shallow/deep copy, weakrefs, GC)
- Ch9 A Pythonic Object (repr, slots, hashing, class attrs)
- Ch10 Sequence Hacking, Hashing, and Slicing (user-defined sequences, duck typing)
- Ch11 Interfaces: From Protocols to ABCs (collections.abc, register, virtual subclasses)
- Ch12 Inheritance: For Good or For Worse (MRO, mixins, composition)
- Ch13 Operator Overloading: Doing It Right (unary, rich comparison, augmented assignment)

**Part V — Control Flow**
- Ch14 Iterables, Iterators, and Generators (iter, yield, itertools, yield from)
- Ch15 Context Managers and else Blocks (with, contextlib, @contextmanager)
- Ch16 Coroutines (yield from, discrete event simulation)
- Ch17 Concurrency with Futures (concurrent.futures, GIL, threading/multiprocessing)
- Ch18 Concurrency with asyncio (event loop, aiohttp, servers)

**Part VI — Metaprogramming**
- Ch19 Dynamic Attributes and Properties (dynamic attrs, __new__, shelve, property factory)
- Ch20 Attribute Descriptors (validation, overriding vs nonoverriding)
- Ch21 Class Metaprogramming (class factories, __prepare__, metaclasses)

## Real corpus (in `corpus/`)
- `pf_djvu.txt` — 1.67 MB OCR text (grep-able; verified, 1,665,917 bytes)
- `pf.pdf` — 14.07 MB Text PDF (verified `%PDF-`, 14,072,728 bytes; < 100 MB → pushable)

Dropped from git (per mesh rule): `…_jp2.zip` / `…_orig_jp2.tar` (huge
scans) — local-only reference only.

## Distill -> Synthesize -> StandUp -> Read (flay discipline)
- DISTILL: TOC above read from the actual `_djvu.txt` "Table of Contents"
  block (lines ~180–1070), not memory.
- SYNTHESIZE: tooling/idiom layer; affinitive to `automate-the-boring-stuff-sweigart`
  (practical counterpart) and `awk-programming` (expressive idiom axis). Pairs
  naturally with a `python-stdlib` reference.
- STAND UP: promoted live to `~/.hermes/skills/fluent-python-ramalho`; folded
  into shared I13 repo (PR scoped to `skills/<name>/` only, no `.io`).
- READ: LIT proof = `ls` of live + pushed path; PDF byte size matches metadata.

## Quick grep examples (run against corpus/pf_djvu.txt)
- Data model: `grep -ni "special methods\|__getitem__" corpus/pf_djvu.txt | head`
- asyncio: `grep -ni "asyncio\|aiohttp" corpus/pf_djvu.txt | head`
- Descriptors: `grep -ni "descriptor\|__get__" corpus/pf_djvu.txt | head`
