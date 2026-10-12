#!/usr/bin/env python3
"""Take screenshots of a game in a headless browser: TV size for review and
store listings, and a phone size for the preview. Also reports page errors.
Needs: pip install playwright && python -m playwright install chromium
(Some environments already have both.)

Usage: python screenshot.py <path-to-index-or-single.html> <out-dir> [--keys "Enter,ArrowRight"]
"""
import asyncio, os, sys

async def run(page_path, out, keys):
    from playwright.async_api import async_playwright
    url = "file://" + os.path.abspath(page_path)
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, vp, extra in (("tv", {"width": 1920, "height": 1080}, {}),
                                ("store-1280x720", {"width": 1280, "height": 720}, {}),
                                ("phone", {"width": 390, "height": 844}, {"device_scale_factor": 2, "is_mobile": True, "has_touch": True})):
            ctx = await b.new_context(viewport=vp, **extra)
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(url); await pg.wait_for_timeout(800)
            await pg.screenshot(path=os.path.join(out, name + "-start.png"))
            if keys and name == "tv":
                for k in keys:
                    await pg.keyboard.press(k); await pg.wait_for_timeout(250)
                await pg.wait_for_timeout(1500)
                await pg.screenshot(path=os.path.join(out, name + "-after-keys.png"))
            print(name, "errors:", errs or "none")
            await ctx.close()
        await b.close()

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    keys = []
    if "--keys" in sys.argv: keys = sys.argv[sys.argv.index("--keys") + 1].split(",")
    asyncio.run(run(sys.argv[1], sys.argv[2], keys))
