"""Render a Curiosity Corner post's slides to Instagram-ready JPEGs.

  python3 social/tools/render_slides.py <slug>

Reads social/designs/<slug>/01.html, 02.html… (1080×1350, brand template, <!--FONTS--> marker)
and writes public/images/curiosity/<slug>/01.jpg, 02.jpg… (JPEG q92, well under Instagram's 8 MB).
Needs: npm ci, pip install playwright, and Chrome/Chromium (CHROME env var or /usr/bin/google-chrome)."""
import asyncio, glob, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fonts import inject, ROOT

async def main(slug: str):
    src = os.path.join(ROOT, "social", "designs", slug)
    out = os.path.join(ROOT, "public", "images", "curiosity", slug)
    os.makedirs(out, exist_ok=True)
    pages = sorted(glob.glob(os.path.join(src, "[0-9][0-9].html")))
    if not pages: sys.exit(f"no slides in {src}")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        pg = await b.new_page(viewport={"width": 1080, "height": 1350})
        for f in pages:
            tmp = f[:-5] + ".render.html"
            open(tmp, "w").write(inject(open(f).read()))
            await pg.goto("file://" + tmp); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
            name = os.path.basename(f)[:2] + ".jpg"
            await pg.screenshot(path=os.path.join(out, name), type="jpeg", quality=92, clip={"x": 0, "y": 0, "width": 1080, "height": 1350})
            os.remove(tmp)
        await b.close()
    print(f"{len(pages)} slides -> {out}")

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
