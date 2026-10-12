#!/usr/bin/env python3
"""Check a webOS TV game folder for the problems that most often break
a game on the TV or fail LG review. Exit code 1 if any errors.

Usage: python check_game.py <game-folder>
"""
import json, os, re, sys

def main(folder):
    errors, warnings = [], []
    p = lambda *x: os.path.join(folder, *x)
    try:
        info = json.load(open(p("appinfo.json"), encoding="utf-8"))
    except Exception as e:
        print("ERROR appinfo.json missing or invalid:", e); sys.exit(1)

    for k in ("id", "version", "vendor", "type", "main", "title", "icon"):
        if not info.get(k):
            errors.append("appinfo.json is missing '%s'" % k)
    app_id = info.get("id", "")
    if app_id and not re.fullmatch(r"[a-z0-9][a-z0-9.+-]*", app_id):
        errors.append("app id must be lowercase letters, digits, '.', '+', '-'")
    if app_id.startswith(("com.palm", "com.webos", "com.lge", "com.lg.")):
        errors.append("app id uses a reserved LG prefix")
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(info.get("version", ""))):
        errors.append("version must be three numbers, e.g. 1.0.0")
    if "requiredACG" not in info:
        warnings.append("add \"requiredACG\": [] (needed for store submission on newer webOS)")
    if not info.get("disableBackHistoryAPI"):
        warnings.append("set \"disableBackHistoryAPI\": true so the game receives the Back key itself")

    try:
        from PIL import Image
        for key, size in (("icon", 80), ("largeIcon", 130)):
            if info.get(key):
                im = Image.open(p(info[key]))
                if im.size != (size, size):
                    errors.append("%s should be %dx%d, is %dx%d" % (info[key], size, size, *im.size))
    except ImportError:
        warnings.append("Pillow not installed, icon sizes not checked")
    except FileNotFoundError as e:
        errors.append("icon file missing: %s" % e.filename)

    main_file = p(info.get("main", "index.html"))
    if not os.path.exists(main_file):
        errors.append("main file %s not found" % info.get("main"))

    code, total = "", 0
    for root, _, files in os.walk(folder):
        for f in files:
            fp = os.path.join(root, f); total += os.path.getsize(fp)
            if f.endswith((".html", ".js", ".css")):
                code += open(fp, encoding="utf-8", errors="ignore").read()

    if "461" not in code and "TV.on(\"action\"" not in code:
        errors.append("no Back key handling found (keyCode 461 or kit.js actions)")
    ext = set(re.findall(r"""(?:src|href)\s*=\s*["'](https?://[^"']+)""", code))
    ext |= set(re.findall(r"""url\(\s*["']?(https?://[^"')]+)""", code))
    ext |= set(re.findall(r"""fetch\(\s*["'](https?://[^"']+)""", code))
    if ext:
        warnings.append("loads from the internet, which breaks offline play and slows review: " + ", ".join(sorted(ext))[:300])
    if re.search(r"\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(", code):
        errors.append("uses alert/confirm/prompt, which look broken on a TV; use an in-game dialog")
    if "localStorage" in code and "try" not in code:
        warnings.append("wrap localStorage in try/catch; it can throw on TVs")
    if re.search(r"font-size:\s*(1\d|2[0-3])px", code):
        warnings.append("found font sizes under 24px; text below about 26px is hard to read at 3 metres")
    if "shadowBlur" in code:
        warnings.append("canvas shadowBlur is slow on TV chips; pre-render glows to an offscreen canvas")
    if re.search(r"filter:\s*blur|backdrop-filter", code):
        warnings.append("CSS blur filters are slow on TVs; avoid them on large or animated elements")
    if total > 50 * 1024 * 1024:
        warnings.append("package is %.0f MB; keep it well under 50 MB" % (total / 1048576))

    for e in errors: print("ERROR  ", e)
    for w in warnings: print("WARN   ", w)
    print("%d error(s), %d warning(s). Package size %.1f MB" % (len(errors), len(warnings), total / 1048576))
    sys.exit(1 if errors else 0)

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
