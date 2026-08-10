#!/usr/bin/env python3
"""
embed_covers.py — Make the Star Wars Audiobook Library work fully offline.

What it does:
  Reads data.js, finds every `cover:` value, downloads each cover image once,
  base64-encodes it, and writes data-offline.js with every cover swapped for an
  inline `data:` URI. Nothing else in the file is touched.

Why: the app streams covers from Wookieepedia. This bakes them into the file so
the library renders with no internet connection.

Requirements:
  - Python 3.8+ (standard library only — no pip installs needed).

Usage:
  1. Put this file in the same folder as data.js, index.html, app.js.
  2. Run:  python3 embed_covers.py
  3. It writes data-offline.js next to data.js.
  4. To use it, either:
       - rename data-offline.js to data.js (keep a backup of the original), or
       - edit index.html's <script src="data.js"> to point at data-offline.js.

Notes:
  - Re-running is safe; it always reads data.js and regenerates data-offline.js.
  - The offline file will be large (tens of MB). That's expected — it's every
    cover inlined. Load time goes up; internet dependency goes to zero.
  - If a cover fails to download, the script keeps its original URL and prints a
    warning, so that one still works online while the rest are embedded.
"""

import base64
import mimetypes
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "data.js")
OUT = os.path.join(HERE, "data-offline.js")

# The CDN prefix declared at the top of data.js as: const CDN = "...";
CDN_RE = re.compile(r'const\s+CDN\s*=\s*"([^"]+)"')

# Two cover forms appear in data.js:
#   cover:CDN+"path/to/file.jpg/revision/latest?cb=123"
#   cover:"https://full/url/file.png/revision/latest?cb=123"
COVER_CDN_RE = re.compile(r'cover:CDN\+"([^"]+)"')
COVER_ABS_RE = re.compile(r'cover:"(https?://[^"]+)"')

USER_AGENT = "Mozilla/5.0 (offline-embed-script; personal use)"


def read_source():
    if not os.path.exists(SRC):
        sys.exit(f"ERROR: data.js not found next to this script ({SRC}).")
    with open(SRC, "r", encoding="utf-8") as f:
        return f.read()


def find_cdn(text):
    m = CDN_RE.search(text)
    if not m:
        sys.exit("ERROR: could not find `const CDN = \"...\"` in data.js.")
    return m.group(1)


def collect_urls(text, cdn):
    """Return {full_url: [(match_kind, matched_path_or_url), ...]} de-duplicated."""
    urls = {}
    for path in COVER_CDN_RE.findall(text):
        full = cdn + path
        urls.setdefault(full, ("cdn", path))
    for full in COVER_ABS_RE.findall(text):
        urls.setdefault(full, ("abs", full))
    return urls


def download_as_data_uri(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        ctype = resp.headers.get("Content-Type", "").split(";")[0].strip()
    if not ctype:
        ctype = mimetypes.guess_type(url.split("?")[0])[0] or "image/jpeg"
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{ctype};base64,{b64}", len(raw)


def main():
    text = read_source()
    cdn = find_cdn(text)
    urls = collect_urls(text, cdn)
    print(f"Found {len(urls)} unique covers to embed.\n")

    # url -> data URI
    resolved = {}
    failures = []
    for i, (url, (kind, key)) in enumerate(urls.items(), 1):
        label = key if kind == "abs" else key.split("/revision")[0]
        try:
            data_uri, size = download_as_data_uri(url)
            resolved[url] = data_uri
            print(f"[{i:>3}/{len(urls)}] ok   {label}  ({size // 1024} KB)")
        except Exception as e:  # noqa: BLE001 - report and keep going
            failures.append((url, str(e)))
            print(f"[{i:>3}/{len(urls)}] FAIL {label}  -> keeping live URL ({e})")
        time.sleep(0.15)  # be polite to the CDN

    # Rewrite the cover values. We replace the whole `cover:...` token so the
    # resulting file no longer depends on the CDN constant for embedded covers.
    def repl_cdn(m):
        full = cdn + m.group(1)
        if full in resolved:
            return 'cover:"' + resolved[full] + '"'
        return m.group(0)  # leave unchanged (failed download)

    def repl_abs(m):
        full = m.group(1)
        if full in resolved:
            return 'cover:"' + resolved[full] + '"'
        return m.group(0)

    new_text = COVER_CDN_RE.sub(repl_cdn, text)
    new_text = COVER_ABS_RE.sub(repl_abs, new_text)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(new_text)

    size_mb = os.path.getsize(OUT) / (1024 * 1024)
    print(f"\nWrote {OUT} ({size_mb:.1f} MB).")
    print(f"Embedded {len(resolved)} covers; {len(failures)} kept live.")
    if failures:
        print("\nThese covers could not be downloaded (still load online):")
        for url, err in failures:
            print(f"  - {url}\n      {err}")
    print("\nTo use it: back up data.js, then rename data-offline.js to data.js")
    print("(or point index.html's <script src> at data-offline.js).")


if __name__ == "__main__":
    main()
