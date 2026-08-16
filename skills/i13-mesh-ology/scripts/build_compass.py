#!/usr/bin/env python3
"""
build_compass.py — I-13 MESH COMPASS generator.
Derives its node list PROGRAMMATICALLY from the gathered ology_explorer.html
SKILLS array (the corpus we flayed this session), then emits a single
self-contained mesh_compass.html with curated reading ladders.

Honesty: every node is a real flayed skill (provenance below). The reading
ladders are a curated synthesis authored from the gathered corpus — labeled as
such, not presented as source-derived.
"""
import os, re, json, datetime

OLOGY = r"C:/Users/Dave/i13-worktop/i13-mesh-ology/ology_explorer.html"
OUT   = r"C:/Users/Dave/i13-worktop/i13-mesh-ology/scripts/mesh_compass.html"

raw = open(OLOGY, encoding="utf-8").read()
# Extract the SKILLS = [ ... ]; block (JS object literal, single-quoted)
m = re.search(r"const SKILLS\s*=\s*(\[.*?\]);", raw, re.S)
if not m:
    raise SystemExit("SKILLS array not found in ology_explorer.html")
skills_js = m.group(1)

# Evaluate the JS literal with Node (real interpreter) -> JSON, so single-quoted
# keys/values parse correctly. This is also the LIT step that proves the source.
import subprocess, tempfile, os
js_eval = "const SKILLS = " + skills_js + ";\nconsole.log(JSON.stringify(SKILLS));"
td = tempfile.gettempdir()
jp = os.path.join(td, "extract_skills.js")
open(jp, "w", encoding="utf-8").write(js_eval)
try:
    out = subprocess.run(["node", jp], capture_output=True, text=True, timeout=30)
finally:
    if os.path.exists(jp): os.remove(jp)
if out.returncode != 0:
    raise SystemExit("node eval failed: " + out.stderr[:200])
skills = json.loads(out.stdout.strip().splitlines()[-1])

# Build a JS literal of the gathered nodes (so the compass is provably derived)
nodes_js = json.dumps(skills, indent=2, ensure_ascii=False)

# Curated reading ladders — authored synthesis from the gathered corpus.
# Each entry references a real skill `n`.
LADDERS = [
    {"name": "Programming Ladder (applied)",
     "blurb": "Learn to think in code, then in systems.",
     "steps": ["think-python-downey", "automate-the-boring-stuff-sweigart",
               "fluent-python-ramalho", "fundamentals-cpp",
               "data-structures-algorithms", "programming-8086", "embedded-8051"]},
    {"name": "Humanities Ladder (old texts)",
     "blurb": "Two 'old' picks the user gathered — antiquity to art.",
     "steps": ["libanius-1517", "works-of-hogarth"]},
    {"name": "Mind / Thought-Control Contrast",
     "blurb": "Clinical vs contested — read as a paired inoculation.",
     "steps": ["rape-of-the-mind", "eyes-wide-open"]},
    {"name": "Computing History Spine",
     "blurb": "Where the machines came from.",
     "steps": ["byte-magazine-first-issue", "retro-game-books",
               "embedded-8051", "programming-8086"]},
    {"name": "Foundations → Theory → Practice",
     "blurb": "From primitives to real-world craft.",
     "steps": ["sbtcvm", "data-structures-algorithms",
               "learning-patterns", "google-hacking-pentest"]},
]
ladders_js = json.dumps(LADDERS, indent=2, ensure_ascii=False)

