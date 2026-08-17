import re, html
base = "C:/Users/Dave/i13-worktop/p-prime-prime/corpus"
txt = open(base + "/wp_article.html", encoding="utf-8", errors="replace").read()
txt = re.sub(r"<script.*?</script>|<style.*?</style>", "", txt, flags=re.S)
txt = re.sub(r"<[^>]+>", " ", txt); txt = html.unescape(txt)
txt = re.sub(r"\s+", " ", txt)
i = txt.find("Instruction correspondence")
print("=== Instruction correspondence ===")
print(txt[i:i+520] if i >= 0 else "NOT FOUND")
j = txt.find("Example translation from P")
print("\n=== Example translation ===")
print(txt[j:j+420] if j >= 0 else "NOT FOUND")
