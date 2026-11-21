"""Render a 9:16 reel from an animated HTML page.

  python3 social/tools/render_reel.py <slug> [voice.mp3]

social/reels/<slug>/reel.html must be 1080×1920, carry the <!--FONTS--> marker, and define
window.renderAt(t) that draws the frame for time t (seconds) deterministically.
social/reels/<slug>/scenes.json lists the scenes: [{"name":"s1","start":0,"end":3.0}, …].
Each scene is encoded to its own file (30 fps, H.264, CRF 18, veryfast), then joined with -c copy.
Writes public/videos/curiosity/<slug>.mp4; with a voice file, muxes it in with -c:v copy."""
import asyncio, json, os, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fonts import inject, ROOT
W, H, FPS = 1080, 1920, 30

async def frames(page_url, times, outdir):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        pg = await b.new_page(viewport={"width": W, "height": H})
        await pg.goto(page_url); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        for i, t in enumerate(times):
            await pg.evaluate(f"renderAt({t})")
            await pg.screenshot(path=f"{outdir}/{i:04d}.jpg", type="jpeg", quality=92)
        await b.close()

def main(slug, voice=None):
    d = os.path.join(ROOT, "social", "reels", slug)
    scenes = json.load(open(os.path.join(d, "scenes.json")))
    work = tempfile.mkdtemp()
    page = os.path.join(work, "reel.html"); open(page, "w").write(inject(open(os.path.join(d, "reel.html")).read()))
    parts = []
    for s in scenes:
        n = round((s["end"] - s["start"]) * FPS); fd = os.path.join(work, s["name"]); os.makedirs(fd)
        asyncio.run(frames("file://" + page, [s["start"] + i / FPS for i in range(n)], fd))
        tmp = os.path.join(work, s["name"] + ".tmp.mp4"); final = os.path.join(work, s["name"] + ".mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{fd}/%04d.jpg",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], check=True)
        os.replace(tmp, final); parts.append(final)
    lst = os.path.join(work, "list.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    silent = os.path.join(work, "silent.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent], check=True)
    out_dir = os.path.join(ROOT, "public", "videos", "curiosity"); os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, f"{slug}.mp4")
    if voice:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", voice, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", out], check=True)
    else:
        shutil.copy(silent, out)
    shutil.rmtree(work)
    print(out)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
