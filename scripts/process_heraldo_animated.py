#!/usr/bin/env python3
"""
Process animated Heraldo frames into:
1. Standalone transparent animated WebP: public/assets/npcs/heraldo_idle.webp
2. Texture atlas + JSON for Pixi AnimatedSprite:
   - public/assets/npcs/spritesheets/heraldo_idle_atlas.webp
   - public/assets/npcs/spritesheets/heraldo_idle.json
3. High-res static fallback: public/assets/npcs/heraldo_celestial.webp
"""

import glob
import json
import os
import shutil
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FRAMES_DIR = os.path.join(BASE_DIR, 'public/assets/characters/heraldo')
OUT_NPCS_DIR = os.path.join(BASE_DIR, 'public/assets/npcs')
OUT_SHEETS_DIR = os.path.join(OUT_NPCS_DIR, 'spritesheets')

os.makedirs(OUT_NPCS_DIR, exist_ok=True)
os.makedirs(OUT_SHEETS_DIR, exist_ok=True)

# 1. Gather frames
files = sorted(glob.glob(os.path.join(SRC_FRAMES_DIR, '*.png')))
print(f"Total raw frames found: {len(files)}")
if len(files) < 40:
    raise RuntimeError(f"Expected at least 40 frames, found {len(files)}")

# 52 frames completes an exact full respiratory cycle (0 to 51)
cycle_files = files[:52]
print(f"Using {len(cycle_files)} frames for seamless idle loop.")

# Crop definition:
# Original: 1920 x 1080
# Union bbox across cycle: x=[151, 1583], y=[49, 1051]
# Feet center at x = 802.
# Centered horizontal crop: [802 - 790, 802 + 790] = [12, 1592] -> width = 1580
# Vertical crop: [36, 1068] -> height = 1032
# Feet at y = 1048 -> (1048 - 36) / 1032 = 0.9806 anchor
CROP_BOX = (12, 36, 1592, 1068)
FRAME_W = 316
FRAME_H = 206

raw_arrays = []
for f in cycle_files:
    img = Image.open(f).crop(CROP_BOX)
    arr = np.array(img)
    # Zero out tiny compression artifacts (<= 15 alpha)
    arr[arr[:, :, 3] <= 15] = 0
    raw_arrays.append(arr)

# 4-frame seamless loop crossfade (frames 48..51 blend smoothly into frame 0)
blend_len = 4
for b in range(blend_len):
    idx = len(raw_arrays) - blend_len + b
    factor = (b + 1) / (blend_len + 1)
    raw_arrays[idx] = (raw_arrays[idx].astype(float) * (1 - factor) + raw_arrays[0].astype(float) * factor).astype(np.uint8)

# Convert to PIL frames resized
pil_frames = [Image.fromarray(a).resize((FRAME_W, FRAME_H), Image.Resampling.LANCZOS) for a in raw_arrays]

# 2. Save standalone animated WebP (public/assets/npcs/heraldo_idle.webp)
anim_webp_path = os.path.join(OUT_NPCS_DIR, 'heraldo_idle.webp')
print(f"Saving animated WebP to {anim_webp_path}...")
pil_frames[0].save(
    anim_webp_path,
    format='WEBP',
    save_all=True,
    append_images=pil_frames[1:],
    duration=50, # 20 fps -> 2600ms full breath
    loop=0,
    quality=88,
    method=6
)
print(f"Animated WebP size: {os.path.getsize(anim_webp_path):,} bytes")

# 3. Build Texture Atlas (2048 x 2048)
ATLAS_W = 2048
ATLAS_H = 2048
COLS = 6  # 6 * 318 = 1908 <= 2048
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
    
    frame_name = f"heraldo_idle_{i:03d}"
    anim_frame_names.append(frame_name)
    frames_dict[frame_name] = {
        "frame": { "x": x, "y": y, "w": FRAME_W, "h": FRAME_H },
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": { "x": 0, "y": 0, "w": FRAME_W, "h": FRAME_H },
        "sourceSize": { "w": FRAME_W, "h": FRAME_H }
    }

atlas_webp_path = os.path.join(OUT_SHEETS_DIR, 'heraldo_idle_atlas.webp')
print(f"Saving spritesheet atlas to {atlas_webp_path}...")
atlas_img.save(atlas_webp_path, format='WEBP', quality=88, method=6)
print(f"Atlas size: {os.path.getsize(atlas_webp_path):,} bytes")

# Save TexturePacker JSON
sheet_json = {
    "frames": frames_dict,
    "animations": {
        "play": anim_frame_names
    },
    "meta": {
        "image": "heraldo_idle_atlas.webp",
        "format": "RGBA8888",
        "size": { "w": ATLAS_W, "h": ATLAS_H },
        "scale": "1"
    }
}
json_path = os.path.join(OUT_SHEETS_DIR, 'heraldo_idle.json')
with open(json_path, 'w') as f:
    json.dump(sheet_json, f, indent=2)
print(f"Spritesheet JSON saved to {json_path}")

# 4. Save high-res static frame 0 for static replacements
# Crop frame 0 at full resolution
full_frame_0 = Image.fromarray(raw_arrays[0])
# Resize to 512x334 or 1024x668
static_img = full_frame_0.resize((790, 516), Image.Resampling.LANCZOS)
static_path = os.path.join(OUT_NPCS_DIR, 'heraldo_celestial.webp')
static_img.save(static_path, format='WEBP', quality=92, method=6)
print(f"High-res static replacement saved to {static_path}: {os.path.getsize(static_path):,} bytes")

# Also copy to structure/character cutouts if they exist
for extra_dir in ['public/assets/characters/fullbody_cutout', 'public/assets/structures/cutout']:
    p = os.path.join(BASE_DIR, extra_dir, 'heraldo_celestial.webp')
    if os.path.exists(os.path.dirname(p)):
        static_img.save(p, format='WEBP', quality=92, method=6)
        print(f"Updated {p}")

print("\n=== All Heraldo assets successfully created! ===")
