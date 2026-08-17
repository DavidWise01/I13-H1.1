import re, html
base = "C:/Users/Dave/i13-worktop/p-prime-prime/corpus"
txt = open(base + "/wp_article.html", encoding="utf-8", errors="replace").read()
txt = re.sub(r"<script.*?</script>|<style.*?</style>", "", txt, flags=re.S)
txt = re.sub(r"<[^>]+>", " ", txt); txt = html.unescape(txt)
txt = re.sub(r"\s+", " ", txt)
# second occurrence = real body
idxs = [m.start() for m in re.finditer(r"Instruction correspondence", txt)]
print("occurrences:", len(idxs))
if len(idxs) > 1:
    i = idxs[1]
    print(txt[i:i+600])
else:
    # fallback: find 'r prime' / 'Tape mirroring' body
    for kw in ["Tape mirroring", "P'' instruction", "equivalent to", "increment the", "decrement"]:
        k = txt.lower().find(kw.lower())
        if k > 30000:  # body region
            print(f"--- {kw} ---")
            print(txt[k:k+400]); print()
            break
