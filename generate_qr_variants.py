import os
from pathlib import Path

import segno
from PIL import Image, ImageDraw
import numpy as np

BASE_URL = "https://toolkit.pdataskforce.com/"
OUTPUT_DIR = Path("qr_codes")
MODULE_PX = 26
START_ANGLE_DEG = -135  # align with data viz orientation
BACKGROUND_COLOR = "#ffffff"
GAP_COLOR = "#e9f2ff"
CENTER_FILL = "#f2f7fd"
BORDER_COLOR = "#1e293b"
BORDER_WIDTH = 40
BORDER_RADIUS = 80
FADE_STRENGTH = 0.6  # 0=original colour, 1=white

THEMES = [
    {
        "id": "risk-ethics-and-assurance",
        "color": "#ec6b6f",
        "label": "risk",
    },
    {
        "id": "leadership-and-alignment",
        "color": "#90aefc",
        "label": "leadership",
    },
    {
        "id": "data-pooling-and-interoperability",
        "color": "#5abfd5",
        "label": "data",
    },
    {
        "id": "digital-and-tech-constraints",
        "color": "#a689f7",
        "label": "digital",
    },
    {
        "id": "skill-and-culture-gaps",
        "color": "#72c18b",
        "label": "skills",
    },
    {
        "id": "procurement-and-commercial-models",
        "color": "#f2b667",
        "label": "procurement",
    },
]

BASE_OUTER_COLORS = [theme["color"] for theme in THEMES]
BASE_INNER_COLORS = [theme["color"] for theme in THEMES]


def ensure_output_dir():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def fade_hex(color_hex: str, amount: float) -> str:
    """Return colour blended towards white by `amount`."""
    color_hex = color_hex.lstrip("#")
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)
    r = int(r + (255 - r) * amount)
    g = int(g + (255 - g) * amount)
    b = int(b + (255 - b) * amount)
    return f"#{r:02x}{g:02x}{b:02x}"


def build_palettes(highlight_id: str | None):
    if highlight_id is None:
        return BASE_OUTER_COLORS, BASE_INNER_COLORS
    outer_colors = []
    inner_colors = []
    for theme in THEMES:
        if theme["id"] == highlight_id:
            outer_colors.append(theme["color"])
            inner_colors.append(theme["color"])
        else:
            faded = fade_hex(theme["color"], FADE_STRENGTH)
            outer_colors.append(faded)
            inner_colors.append(faded)
    return outer_colors, inner_colors


def draw_ring(draw, colors, radius_outer, radius_inner, start_angle_deg=START_ANGLE_DEG):
    angle_step = 360 / len(colors)
    angle = start_angle_deg
    bbox_outer = [
        center - radius_outer,
        center - radius_outer,
        center + radius_outer,
        center + radius_outer,
    ]
    for color in colors:
        draw.pieslice(bbox_outer, angle, angle + angle_step, fill=color)
        angle += angle_step
    if radius_inner > 0:
        bbox_inner = [
            center - radius_inner,
            center - radius_inner,
            center + radius_inner,
            center + radius_inner,
        ]
        draw.ellipse(bbox_inner, fill=GAP_COLOR)


def generate_qr_matrix(url: str):
    qr = segno.make(url, error="h")
    matrix = np.array(qr.matrix, dtype=np.uint8)
    size = matrix.shape[0] * MODULE_PX
    qr_img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(qr_img)
    for y, row in enumerate(matrix):
        for x, val in enumerate(row):
            if val:
                x0, y0 = x * MODULE_PX, y * MODULE_PX
                draw.rectangle([x0, y0, x0 + MODULE_PX, y0 + MODULE_PX], fill=255)
    return qr_img, size


def render_ring_art(size: int, outer_colors, inner_colors):
    global center
    center = size / 2
    ring = Image.new("RGB", (size, size), BACKGROUND_COLOR)
    ring_draw = ImageDraw.Draw(ring)
    outer_r_outer = size * 0.48
    outer_r_inner = size * 0.33
    inner_r_outer = size * 0.27
    inner_r_inner = size * 0.17
    draw_ring(ring_draw, outer_colors, outer_r_outer, outer_r_inner, start_angle_deg=START_ANGLE_DEG)
    draw_ring(ring_draw, inner_colors, inner_r_outer, inner_r_inner, start_angle_deg=START_ANGLE_DEG)
    ring_draw.ellipse(
        [
            center - inner_r_inner,
            center - inner_r_inner,
            center + inner_r_inner,
            center + inner_r_inner,
        ],
        fill=CENTER_FILL,
    )
    return ring


def composite_qr(ring_art: Image.Image, qr_mask: Image.Image):
    size = ring_art.size[0]
    canvas_size = size + 200
    final = Image.new("RGB", (canvas_size, canvas_size), BACKGROUND_COLOR)
    offset = (final.size[0] // 2 - size // 2, final.size[1] // 2 - size // 2)
    final.paste(ring_art, offset)
    modules = Image.new("RGB", (size, size), "#050505")
    final.paste(modules, offset, qr_mask)
    outer_size = canvas_size + BORDER_WIDTH * 2
    framed = Image.new("RGB", (outer_size, outer_size), BORDER_COLOR)
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=BORDER_RADIUS, fill=255)
    framed.paste(final, (BORDER_WIDTH, BORDER_WIDTH), mask)
    return framed


def main():
    ensure_output_dir()
    variations = [{"slug": "all", "highlight": None, "url": BASE_URL}]
    for theme in THEMES:
        variations.append(
            {
                "slug": theme["id"],
                "highlight": theme["id"],
                "url": f"{BASE_URL}?theme={theme['id']}",
            }
        )

    for variant in variations:
        qr_mask, size = generate_qr_matrix(variant["url"])
        outer_colors, inner_colors = build_palettes(variant["highlight"])
        ring_art = render_ring_art(size, outer_colors, inner_colors)
        final_img = composite_qr(ring_art, qr_mask)
        output_path = OUTPUT_DIR / f"pdatf_qr_{variant['slug']}.png"
        final_img.save(output_path)
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
