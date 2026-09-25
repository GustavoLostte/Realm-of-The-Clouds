#!/usr/bin/env python3
import os
import glob
import json
import subprocess
from PIL import Image
import numpy as np

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def run_cmd(cmd):
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error running command: {' '.join(cmd)}\n{res.stderr}")
        raise RuntimeError(res.stderr)

def process_dirigible():
    print("=== Processing Dirigible Celestial ===")
    src_dir = "public/assets/buildings/dirigible"
    out_dir = "public/assets/buildings/dirigible"
    temp_dir = "scripts/temp_dirigible"
    ensure_dir(temp_dir)

    # 1. Inspect all frames
    all_files = sorted(glob.glob(f"{src_dir}/Timeline 2_*.png"))
    print(f"Found {len(all_files)} raw PNG frames")
    if len(all_files) == 0:
        raise RuntimeError("No dirigible PNG frames found!")

    # Global bounding box across all frames with alpha cleaning
    # Content is roughly x=[430, 1440], y=[50, 1020]
    CROP_BOX = (420, 45, 1450, 1035) # w=1030, h=990
    CELL_W = 240
    CELL_H = 230

    # We take every 2nd frame: 86 frames -> 43 frames @ ~12 FPS
    # This provides fluid motion while fitting perfectly in a 1680x1610 texture atlas
    step = 2
    selected_frames = all_files[::step]
    if all_files[-1] not in selected_frames:
        selected_frames.append(all_files[-1])
    print(f"Selected {len(selected_frames)} frames for atlas...")

    processed_frames = []
    for idx, fpath in enumerate(selected_frames):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            # Clean ambient alpha bleed < 18
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((CELL_W, CELL_H), Image.Resampling.LANCZOS)
        
        out_f = f"{temp_dir}/frame_{idx:03d}.png"
        cropped.save(out_f)
        processed_frames.append(out_f)

    # 2. High-res Static Poster (360x345) for crisp display & loading preview
    poster_im = Image.open(selected_frames[0])
    p_arr = np.array(poster_im)
    if p_arr.shape[2] == 4:
        p_arr[:, :, 3] = np.where(p_arr[:, :, 3] < 18, 0, p_arr[:, :, 3])
    poster_clean = Image.fromarray(p_arr).crop(CROP_BOX).resize((360, 345), Image.Resampling.LANCZOS)
    poster_clean.save(f"{out_dir}/dirigible_poster.webp", "WEBP", quality=92)
    print("Saved dirigible_poster.webp")

    # 3. Create Spritesheet Atlas WebP + JSON for Pixi.js
    cols = 7
    n = len(processed_frames)
    rows = (n + cols - 1) // cols
    sheet_w = cols * CELL_W
    sheet_h = rows * CELL_H

    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    meta_frames = {}
    anim_frame_names = []

    for idx, fpath in enumerate(processed_frames):
        im = Image.open(fpath)
        c = idx % cols
        r = idx // cols
        x = c * CELL_W
        y = r * CELL_H
        sheet.paste(im, (x, y))

        fname = f"dirigible_idle_{idx:02d}.png"
        anim_frame_names.append(fname)
        meta_frames[fname] = {
            "frame": {"x": x, "y": y, "w": CELL_W, "h": CELL_H},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": CELL_W, "h": CELL_H},
            "sourceSize": {"w": CELL_W, "h": CELL_H}
        }

    atlas_webp_path = f"{out_dir}/dirigible_idle_atlas.webp"
    sheet.save(atlas_webp_path, "WEBP", quality=88)
    print(f"Saved {atlas_webp_path} ({sheet_w}x{sheet_h})")

    metadata = {
        "frames": meta_frames,
        "animations": {
            "play": anim_frame_names,
            "idle": anim_frame_names
        },
        "meta": {
            "app": "TOC_Atlas_Packer",
            "version": "1.0",
            "image": "dirigible_idle_atlas.webp",
            "format": "RGBA8888",
            "size": {"w": sheet_w, "h": sheet_h},
            "scale": "1"
        }
    }
    atlas_json_path = f"{out_dir}/dirigible_idle.json"
    with open(atlas_json_path, "w") as jf:
        json.dump(metadata, jf, indent=2)
    print(f"Saved {atlas_json_path}")

    # Also save a standalone animated WebP loop for fallback / CSS
    cmd_anim = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    # 43 frames in 3.65s ≈ 85ms per frame
    for f in processed_frames:
        cmd_anim.extend(["-d", "85", f])
    cmd_anim.extend(["-o", f"{out_dir}/dirigible_idle.webp"])
    run_cmd(cmd_anim)
    print("Saved dirigible_idle.webp")

    # Cleanup temp
    for f in processed_frames:
        try:
            os.remove(f)
        except OSError:
            pass
    try:
        os.rmdir(temp_dir)
    except OSError:
        pass

    print("=== Dirigible Celestial Processed Successfully ===")

if __name__ == "__main__":
    process_dirigible()
