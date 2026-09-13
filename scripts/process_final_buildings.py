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
# 1. PROCESS MINA DE ORO (DEEP GOLD MINE)
# -------------------------------------------------------------
def process_gold_mine():
    print("=== Processing Mina de Oro Profunda ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/mina de oro"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/gold_mine"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_gold_mine"
    sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")
    ensure_dir(sound_dir)

    CROP_BOX = (380, 40, 1740, 1040)
    OUT_W, OUT_H = 360, 265

    # 1. Process IDLE (32 frames)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} gold mine idle frames...")
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

    # 2. Process CONSTRUCTION (241 frames, step 3 -> 81 frames)
    const_files = sorted(glob.glob(f"{src_dir}/contruccion/*.png"))
    const_step = 3
    selected_const = const_files[::const_step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} gold mine construction frames (step {const_step})...")
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
    Image.open(idle_processed[0]).save(f"{out_dir}/gold_mine_poster.webp", "WEBP", quality=90)
    Image.open(idle_processed[0]).save(f"{out_dir}/Gold_Mine.webp", "WEBP", quality=90)

    # Encode animated WebP
    # Idle: 32 frames @ 20 FPS (50ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "50", f])
    cmd_idle.extend(["-o", f"{out_dir}/gold_mine_idle.webp"])
    run_cmd(cmd_idle)

    # Const: 81 frames @ 22 FPS (45ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/gold_mine_construccion.webp"])
    run_cmd(cmd_const)

    create_atlas(idle_processed, f"{out_dir}/gold_mine_idle_atlas.webp", f"{out_dir}/gold_mine_idle_atlas.json",
                 cols=8, cell_w=180, cell_h=132)
    create_atlas(const_processed, f"{out_dir}/gold_mine_const_atlas.webp", f"{out_dir}/gold_mine_const_atlas.json",
                 cols=10, cell_w=120, cell_h=88)

    # Audio copy
    sound_const = f"{src_dir}/contruccion/Timeline 1.mp3"
    if os.path.exists(sound_const):
        subprocess.run(["cp", sound_const, f"{sound_dir}/gold_mine_build.mp3"])
        print(f"Gold mine build audio saved to {sound_dir}/gold_mine_build.mp3")

    sound_idle = f"{src_dir}/idle/Timeline 1.mp3"
    if os.path.exists(sound_idle):
        subprocess.run(["cp", sound_idle, f"{sound_dir}/gold_mine_loop.mp3"])
        print(f"Gold mine ambient audio saved to {sound_dir}/gold_mine_loop.mp3")

    print(f"Mina de Oro complete! Output at {out_dir}")

# -------------------------------------------------------------
# 2. PROCESS ALMACEN (ROYAL WAREHOUSE & VAULT)
# -------------------------------------------------------------
def process_almacen():
    print("\n=== Processing Gran Almacén Real ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/almacen /construccion"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/almacen"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_almacen"
    sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")
    ensure_dir(sound_dir)

    CROP_BOX = (280, 0, 1680, 1080)
    OUT_W, OUT_H = 360, 278

    # 1. Process CONSTRUCTION (212 frames, step 3 -> 71 frames)
    const_files = sorted(glob.glob(f"{src_dir}/*.png"))
    const_step = 3
    selected_const = const_files[::const_step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} almacen construction frames (step {const_step})...")
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

    # 2. Process IDLE from tail finished frames (frames 198 to 211, looped)
    tail_files = const_files[198:]
    print(f"Processing {len(tail_files)} tail frames into idle loop for almacen...")
    tail_processed = []
    for i, fpath in enumerate(tail_files):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/tail_{i:03d}.png"
        cropped.save(out_f)
        tail_processed.append(out_f)

    # Ping-pong loop to create seamless 24-frame animation
    idle_processed = tail_processed + tail_processed[-2:0:-1]

    # Save static poster
    Image.open(tail_processed[-1]).save(f"{out_dir}/almacen_poster.webp", "WEBP", quality=90)
    Image.open(tail_processed[-1]).save(f"{out_dir}/almacen.webp", "WEBP", quality=90)

    # Encode animated WebP
    # Idle: ~24 frames @ 15 FPS (65ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "65", f])
    cmd_idle.extend(["-o", f"{out_dir}/almacen_idle.webp"])
    run_cmd(cmd_idle)

    # Const: 71 frames @ 22 FPS (45ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/almacen_construccion.webp"])
    run_cmd(cmd_const)

    create_atlas(idle_processed, f"{out_dir}/almacen_idle_atlas.webp", f"{out_dir}/almacen_idle_atlas.json",
                 cols=6, cell_w=180, cell_h=139)
    create_atlas(const_processed, f"{out_dir}/almacen_const_atlas.webp", f"{out_dir}/almacen_const_atlas.json",
                 cols=10, cell_w=120, cell_h=92)

    # Audio copy
    sound_const = f"{src_dir}/Timeline 1.mp3"
    if os.path.exists(sound_const):
        subprocess.run(["cp", sound_const, f"{sound_dir}/warehouse_build.mp3"])
        print(f"Warehouse build audio saved to {sound_dir}/warehouse_build.mp3")

    print(f"Almacen complete! Output at {out_dir}")

if __name__ == "__main__":
    process_gold_mine()
    process_almacen()
    print("\nALL 10 STRUCTURES COMPLETED SUCCESSFULLY!")
