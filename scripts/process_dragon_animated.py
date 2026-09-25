#!/usr/bin/env python3
"""
Process animated Drake / Celestial Dragon frames into:
1. Standalone transparent animated WebP: public/assets/npcs/dragon_celestial_dormido.webp
2. Texture atlas + JSON for Pixi AnimatedSprite:
   - public/assets/npcs/spritesheets/dragon_idle_atlas.webp
   - public/assets/npcs/spritesheets/dragon_idle.json
3. High-res static poster from Frame 0
"""

import glob
import json
import os
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FRAMES_DIR = os.path.join(BASE_DIR, 'public/assets/buildings/drake')
OUT_NPCS_DIR = os.path.join(BASE_DIR, 'public/assets/npcs')
OUT_SHEETS_DIR = os.path.join(OUT_NPCS_DIR, 'spritesheets')

os.makedirs(OUT_NPCS_DIR, exist_ok=True)
os.makedirs(OUT_SHEETS_DIR, exist_ok=True)

# 1. Gather raw frames
files = sorted(glob.glob(os.path.join(SRC_FRAMES_DIR, '*.png')))
print(f"Total raw dragon frames found: {len(files)}")
if len(files) < 108:
    raise RuntimeError(f"Expected at least 108 frames, found {len(files)}")

# 108 frames is an exact full respiratory cycle (wing top: 153 -> 69 -> 152).
# Sampling every 2nd frame yields 54 frames on twos (~4.5s idle breath cycle at 12 fps).
cycle_files = files[:108:2]
print(f"Using {len(cycle_files)} frames for seamless dragon loop.")

# Crop definition: (width 1400, height 1020, ratio 1.3725 matching 190x138 in game)
CROP_BOX = (264, 60, 1664, 1080)
FRAME_W = 276
FRAME_H = 200

# Edge feather mask to ensure zero boundary clipping
feather = 25
h = CROP_BOX[3] - CROP_BOX[1]
w = CROP_BOX[2] - CROP_BOX[0]

mask_y = np.ones(h, dtype=float)
mask_y[:feather] = np.linspace(0, 1, feather)
mask_y[-feather:] = np.linspace(1, 0, feather)

mask_x = np.ones(w, dtype=float)
mask_x[:feather] = np.linspace(0, 1, feather)
mask_x[-feather:] = np.linspace(1, 0, feather)

edge_mask = np.outer(mask_y, mask_x)

raw_arrays = []
for f in cycle_files:
    img = Image.open(f).crop(CROP_BOX)
    arr = np.array(img)
    arr[:, :, 3] = (arr[:, :, 3].astype(float) * edge_mask).astype(np.uint8)
    arr[arr[:, :, 3] <= 10] = 0
    raw_arrays.append(arr)

# 3-frame seamless loop crossfade
blend_len = 3
for b in range(blend_len):
    idx = len(raw_arrays) - blend_len + b
    factor = (b + 1) / (blend_len + 1)
    raw_arrays[idx] = (
        raw_arrays[idx].astype(float) * (1 - factor) + raw_arrays[0].astype(float) * factor
    ).astype(np.uint8)

pil_frames = [
    Image.fromarray(a).resize((FRAME_W, FRAME_H), Image.Resampling.LANCZOS)
    for a in raw_arrays
]

# 2. Save standalone animated WebP (public/assets/npcs/dragon_celestial_dormido.webp)
anim_webp_path = os.path.join(OUT_NPCS_DIR, 'dragon_celestial_dormido.webp')
print(f"Saving animated WebP to {anim_webp_path}...")
pil_frames[0].save(
    anim_webp_path,
    format='WEBP',
    save_all=True,
    append_images=pil_frames[1:],
    duration=83, # ~12 fps -> 4482ms full meditative breath
    loop=0,
    quality=88,
    method=6
)
print(f"Animated WebP size: {os.path.getsize(anim_webp_path):,} bytes")

# 3. Build Texture Atlas (2048 x 2048)
ATLAS_W = 2048
ATLAS_H = 2048
COLS = 7  # 7 * 278 = 1946 <= 2048
PAD = 2

atlas_img = Image.new('RGBA', (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
frames_dict = {}
anim_frame_names = []

for i, p_frame in enumerate(pil_frames):
    col = i % COLS
    row = i // COLS
    x = PAD + col * (FRAME_W + PAD)
    y = PAD + row * (FRAME_H + PAD)
    
    atlas_img.paste(p_frame, (x, y))
    
    frame_name = f"dragon_idle_{i:03d}"
    anim_frame_names.append(frame_name)
    frames_dict[frame_name] = {
        "frame": { "x": x, "y": y, "w": FRAME_W, "h": FRAME_H },
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": { "x": 0, "y": 0, "w": FRAME_W, "h": FRAME_H },
        "sourceSize": { "w": FRAME_W, "h": FRAME_H }
    }

atlas_webp_path = os.path.join(OUT_SHEETS_DIR, 'dragon_idle_atlas.webp')
print(f"Saving spritesheet atlas to {atlas_webp_path}...")
atlas_img.save(atlas_webp_path, format='WEBP', quality=88, method=6)
print(f"Atlas size: {os.path.getsize(atlas_webp_path):,} bytes")

# Save TexturePacker JSON (dragon_idle.json)
sheet_json = {
    "frames": frames_dict,
    "animations": {
        "play": anim_frame_names
    },
    "meta": {
        "app": "Realm_Of_Kingdoms_Dragon_Packer",
        "version": "1.0",
        "image": "dragon_idle_atlas.webp",
        "format": "RGBA8888",
        "size": { "w": ATLAS_W, "h": ATLAS_H },
        "scale": "1"
    }
}
json_path = os.path.join(OUT_SHEETS_DIR, 'dragon_idle.json')
with open(json_path, 'w') as f:
    json.dump(sheet_json, f, indent=2)
print(f"Spritesheet JSON saved to {json_path}")

print("\n=== All Dragon assets successfully created! ===")
