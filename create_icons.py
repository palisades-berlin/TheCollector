#!/usr/bin/env python3
"""Generate camera-style PNG icons for screen-collector.
Visual style matches url-collector: same palette (#0d47a1/#1565c0),
rounded-rect body, darker top rail, detailed multi-ring lens.
"""
import struct, zlib, os

# ── PNG writer (no external dependencies) ────────────────────────────────────

def write_png(path, width, height, pixels):
    def chunk(name, data):
        body = name + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xffffffff)
    ihdr = chunk(b'IHDR', struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0]))
    raw  = b''.join(b'\x00' + b''.join(bytes(p) for p in row) for row in pixels)
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend)

# ── Drawing helpers ───────────────────────────────────────────────────────────

def draw_camera(S):
    px = [[(0, 0, 0, 0)] * S for _ in range(S)]

    def set_px(x, y, c):
        if 0 <= x < S and 0 <= y < S:
            px[y][x] = c

    def fill(x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(S, y1)):
            for x in range(max(0, x0), min(S, x1)):
                set_px(x, y, c)

    def circle(cx, cy, r, c):
        ir = int(r)
        for dy in range(-ir, ir + 1):
            for dx in range(-ir, ir + 1):
                if dx * dx + dy * dy <= r * r:
                    set_px(int(cx) + dx, int(cy) + dy, c)

    # ── Palette — same family as url-collector ────────────────────────────
    DARK   = ( 13,  71, 161, 255)   # #0d47a1  dark blue (rail / lens core)
    COVER  = ( 21, 101, 192, 255)   # #1565c0  blue body
    WHITE  = (255, 255, 255, 255)   # white details
    RING   = (173, 210, 240, 255)   # light blue inner ring (like ruled lines)
    HILITE = (255, 255, 255, 180)   # soft highlight dot

    # ── Layout (proportional to S) ────────────────────────────────────────
    m   = max(1, round(S * 0.06))
    rad = max(2, round(S * 0.12))

    bx0, by0 = m,     m
    bx1, by1 = S - m, S - m

    # ── 1. Camera body — COVER rounded rectangle ──────────────────────────
    fill(bx0 + rad, by0,       bx1 - rad, by1,       COVER)
    fill(bx0,       by0 + rad, bx1,       by1 - rad, COVER)
    for (ccx, ccy) in [(bx0+rad, by0+rad), (bx1-rad, by0+rad),
                       (bx0+rad, by1-rad), (bx1-rad, by1-rad)]:
        circle(ccx, ccy, rad, COVER)

    # ── 2. Top rail — darker strip, same rounded top corners ──────────────
    # Mirrors how url-collector draws its spine, just rotated to the top.
    rail_h = max(2, round(S * 0.20))
    fill(bx0 + rad, by0,       bx1 - rad, by0 + rail_h, DARK)   # top centre
    fill(bx0,       by0 + rad, bx1,       by0 + rail_h, DARK)   # full-width below radius
    circle(bx0 + rad, by0 + rad, rad, DARK)                      # top-left corner
    circle(bx1 - rad, by0 + rad, rad, DARK)                      # top-right corner
    fill(bx0 + rad,   by0,       bx1 - rad, by0 + rad,  DARK)   # solid top edge

    # ── 3. Lens — multi-ring: white → cover blue → light ring → dark core ─
    lens_cx = S // 2
    lens_cy = by0 + rail_h + round((by1 - by0 - rail_h) * 0.52)

    r_out  = max(3, round(S * 0.28))
    r_body = max(2, round(r_out * 0.76))
    r_ring = max(1, round(r_out * 0.56))
    r_core = max(1, round(r_out * 0.34))

    circle(lens_cx, lens_cy, r_out,  WHITE)
    circle(lens_cx, lens_cy, r_body, COVER)
    circle(lens_cx, lens_cy, r_ring, RING)
    circle(lens_cx, lens_cy, r_core, DARK)

    # Lens highlight dot (top-left quadrant)
    if S >= 32:
        hl_r  = max(1, round(r_out * 0.13))
        hl_cx = lens_cx - round(r_out * 0.28)
        hl_cy = lens_cy - round(r_out * 0.28)
        circle(hl_cx, hl_cy, hl_r, HILITE)

    # ── 4. Shutter button — small rounded rect, top-right of rail ─────────
    if S >= 32:
        sh_w = max(2, round(S * 0.11))
        sh_h = max(1, round(S * 0.06))
        sh_x = bx1 - round(S * 0.06) - sh_w
        sh_y = by0 + round(S * 0.05)
        sh_r = max(1, round(sh_h * 0.5))
        fill(sh_x + sh_r, sh_y,        sh_x + sh_w - sh_r, sh_y + sh_h, WHITE)
        fill(sh_x,        sh_y + sh_r, sh_x + sh_w,        sh_y + sh_h, WHITE)
        circle(sh_x + sh_r,        sh_y + sh_r, sh_r, WHITE)
        circle(sh_x + sh_w - sh_r, sh_y + sh_r, sh_r, WHITE)

    # ── 5. Viewfinder window — small rounded rect, top-left of rail ───────
    if S >= 48:
        vf_w = max(3, round(S * 0.14))
        vf_h = max(2, round(S * 0.08))
        vf_x = bx0 + round(S * 0.08)
        vf_y = by0 + round(S * 0.06)
        vf_r = max(1, round(min(vf_w, vf_h) * 0.3))
        fill(vf_x + vf_r, vf_y,        vf_x + vf_w - vf_r, vf_y + vf_h, RING)
        fill(vf_x,        vf_y + vf_r, vf_x + vf_w,        vf_y + vf_h, RING)
        circle(vf_x + vf_r,        vf_y + vf_r, vf_r, RING)
        circle(vf_x + vf_w - vf_r, vf_y + vf_r, vf_r, RING)

    return px

# ── Main ─────────────────────────────────────────────────────────────────────

sizes    = [16, 32, 48, 128]
base_dir = os.path.dirname(os.path.abspath(__file__))
icon_dir = os.path.join(base_dir, 'assets', 'icons')
os.makedirs(icon_dir, exist_ok=True)

for s in sizes:
    pixels = draw_camera(s)
    out    = os.path.join(icon_dir, f'icon{s}.png')
    write_png(out, s, s, pixels)
    print(f'  Created assets/icons/icon{s}.png  ({s}x{s})')

print('Done!')
