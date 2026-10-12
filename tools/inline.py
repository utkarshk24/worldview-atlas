"""Rebuild site/index.html from tools/src. Run from the repository root: python3 tools/inline.py"""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "src"
body = (SRC / "index.src.html").read_text(encoding="utf-8")
for f in ("i18n.js", "strategic.js", "app.js"):
    body = body.replace(f"/*INLINE:{f}*/", (SRC / f).read_text(encoding="utf-8"))
old = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
head = old[: old.index("<title>")]  # keep doctype, meta tags and base config
title_end = body.index("</title>") + 8
rest = body[title_end:]
i = rest.index('<div id="loader">')
# reuse the meta/style block that follows <title> in the current page
meta = old[old.index("</title>") + 8 : old.index('<script>window.WV_BASE')] + '<script>window.WV_BASE="data/";</script>\n'
html = head + body[:title_end] + meta + rest[:i] + "</head>\n<body>\n" + rest[i:] + "\n</body>\n</html>\n"
(ROOT / "site" / "index.html").write_text(html, encoding="utf-8")
print("site/index.html rebuilt,", len(html), "bytes")
