---
name: learning-patterns
description: "Use when the user references 'Learning Patterns', patterns.dev, Lydia Hallie, Addy Osmani, JavaScript/React design patterns (Proxy, Provider, Observer, Module, Render Props, HOC, Hooks, Factory, Compound, Flyweight), or rendering patterns (CSR/SSR/Static/Hydration/Progressive). Built from real archive.org OCR — NOT a generic 'how to learn' book; it is the patterns.dev JS/React guide."
category: tooling-reference
---

# Learning Patterns (patterns.dev) — JS/React Design & Rendering Patterns

**Source:** `Learning Patterns` by **Lydia Hallie & Addy Osmani** (2021),
shared under Creative Commons (patterns.dev). Flayed from archive.org item
**`learning-patterns`** (the user URL `learning-patterns/learning-patterns-final-v1.1/`
used a collection-prefix path; the bare item id is `learning-patterns`).
`corpus/learning-patterns_djvu.txt` (OCR) + `corpus/learning-patterns.pdf`
(30.6 MB readable scan).

**IMPORTANT — what this actually is:** despite the title, the content is the
**patterns.dev** guide: modern **JavaScript / React design patterns** plus
**rendering & performance patterns**. It is NOT a "how to learn" / study-skills
book. The intro states: *"Design patterns are a fundamental part of software
development, as they provide typical solutions to commonly recurring problems
in software design."*

## What it is
A **tooling/reference** artifact for frontend engineers — a catalog of
reusable React/JS architecture patterns, with trade-offs (when to use Hooks vs
HOC vs Render Props, Provider for global state, etc.) and rendering-strategy
guidance (CSR/SSR/Static/Hydration) with performance KPIs.

## DISTILL — real pattern inventory (from the OCR)
**Design patterns (with authors Lydia Hallie & Addy Osmani):**
- **Proxy Pattern** — intercept get/set on an object (perf caution: not for
  hot paths).
- **Provider Pattern** — share global data (e.g. theme/UI state) via Context.
- **Observer Pattern** — pub/sub; combined with Iterator in ReactiveX.
- **Module Pattern** — encapsulate private parts of code.
- **Render Props Pattern** — a prop whose value is a function/component.
- **Hooks Pattern** — React Hooks as the modern replacement for HOC/Render
  Props for most shared-state problems.
- **Higher-Order Component (HOC) Pattern** — wrap a component; often replaceable
  by Hooks.
- **Factory Pattern** — factory functions that create objects.
- **Compound Pattern** — related components (menus/items) via Context API;
  great for component libraries.
- **Flyweight Pattern** — conserve memory when creating many similar objects.
- **Container/Presentational Pattern** — separate logic from view (largely
  superseded by Hooks).
- **Prototype Pattern** — share properties among objects via the prototype.

**Rendering patterns (perf chapter):**
- **Client-Side Rendering (CSR)**, **Server-Side Rendering (SSR)**,
  **Static Rendering**, **Hydration**, **Progressive Rendering**.
- Guidance: Chrome team encourages static/SSR over full rehydration;
  measure with **Rendering KPIs** before choosing.
- Also: Redux/Flux pattern, code-splitting, lazy loading, memoization.

Introduction anchor (verbatim): *"Design patterns are a fundamental part of
software development, as they provide typical solutions to commonly recurring
problems in software design. Rather than providing specific pieces of
software, design patterns are merely [templates]."*

## SYNTHESIZE — mesh placement
- **Layer:** tooling/reference (with `google-hacking-pentest`, `ia-cli-intro`).
  NOT cultural-myth, NOT a computational primitive.
- **Affinity:** frontend/JS engineering. Pairs with the **Python affinity
  ladder** only as a sibling "patterns" reference (different language). Strong
  affinity to anything React/Next.js/rendering-architecture.
- **Non-affinity:** not a study-methods book (despite the title); not OSINT.

## STAND UP / READ (LIT proof)
- `corpus/learning-patterns_djvu.txt` — 351,832 B real OCR (DjVuTXT).
- `corpus/learning-patterns.pdf` — 30,613,744 B (30.6 MB, under GitHub's 100
  MB per-file GH001 limit → pushable).
- Dropped from PR: `learning-patterns-v1.1.pdf` (142 MB → GH001 reject),
  `_jp2.zip` (191 MB → reject), redundant OCR layers (`_abbyy.gz`, `_hocr.*`).

## Pitfalls (carried)
- **Title is a misnomer** — it's patterns.dev (JS/React), not learning science.
  Verify before citing it as a "study" resource.
- The user URL used a collection prefix (`learning-patterns/...-final-v1.1/`);
  bare `metadata/learning-patterns-final-v1.1` 404'd with
  `{"error":"Couldn't get ... for item learning-patterns"}`. Recovered via
  `metadata/learning-patterns` → real item. Always strip the collection prefix
  and hit the bare id.
- OCR is noisy; the pattern headers (Proxy/Provider/Observer/Module/Render
  Props/Hooks/HOC/Factory/Compound/Flyweight) are the trustworthy structure.
- i13n: no `rm -rf`; promote via `mkdir -p` + `cp -r`. No force-push.
