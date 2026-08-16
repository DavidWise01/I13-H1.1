#!/usr/bin/env python3
"""
retro_fetch.py — filtered bulk fetcher for the retro-game-books skill.

Reads references/book_index.json (135 real archive.org entries) and lets you
download a *subset* by platform / language / year / title, with a real-PDF
verification step (header + page-count sanity) so you never save a junk file.

No third-party deps. Uses stdlib + curl for download (archive.org is plain HTTP).

EXAMPLES
  python3 retro_fetch.py --list-platforms
  python3 retro_fetch.py --platform commodore --lang basic --year 1984 --dry-run
  python3 retro_fetch.py --platform commodore --lang basic --download --out ./pull
  python3 retro_fetch.py --title "6502" --download --out ./pull --verify
"""
import argparse, json, os, re, subprocess, sys, urllib.parse, shutil

ITEM = "RetroGameDesignAndProgrammingBooks"
HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, os.pardir, "references", "book_index.json")


def load_index():
    if not os.path.exists(INDEX):
        sys.exit(f"[ERR] index not found: {INDEX}\n(run from the skill dir, or fix the path)")
    return json.load(open(INDEX, encoding="utf-8")).get("books", [])


def year_of(name):
    m = re.search(r"(19\d{2})", name)
    return int(m.group(1)) if m else None


def plat_match(book, want):
    return want and any(want in (p.lower()) for p in book.get("plat", []))


def filter_books(books, platform, lang, year, title):
    plat_w = (platform or "").lower()
    lang_w = (lang or "").lower()
    title_w = (title or "").lower()
    out = []
    for b in books:
        if plat_w and not plat_match(b, plat_w):
            continue
        if lang_w and (b.get("lang") or "").lower() != lang_w:
            continue
        if year and year_of(b["name"]) != year:
            continue
        if title_w and title_w not in b["name"].lower():
            continue
        out.append(b)
    return out


def pdf_is_real(path):
    """Header sanity + page-count peek. Returns (ok, note)."""
    try:
        with open(path, "rb") as f:
            head = f.read(8)
        if not head.startswith(b"%PDF-"):
            return False, "bad header (not %PDF-)"
        # try pdfinfo for page count
        if shutil.which("pdfinfo"):
            r = subprocess.run(["pdfinfo", path], capture_output=True, text=True, timeout=20)
            m = re.search(r"Pages:\s+(\d+)", r.stdout)
            if m and int(m.group(1)) < 1:
                return False, "0 pages"
            return True, (f"{m.group(1)} pages" if m else "header ok")
        return True, "header ok (pdfinfo absent, skipped page check)"
    except Exception as e:
        return False, f"read error: {e}"


def download(book, out_dir, verify):
    os.makedirs(out_dir, exist_ok=True)
    name = book["name"] + ".pdf"
    url = f"https://archive.org/download/{ITEM}/{urllib.parse.quote(name)}"
    dest = os.path.join(out_dir, name)
    # sanitize only the filename part, not the directory separators
    base = re.sub(r'[<>:"/\\|?*]', "_", name)
    dest_safe = os.path.join(out_dir, base)
    print(f"  GET {name}  ({book['size']/1048576:.1f} MB)")
    r = subprocess.run(["curl", "-sL", "--max-time", "300", url, "-o", dest_safe],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(f"    [ERR] curl failed: {r.stderr.strip()[:120]}")
        return False
    if not os.path.exists(dest_safe) or os.path.getsize(dest_safe) < 1000:
        print(f"    [ERR] empty/short file")
        return False
    if verify:
        ok, note = pdf_is_real(dest_safe)
        print(f"    verify: {'OK' if ok else 'FAIL'} ({note})")
        return ok
    return True


def main():
    ap = argparse.ArgumentParser(description="Filtered fetcher for retro-game-books archive.org collection.")
    ap.add_argument("--list-platforms", action="store_true", help="print platform histogram and exit")
    ap.add_argument("--platform", help="filter by platform substring (commodore/apple/atari/trs-80/ti-99/6502)")
    ap.add_argument("--lang", help="filter by language (BASIC/Logo/mixed)")
    ap.add_argument("--year", type=int, help="filter by 4-digit year")
    ap.add_argument("--title", help="substring match on title")
    ap.add_argument("--dry-run", action="store_true", help="list matches, don't download")
    ap.add_argument("--download", action="store_true", help="download the filtered subset")
    ap.add_argument("--out", default="./pull", help="output dir for downloads (default ./pull)")
    ap.add_argument("--verify", action="store_true", help="verify each PDF (header + pages) after download")
    args = ap.parse_args()

    books = load_index()
    if args.list_platforms:
        from collections import Counter
        c = Counter()
        for b in books:
            for p in b.get("plat", []):
                c[p] += 1
        print(f"total books: {len(books)}")
        for k, v in c.most_common():
            print(f"  {k:<12} {v}")
        print(f"  (no-platform-tag) {sum(1 for b in books if not b.get('plat'))}")
        return

    matched = filter_books(books, args.platform, args.lang, args.year, args.title)
    print(f"matched: {len(matched)} of {len(books)}")
    for b in matched[:50]:
        y = year_of(b["name"]) or "?"
        plat = ",".join(b.get("plat", [])) or "-"
        print(f"  [{y}] {b['name']}  | {plat} | {b['lang']} | {b['size']/1048576:.1f} MB")
    if len(matched) > 50:
        print(f"  ... +{len(matched)-50} more")

    if args.dry_run or not args.download:
        if not args.dry_run:
            print("(add --download to fetch; --dry-run to just preview)")
        return

    ok = 0
    for b in matched:
        if download(b, args.out, args.verify):
            ok += 1
    print(f"\ndone: {ok}/{len(matched)} downloaded" + (" + verified" if args.verify else ""))


if __name__ == "__main__":
    main()
