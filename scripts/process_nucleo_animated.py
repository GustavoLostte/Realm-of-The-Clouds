#!/usr/bin/env python3
"""
Process animated Núcleo Arcano frames into:
1. Standalone transparent animated WebP: public/assets/buildings/almacen/almacen_idle.webp
2. Texture atlas + JSON for Pixi AnimatedSprite:
   - public/assets/buildings/almacen/almacen_idle_atlas.webp
   - public/assets/buildings/almacen/almacen_idle.json
3. High-res static posters:
   - public/assets/buildings/almacen/almacen_poster.webp
   - public/assets/buildings/almacen/nucleo_arcano.webp
   - public/assets/structures/cutout/08_nucleo_arcano.webp
"""

import glob
import json
import os
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FRAMES_DIR = os.path.join(BASE_DIR, 'public/assets/buildings/nucleo')
OUT_DIR = os.path.join(BASE_DIR, 'public/assets/buildings/almacen')
CUTOUT_DIR = os.path.join(BASE_DIR, 'public/assets/structures/cutout')

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CUTOUT_DIR, exist_ok=True)

# 1. Gather raw frames
files = sorted(glob.glob(os.path.join(SRC_FRAMES_DIR, '*.png')))
print(f"Total raw frames found: {len(files)}")
if len(files) < 70:
    raise RuntimeError(f"Expected at least 70 frames, found {len(files)}")

# 77 frames matches the natural periodic cycle of the pulsing core
CYCLE_LEN = 77
cycle_files = files[:CYCLE_LEN]
print(f"Using {len(cycle_files)} frames for seamless idle loop.")

# 1:1 Square Crop (1080 x 1080 centered at x=960)
CROP_BOX = (420, 0, 1500, 1080)
FRAME_SIZE = (224, 224)

# Build edge fade mask (30px feather on borders to soften any stray particle)
feather = 30
mask_y = np.ones(1080, dtype=float)
mask_y[:feather] = np.linspace(0, 1, feather)
mask_y[-feather:] = np.linspace(1, 0, feather)

mask_x = np.ones(1080, dtype=float)
mask_x[:feather] = np.linspace(0, 1, feather)
mask_x[-feather:] = np.linspace(1, 0, feather)

edge_mask = np.outer(mask_y, mask_x)

raw_arrays = []
for f in cycle_files:
    img = Image.open(f).crop(CROP_BOX)
    arr = np.array(img)
    # Apply soft edge feathering to alpha
    arr[:, :, 3] = (arr[:, :, 3].astype(float) * edge_mask).astype(np.uint8)
    # Clean up very faint background noise
    arr[arr[:, :, 3] <= 8] = 0
    raw_arrays.append(arr)

# 4-frame seamless loop crossfade (frames 73..76 blend smoothly into frame 0)
blend_len = 4
for b in range(blend_len):
    idx = len(raw_arrays) - blend_len + b
    factor = (b + 1) / (blend_len + 1)
    raw_arrays[idx] = (
        raw_arrays[idx].astype(float) * (1 - factor) + raw_arrays[0].astype(float) * factor
    ).astype(np.uint8)

# Convert to PIL frames resized for atlas
pil_frames_atlas = [
    Image.fromarray(a).resize(FRAME_SIZE, Image.Resampling.LANCZOS)
    for a in raw_arrays
]

# 2. Save standalone animated WebP (almacen_idle.webp)
anim_webp_path = os.path.join(OUT_DIR, 'almacen_idle.webp')
print(f"Saving animated WebP to {anim_webp_path}...")
pil_frames_atlas[0].save(
    anim_webp_path,
    format='WEBP',
    save_all=True,
    append_images=pil_frames_atlas[1:],
    duration=40, # 25 fps
    loop=0,
    quality=88,
    method=6
)
print(f"Animated WebP size: {os.path.getsize(anim_webp_path):,} bytes")

# 3. Build Texture Atlas (2048 x 2048) - 9 cols x 9 rows = 81 slots >= 77 frames
ATLAS_W = 2048
ATLAS_H = 2048
COLS = 9  # 9 * (224 + 2) = 2034 <= 2048
PAD = 2

atlas_img = Image.new('RGBA', (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
frames_dict = {}
anim_frame_names = []

for i, p_frame in enumerate(pil_frames_atlas):
    col = i % COLS
    row = i // COLS
    x = PAD + col * (FRAME_SIZE[0] + PAD)
    y = PAD + row * (FRAME_SIZE[1] + PAD)
    
    assert x + FRAME_SIZE[0] <= ATLAS_W, f"Frame {i} X overflow: {x + FRAME_SIZE[0]} > {ATLAS_W}"
    assert y + FRAME_SIZE[1] <= ATLAS_H, f"Frame {i} Y overflow: {y + FRAME_SIZE[1]} > {ATLAS_H}"
    
    atlas_img.paste(p_frame, (x, y))
    
    frame_name = f"almacen_idle_{i:03d}"
    anim_frame_names.append(frame_name)
    frames_dict[frame_name] = {
        "frame": { "x": x, "y": y, "w": FRAME_SIZE[0], "h": FRAME_SIZE[1] },
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": { "x": 0, "y": 0, "w": FRAME_SIZE[0], "h": FRAME_SIZE[1] },
        "sourceSize": { "w": FRAME_SIZE[0], "h": FRAME_SIZE[1] }
    }

atlas_webp_path = os.path.join(OUT_DIR, 'almacen_idle_atlas.webp')
print(f"Saving spritesheet atlas to {atlas_webp_path}...")
atlas_img.save(atlas_webp_path, format='WEBP', quality=88, method=6)
print(f"Atlas size: {os.path.getsize(atlas_webp_path):,} bytes")

# Save TexturePacker JSON (almacen_idle.json)
sheet_json = {
    "frames": frames_dict,
    "animations": {
        "play": anim_frame_names
    },
    "meta": {
        "app": "Realm_Of_Kingdoms_Atlas_Packer",
        "version": "1.0",
        "image": "almacen_idle_atlas.webp",
        "format": "RGBA8888",
        "size": { "w": ATLAS_W, "h": ATLAS_H },
        "scale": "1"
    }
}
json_path = os.path.join(OUT_DIR, 'almacen_idle.json')
with open(json_path, 'w') as f:
    json.dump(sheet_json, f, indent=2)
print(f"Spritesheet JSON saved to {json_path}")

# 4. Save high-res static poster from Frame 0 (1024 x 1024)
high_res_frame_0 = Image.fromarray(raw_arrays[0]).resize((1024, 1024), Image.Resampling.LANCZOS)
poster_path = os.path.join(OUT_DIR, 'almacen_poster.webp')
high_res_frame_0.save(poster_path, format='WEBP', quality=92, method=6)
print(f"High-res poster saved to {poster_path}: {os.path.getsize(poster_path):,} bytes")

# Also copy to nucleo_arcano.webp and structures/cutout/08_nucleo_arcano.webp
nucleo_path = os.path.join(OUT_DIR, 'nucleo_arcano.webp')
high_res_frame_0.save(nucleo_path, format='WEBP', quality=92, method=6)

cutout_path = os.path.join(CUTOUT_DIR, '08_nucleo_arcano.webp')
high_res_frame_0.save(cutout_path, format='WEBP', quality=92, method=6)
print(f"Updated {nucleo_path} and {cutout_path}")

print("\n=== All Núcleo Arcano assets successfully created! ===")