n = len(skills)
now = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M UTC")

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>I-13 Mesh Compass</title>
<style>
  :root{--bg:#0a0e14;--fg:#c8d6e5;--dim:#5a6b82;--acc:#27e8a7;--amber:#ffb454;--panel:#0f1620;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 "Cascadia Code",Consolas,Menlo,monospace;}
  header{padding:12px 16px;border-bottom:1px solid #1c2735}
  h1{font-size:16px;margin:0;color:var(--acc)}
  .sub{font-size:11px;color:var(--dim);margin-top:4px}
  main{padding:14px 16px;max-width:1100px}
  .stat{display:flex;gap:18px;margin:10px 0 18px;flex-wrap:wrap}
  .stat b{color:var(--acc);font-size:18px}
  .ladder{background:var(--panel);border:1px solid #1c2735;border-radius:8px;padding:12px;margin-bottom:12px}
  .ladder h3{margin:0 0 4px;font-size:13px;color:var(--amber)}
  .ladder p{margin:0 0 8px;font-size:12px;color:var(--dim)}
  .chain{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .node{padding:5px 9px;border:1px solid #1d3b32;border-radius:6px;background:#10231d;color:var(--acc);font-size:12px;cursor:default}
  .arrow{color:var(--dim)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:14px}
  .card{background:var(--panel);border:1px solid #1c2735;border-radius:8px;padding:10px}
  .card h4{margin:0 0 4px;font-size:12px;color:var(--acc)}
  .card .meta{font-size:11px;color:var(--dim)}
  .pill{display:inline-block;font-size:10px;padding:2px 7px;border-radius:9px;margin-top:4px}
  .v{background:#10231d;color:var(--acc);border:1px solid #1d3b32}
  .c{background:#2a1410;color:#ff9d6e;border:1px solid #4a2517}
  .k{background:#2a2614;color:var(--amber);border:1px solid #4a3f1d}
  footer{font-size:11px;color:var(--dim);padding:0 16px 16px}
  code{color:var(--amber)}
</style>
</head>
<body>
<header>
  <h1>&#9883; I-13 Mesh Compass</h1>
  <div class="sub">Synthesized FROM the gathered corpus — __N__ real flayed skills. Reading ladders are a curated build, not source-derived.</div>
</header>
<main>
  <div class="stat">
    <div><b>__N__</b><br><span class="sub">skills gathered</span></div>
    <div><b>__L__</b><br><span class="sub">reading ladders</span></div>
    <div><b>__VER__</b><br><span class="sub">VERIFIED</span></div>
    <div><b>__CON__</b><br><span class="sub">CONTESTED</span></div>
    <div><b>__CLI__</b><br><span class="sub">CLINICAL</span></div>
  </div>
  <div id="ladders"></div>
  <div class="grid" id="grid"></div>
</main>
<footer>
  Generated __NOW__ by build_compass.py. Node list extracted programmatically from ology_explorer.html (the flayed corpus). Ladders authored as synthesis. No external fetch; opens via <code>file://</code>.
</footer>
<script>
const SKILLS = __NODES__;
const LADDERS = __LADDERS__;
const byName = Object.fromEntries(SKILLS.map(s => [s.n, s]));

// ladders
const ld = document.getElementById("ladders");
LADDERS.forEach(L => {
  const wrap = document.createElement("div");
  wrap.className = "ladder";
  const h = document.createElement("h3"); h.textContent = L.name; wrap.appendChild(h);
  const p = document.createElement("p"); p.textContent = L.blurb; wrap.appendChild(p);
  const chain = document.createElement("div"); chain.className = "chain";
  L.steps.forEach((nm, i) => {
    if (i) { const a = document.createElement("span"); a.className="arrow"; a.textContent="→"; chain.appendChild(a); }
    const nd = byName[nm];
    const el = document.createElement("span");
    el.className = "node";
    el.textContent = nd ? nd.n : nm + " (missing)";
    el.title = nd ? (nd.topic + " / " + nd.ology + " / " + nd.status) : "not in gathered corpus";
    chain.appendChild(el);
  });
  wrap.appendChild(chain);
  ld.appendChild(wrap);
});

// full grid
const grid = document.getElementById("grid");
SKILLS.forEach(s => {
  const el = document.createElement("div"); el.className = "card";
  const h = document.createElement("h4"); h.textContent = s.n; el.appendChild(h);
  const m = document.createElement("div"); m.className = "meta";
  m.innerHTML = s.topic + " · " + s.ology + "<br>" + (s.note||"");
  el.appendChild(m);
  const st = document.createElement("span");
  st.className = "pill " + (s.status==="VERIFIED"?"v":s.status==="CONTESTED"?"k":"c");
  st.textContent = s.status; el.appendChild(st);
  grid.appendChild(el);
});
</script>
</body>
</html>
"""

ver = sum(1 for s in skills if s.get("status")=="VERIFIED")
con = sum(1 for s in skills if s.get("status")=="CONTESTED")
cli = sum(1 for s in skills if s.get("status")=="CLINICAL")
html = (html
        .replace("__N__", str(n))
        .replace("__L__", str(len(LADDERS)))
        .replace("__VER__", str(ver))
        .replace("__CON__", str(con))
        .replace("__CLI__", str(cli))
        .replace("__NODES__", nodes_js)
        .replace("__LADDERS__", ladders_js)
        .replace("__NOW__", now))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(html)
print(f"wrote {OUT}")
print(f"nodes={n} ladders={len(LADDERS)} VERIFIED={ver} CONTESTED={con} CLINICAL={cli}")
print("ladder steps all resolve:",
      all(nm in byName_check for L in LADDERS for nm in L["steps"])
      if (byName_check := {s["n"] for s in skills}) else "n/a")
