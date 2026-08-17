import re, html
base = "C:/Users/Dave/i13-worktop/p-prime-prime/corpus"
txt = open(base + "/wp_article.html", encoding="utf-8", errors="replace").read()
txt = re.sub(r"<script.*?</script>|<style.*?</style>", "", txt, flags=re.S)
txt = re.sub(r"<[^>]+>", " ", txt); txt = html.unescape(txt)
txt = re.sub(r"\s+", " ", txt)
# print the table region after 'Instruction correspondence [ edit ]'
i = txt.find("Instruction correspondence [ edit ]")
print("=== full correspondence + example region ===")
print(txt[i:i+1500])
