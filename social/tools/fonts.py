"""Local brand fonts (from node_modules/@fontsource-variable) as one CSS string, for headless rendering.
Run `npm ci` first. Templates mark where the CSS goes with <!--FONTS-->."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NM = os.path.join(ROOT, "node_modules", "@fontsource-variable")
FILES = {
    "fraunces/full.css": ("Fraunces Variable", "Fraunces"),
    "newsreader/standard.css": ("Newsreader Variable", "Newsreader"),
    "newsreader/standard-italic.css": ("Newsreader Variable", "Newsreader"),
    "inter-tight/wght.css": ("Inter Tight Variable", "Inter Tight"),
    "inter/standard.css": ("Inter Variable", "Inter"),
}
def font_css() -> str:
    out = ""
    for f, (a, b) in FILES.items():
        path = os.path.join(NM, f)
        d = os.path.dirname(path)
        out += open(path).read().replace(a, b).replace("url(./files", f"url(file://{d}/files")
    return out
def inject(html: str) -> str:
    if "<style><!--FONTS-->" in html:
        return html.replace("<!--FONTS-->", font_css(), 1)
    return html.replace("<!--FONTS-->", f"<style>{font_css()}</style>", 1)
