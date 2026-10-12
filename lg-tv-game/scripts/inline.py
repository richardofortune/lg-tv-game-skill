#!/usr/bin/env python3
"""Build a single self-contained HTML file from a game folder, for a
phone or browser preview, or for hosting as one page. Inlines CSS, scripts,
fonts and images as data URIs.

Usage: python inline.py <game-folder> <out.html>
"""
import base64, mimetypes, os, re, sys

def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    if path.endswith(".ttf"): mime = "font/ttf"
    if path.endswith(".woff2"): mime = "font/woff2"
    return "data:%s;base64,%s" % (mime, base64.b64encode(open(path, "rb").read()).decode())

def main(folder, out):
    html = open(os.path.join(folder, "index.html"), encoding="utf-8").read()
    def local(ref): return not re.match(r"(https?:|data:|//)", ref)
    def css_urls(css, base):
        return re.sub(r"""url\(\s*["']?([^"')]+)["']?\s*\)""",
                      lambda m: 'url("%s")' % data_uri(os.path.join(base, m.group(1))) if local(m.group(1)) else m.group(0), css)
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">',
                  lambda m: "<style>\n%s\n</style>" % css_urls(open(os.path.join(folder, m.group(1)), encoding="utf-8").read(),
                                                         os.path.dirname(os.path.join(folder, m.group(1)))) if local(m.group(1)) else m.group(0), html)
    html = re.sub(r'<script src="([^"]+)"></script>',
                  lambda m: "<script>\n%s\n</script>" % open(os.path.join(folder, m.group(1)), encoding="utf-8").read().replace("</script>", "<\\/script>") if local(m.group(1)) else m.group(0), html)
    html = re.sub(r"<style>(.*?)</style>", lambda m: "<style>%s</style>" % css_urls(m.group(1), folder), html, flags=re.S)
    html = re.sub(r'(<img[^>]+src=")([^"]+)(")', lambda m: m.group(1) + (data_uri(os.path.join(folder, m.group(2))) if local(m.group(2)) else m.group(2)) + m.group(3), html)
    open(out, "w", encoding="utf-8").write(html)
    print("Wrote %s (%.0f KB)" % (out, os.path.getsize(out) / 1024))

if __name__ == "__main__":
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
