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

def create_atlas(frame_paths, out_webp, out_json, cols, cell_w, cell_h):
    n = len(frame_paths)
    rows = (n + cols - 1) // cols
    sheet_w = cols * cell_w
    sheet_h = rows * cell_h

    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    meta_frames = {}

    for idx, path in enumerate(frame_paths):
        im = Image.open(path).resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        c = idx % cols
        r = idx // cols
        x = c * cell_w
        y = r * cell_h
        sheet.paste(im, (x, y))

        fname = f"frame_{idx:03d}"
        meta_frames[fname] = {
            "frame": {"x": x, "y": y, "w": cell_w, "h": cell_h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": cell_w, "h": cell_h},
            "sourceSize": {"w": cell_w, "h": cell_h}
        }

    sheet.save(out_webp, "WEBP", quality=85)

    metadata = {
        "frames": meta_frames,
        "meta": {
            "app": "TOC_Atlas_Packer",
            "version": "1.0",
            "image": os.path.basename(out_webp),
            "format": "RGBA8888",
            "size": {"w": sheet_w, "h": sheet_h},
            "scale": "1"
        }
    }
    with open(out_json, "w") as jf:
        json.dump(metadata, jf, indent=2)

# -------------------------------------------------------------
# 1. REPROCESS CASA MOLINO (SAWMILL) WITH NEW TRANSPARENT IDLE
# -------------------------------------------------------------
def reprocess_casa_molino():
    print("=== Reprocessing Casa con Molino with NEW Transparent Idle ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/casa_molino"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/casa_molino"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_molino_new"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")

    # Unified window covering wheel (X=364), chimney smoke (Y=0), and shadow (X=1603)
    # Box: 300, 0, 1650, 1000 (width 1350, height 1000) -> resized to 378 x 280
    CROP_BOX = (300, 0, 1650, 1000)
    OUT_W, OUT_H = 378, 280

    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} new idle frames...")
    idle_processed = []
    for i, fpath in enumerate(idle_files):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            # Clean ambient alpha < 18
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/frame_{i:03d}.png"
        cropped.save(out_f)
        idle_processed.append(out_f)

    # Process construction frames with the EXACT same unified window
    const_files = sorted([f for f in glob.glob(f"{src_dir}/*.png") if os.path.isfile(f)])
    step = 3
    selected_const = const_files[::step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} construction frames...")
    const_processed = []
    for i, fpath in enumerate(selected_const):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/const/frame_{i:03d}.png"
        cropped.save(out_f)
        const_processed.append(out_f)

    # Save new poster
    Image.open(idle_processed[0]).save(f"{out_dir}/casa_molino_poster.webp", "WEBP", quality=90)

    # Encode animated WebP
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "62", f])
    cmd_idle.extend(["-o", f"{out_dir}/casa_molino_idle.webp"])
    run_cmd(cmd_idle)

    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/casa_molino_construccion.webp"])
    run_cmd(cmd_const)

    create_atlas(idle_processed, f"{out_dir}/casa_molino_idle_atlas.webp", f"{out_dir}/casa_molino_idle_atlas.json",
                 cols=6, cell_w=189, cell_h=140)
    create_atlas(const_processed, f"{out_dir}/casa_molino_const_atlas.webp", f"{out_dir}/casa_molino_const_atlas.json",
                 cols=8, cell_w=126, cell_h=93)
    print("Casa molino reprocessed successfully!")

# -------------------------------------------------------------
# 2. PROCESS PORTAL (PORTAL ARCANO)
# -------------------------------------------------------------
def process_portal():
    print("\n=== Processing Portal Arcano ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/portal"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/portal"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_portal"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")

    # Unified window (width 1440, height 1080) -> resized to 360 x 270 (exact 4:3)
    CROP_BOX = (260, 0, 1700, 1080)
    OUT_W, OUT_H = 360, 270

    # Process IDLE (40 frames)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} portal idle frames...")
    idle_processed = []
    for i, fpath in enumerate(idle_files):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/frame_{i:03d}.png"
        cropped.save(out_f)
        idle_processed.append(out_f)

    # Process CONSTRUCTION (139 frames, step-2 -> ~70 frames)
    const_files = sorted(glob.glob(f"{src_dir}/construccion/*.png"))
    step = 2
    selected_const = const_files[::step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} portal construction frames (step {step})...")
    const_processed = []
    for i, fpath in enumerate(selected_const):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/const/frame_{i:03d}.png"
        cropped.save(out_f)
        const_processed.append(out_f)

    # Save static poster
    Image.open(idle_processed[0]).save(f"{out_dir}/portal_poster.webp", "WEBP", quality=90)

    # Encode animated WebP
    # Idle: 40 frames @ 20 FPS (50ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "50", f])
    cmd_idle.extend(["-o", f"{out_dir}/portal_idle.webp"])
    run_cmd(cmd_idle)

    # Const: ~70 frames @ 22 FPS (45ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/portal_construccion.webp"])
    run_cmd(cmd_const)

    # Atlases
    create_atlas(idle_processed, f"{out_dir}/portal_idle_atlas.webp", f"{out_dir}/portal_idle_atlas.json",
                 cols=8, cell_w=180, cell_h=135)
    create_atlas(const_processed, f"{out_dir}/portal_const_atlas.webp", f"{out_dir}/portal_const_atlas.json",
                 cols=10, cell_w=120, cell_h=90)

    # Sound track
    sound_src = f"{src_dir}/construccion/Timeline 1.mp3"
    if os.path.exists(sound_src):
        sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
        ensure_dir(sound_dir)
        subprocess.run(["cp", sound_src, f"{sound_dir}/portal.mp3"])
        print(f"Audio saved to {sound_dir}/portal.mp3")

    print(f"Portal complete! Output at {out_dir}")

if __name__ == "__main__":
    reprocess_casa_molino()
    process_portal()
    print("\nALL BUILDINGS FINISHED SUCCESSFULLY!")
