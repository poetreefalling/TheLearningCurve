"""Turn one hero original into the site's image set.

Usage (from the project root):
    python3 scripts/images.py brand/originals/<slug>.png <slug> [--style documentary|risograph|screenshot]

Writes to public/images/articles/:
    <slug>.webp        2000px wide, the article hero (cropped to 3:2)
    <slug>-1200.webp   1200px wide, the hero on phones and tablets
    <slug>-card.webp   800px wide, for cards and lists (3:2)
    <slug>-og.jpg      1200x630, for social previews

Documentary images get the same light finish every time (a gentle warm grade, fine grain and
a faint vignette) so the set reads as one photographer's work. Other styles are only resized.
No watermarks: credits go in captions. Needs Pillow.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

OUT = Path('public/images/articles')


def crop_to(img, ratio):
    w, h = img.size
    if w / h > ratio:  # too wide
        nw = round(h * ratio)
        left = (w - nw) // 2
        return img.crop((left, 0, left + nw, h))
    nh = round(w / ratio)
    top = (h - nh) // 2
    return img.crop((0, top, w, top + nh))


def fit_width(img, width):
    if img.width <= width:
        return img.copy()
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def documentary_finish(img):
    # Warm grade: lift reds slightly, pull blues, soften saturation a touch
    r, g, b = img.split()
    r = r.point(lambda v: min(255, round(v * 1.03 + 2)))
    b = b.point(lambda v: round(v * 0.96))
    img = Image.merge('RGB', (r, g, b))
    img = ImageEnhance.Color(img).enhance(0.94)

    # Fine monochrome grain
    noise = Image.effect_noise(img.size, 18).filter(ImageFilter.GaussianBlur(0.35))
    noise = noise.point(lambda v: round(128 + (v - 128) * 0.55))
    img = ImageChops.overlay(img, Image.merge('RGB', (noise, noise, noise)))

    # Faint vignette (about 2%)
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.15, -h * 0.2, w * 1.15, h * 1.2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12))
    dark = ImageEnhance.Brightness(img).enhance(0.88)
    return Image.composite(img, dark, mask)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('slug')
    ap.add_argument('--style', default='documentary', choices=['documentary', 'risograph', 'screenshot'])
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(args.source).convert('RGB')
    hero = crop_to(src, 3 / 2)
    if args.style == 'documentary':
        hero = documentary_finish(hero)

    fit_width(hero, 2000).save(OUT / f'{args.slug}.webp', quality=80, method=6)
    fit_width(hero, 1200).save(OUT / f'{args.slug}-1200.webp', quality=78, method=6)
    fit_width(hero, 800).save(OUT / f'{args.slug}-card.webp', quality=78, method=6)
    crop_to(hero, 1200 / 630).resize((1200, 630), Image.LANCZOS).save(OUT / f'{args.slug}-og.jpg', quality=82, optimize=True, progressive=True)
    print(f'Wrote {OUT}/{args.slug}.webp, -1200.webp, -card.webp, -og.jpg')


if __name__ == '__main__':
    main()
