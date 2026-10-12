#!/usr/bin/env python3
"""Scaffold a new LG webOS TV game from the skill's template.

Usage:
  python new_game.py --title "Firefly Night" --out ./firefly-night \
      [--id com.yourname.fireflynight] [--vendor "Your Name"] [--bg "#0B1530"] [--accent "#FFD25E"]

Creates the game folder with appinfo.json, index.html, kit.js, game.js,
style.css, fonts, generated icons and splash, plus SETUP.md for the player.
"""
import argparse, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "assets", "template")
SETUP = os.path.join(HERE, "..", "assets", "SETUP.template.md")
RESERVED = ("com.palm", "com.webos", "com.lge", "com.lg.", "com.hp")


def slug(s):
    return re.sub(r"[^a-z0-9]", "", s.lower()) or "game"


def make_images(out, title, bg, accent):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Pillow not installed: skipping icons (pip install pillow)")
        return
    font_path = os.path.join(out, "fonts", "Baloo.ttf")

    def font(size):
        try:
            f = ImageFont.truetype(font_path, size)
            try:
                f.set_variation_by_name("ExtraBold")
            except Exception:
                pass
            return f
        except Exception:
            return ImageFont.load_default()

    def centred(d, box, text, f, fill):
        bb = d.textbbox((0, 0), text, font=f)
        x = box[0] + (box[2] - box[0] - (bb[2] - bb[0])) / 2 - bb[0]
        y = box[1] + (box[3] - box[1] - (bb[3] - bb[1])) / 2 - bb[1]
        d.text((x, y), text, font=f, fill=fill)

    letter = title.strip()[0].upper()
    for size, name in ((80, "icon.png"), (130, "largeIcon.png")):
        S = size * 4
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .2), fill=bg)
        m = int(S * .15)
        d.ellipse([m, m, S - m, S - m], fill=accent)
        centred(d, (0, 0, S, S), letter, font(int(S * .5)), bg)
        im.resize((size, size), Image.LANCZOS).save(os.path.join(out, name))
    im = Image.new("RGB", (1920, 1080), bg)
    d = ImageDraw.Draw(im)
    centred(d, (0, 0, 1920, 1080), title, font(170), accent)
    im.save(os.path.join(out, "splash.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--id")
    ap.add_argument("--vendor", default="Home Developer")
    ap.add_argument("--bg", default="#0B1530")
    ap.add_argument("--accent", default="#FFD25E")
    a = ap.parse_args()

    app_id = (a.id or "com.home." + slug(a.title)).lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9.+-]*", app_id):
        sys.exit("App ID may only use lowercase letters, digits, '.', '+' and '-': " + app_id)
    if app_id.startswith(RESERVED):
        sys.exit("App ID uses a prefix reserved by LG: " + app_id)
    if os.path.exists(a.out) and os.listdir(a.out):
        sys.exit("Output folder exists and is not empty: " + a.out)

    shutil.copytree(TEMPLATE, a.out, dirs_exist_ok=True)
    subs = {"{{TITLE}}": a.title, "{{APP_ID}}": app_id, "{{VENDOR}}": a.vendor, "{{BG}}": a.bg}
    for name in ("index.html", "appinfo.json"):
        p = os.path.join(a.out, name)
        s = open(p, encoding="utf-8").read()
        for k, v in subs.items():
            s = s.replace(k, v)
        open(p, "w", encoding="utf-8").write(s)

    folder = os.path.basename(os.path.abspath(a.out))
    setup = open(SETUP, encoding="utf-8").read()
    for k, v in {"{{TITLE}}": a.title, "{{APP_ID}}": app_id, "{{FOLDER}}": folder}.items():
        setup = setup.replace(k, v)
    open(os.path.join(a.out, "SETUP.md"), "w", encoding="utf-8").write(setup)

    make_images(a.out, a.title, a.bg, a.accent)
    shutil.copy(os.path.join(HERE, "..", "assets", "PUBLISHING.md"), os.path.join(a.out, "PUBLISHING.md"))
    print("Created", a.out, "with app id", app_id)


if __name__ == "__main__":
    main()
