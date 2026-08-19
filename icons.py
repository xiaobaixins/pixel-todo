"""生成像素图标: icon-192.png / icon-512.png / icon-maskable-512.png / apple-touch-icon.png
用法: python icons.py  （在项目根目录运行）
"""
import os
from PIL import Image, ImageDraw

BG    = (0xef, 0xe6, 0xd0)  # 米白底
RED   = (0xd6, 0x45, 0x41)  # 主题红
CREAM = (0xfd, 0xf9, 0xee)  # 勾的颜色

N = 8
PAT = ["#..", "##.", ".#."]  # 3x3 像素勾（左上→右下）

def check_cells(off, scale):
    cells = set()
    for r in range(3):
        for c in range(3):
            if PAT[r][c] == '#':
                for a in range(scale):
                    for b in range(scale):
                        cells.add((off[0] + r * scale + a, off[1] + c * scale + b))
    return cells

def gen(size, out, frame, off, scale):
    px = size // N
    img = Image.new('RGB', (size, size), BG)
    dr = ImageDraw.Draw(img)
    chk = check_cells(off, scale)
    for r in range(N):
        for c in range(N):
            inside = frame <= r < N - frame and frame <= c < N - frame
            color = (RED if (r, c) not in chk else CREAM) if inside else BG
            dr.rectangle([c * px, r * px, (c + 1) * px - 1, (r + 1) * px - 1], fill=color)
    img.save(out)
    print('saved', out, size)

os.makedirs('icons', exist_ok=True)
gen(192, 'icons/icon-192.png',          1, (2, 2), 1)
gen(512, 'icons/icon-512.png',          1, (2, 2), 1)
gen(512, 'icons/icon-maskable-512.png', 2, (3, 3), 1)
gen(180, 'icons/apple-touch-icon.png',  1, (2, 2), 1)
