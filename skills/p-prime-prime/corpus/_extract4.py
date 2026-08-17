import re, html
base = "C:/Users/Dave/i13-worktop/p-prime-prime/corpus"
txt = open(base + "/wp_article.html", encoding="utf-8", errors="replace").read()
txt = re.sub(r"<script.*?</script>|<style.*?</style>", "", txt, flags=re.S)
txt = re.sub(r"<[^>]+>", " ", txt); txt = html.unescape(txt)
txt = re.sub(r"\s+", " ", txt)
# Example translation from P'' to BF region
k = txt.find("Example translation from P")
print("=== example region ===")
print(txt[k:k+900] if k>=0 else "NF")
# tape mirroring
t = txt.find("Tape mirroring")
print("\n=== tape mirroring ===")
print(txt[t:t+260] if t>=0 else "NF")
# first example words section
e = txt.find("Example 1")
print("\n=== Example 1 ===")
print(txt[e:e+400] if e>=0 else "NF")
