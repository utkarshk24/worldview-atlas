"""Rebuild site/index.html from tools/src. Run from the repository root: python3 tools/inline.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "src"
body = (SRC / "index.src.html").read_text(encoding="utf-8")
for f in ("i18n.js", "strategic.js", "app.js"):
    body = body.replace(f"/*INLINE:{f}*/", (SRC / f).read_text(encoding="utf-8"))
title_end = body.index("</title>") + len("</title>")
rest = body[title_end:]
i = rest.index('<div id="loader">')
head = (SRC / "head.html").read_text(encoding="utf-8").replace("__TITLE__", body[:title_end])
html = head + rest[:i] + "</head>\n<body>\n" + rest[i:] + "\n</body>\n</html>\n"
(ROOT / "site" / "index.html").write_text(html, encoding="utf-8")
print("site/index.html rebuilt")
