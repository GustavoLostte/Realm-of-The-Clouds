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
# 1. PROCESS CASTILLO (ROYAL CASTLE / TOWN HALL)
# -------------------------------------------------------------
def process_castillo():
    print("=== Processing Castillo Imperial ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/castillo"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/castillo"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_castillo"
    sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")
    ensure_dir(sound_dir)

    CROP_BOX = (380, 0, 1780, 1060)
    OUT_W, OUT_H = 370, 280

    # 1. Process CONSTRUCTION (227 frames, step 3 -> ~76 frames)
    const_files = sorted(glob.glob(f"{src_dir}/contruccion/*.png"))
    step = 3
    selected_const = const_files[::step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} castillo construction frames (step {step})...")
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

    # 2. Get master alpha from last construction frame for shadow & ground masking
    last_const_im = Image.open(const_files[-1])
    alpha_c_master = np.array(last_const_im)[:, :, 3]
    alpha_c_master = np.where(alpha_c_master < 25, 0, alpha_c_master)

    # 3. Process IDLE (24 frames)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} castillo idle frames...")
    idle_processed = []
    for i, fpath in enumerate(idle_files):
        im = Image.open(fpath)
        arr_rgb = np.array(im)
        if arr_rgb.shape[2] == 4:
            arr_rgb = arr_rgb[:, :, :3]
        
        # Combine master shadow/building mask with waving flags
        max_b = arr_rgb.max(axis=2).astype(float)
        flag_alpha = np.clip((max_b - 30.0) / 25.0 * 255.0, 0, 255).astype(np.uint8)
        combined_alpha = np.maximum(alpha_c_master, np.where(max_b > 40, flag_alpha, 0))

        rgba = np.dstack([arr_rgb, combined_alpha])
        cleaned_im = Image.fromarray(rgba)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/frame_{i:03d}.png"
        cropped.save(out_f)
        idle_processed.append(out_f)

    # Save static poster
    Image.open(idle_processed[0]).save(f"{out_dir}/castillo_poster.webp", "WEBP", quality=90)
    # Also save to ayuntamiento folder for fallback / direct compatibility
    ayun_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/ayuntamiento"
    ensure_dir(ayun_dir)
    Image.open(idle_processed[0]).save(f"{ayun_dir}/castillo.webp", "WEBP", quality=90)

    # Encode animated WebP
    # Idle: 24 frames @ 20 FPS (50ms)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "50", f])
    cmd_idle.extend(["-o", f"{out_dir}/castillo_idle.webp"])
    run_cmd(cmd_idle)

    # Const: ~76 frames @ 22 FPS (45ms)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/castillo_construccion.webp"])
    run_cmd(cmd_const)

    create_atlas(idle_processed, f"{out_dir}/castillo_idle_atlas.webp", f"{out_dir}/castillo_idle_atlas.json",
                 cols=6, cell_w=185, cell_h=140)
    create_atlas(const_processed, f"{out_dir}/castillo_const_atlas.webp", f"{out_dir}/castillo_const_atlas.json",
                 cols=10, cell_w=123, cell_h=93)

    # Audio copy
    sound_src = f"{src_dir}/contruccion/Timeline 1.mp3"
    if os.path.exists(sound_src):
        subprocess.run(["cp", sound_src, f"{sound_dir}/castle_build.mp3"])
        print(f"Castle audio saved to {sound_dir}/castle_build.mp3")

    print(f"Castillo complete! Output at {out_dir}")

# -------------------------------------------------------------
# 2. PROCESS MOLINO (WINDMILL / GRAIN MILL)
# -------------------------------------------------------------
def process_molino():
    print("\n=== Processing Molino de Viento / Granero ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/molino"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/molino"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_molino"
    sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")
    ensure_dir(sound_dir)

    CROP_BOX = (420, 0, 1720, 1040)
    OUT_W, OUT_H = 360, 288

    # 1. Process IDLE (126 frames, step 3 -> 42 frames @ 18 FPS)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    idle_step = 3
    selected_idle = idle_files[::idle_step]
    print(f"Processing {len(selected_idle)} molino idle frames (step {idle_step})...")
    idle_processed = []
    for i, fpath in enumerate(selected_idle):
        im = Image.open(fpath)
        arr = np.array(im)
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/frame_{i:03d}.png"
        cropped.save(out_f)
        idle_processed.append(out_f)

    # 2. Process CONSTRUCTION (221 frames, step 3 -> ~74 frames)
    const_files = sorted(glob.glob(f"{src_dir}/contruccion/*.png"))
    const_step = 3
    selected_const = const_files[::const_step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} molino construction frames (step {const_step})...")
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
    Image.open(idle_processed[0]).save(f"{out_dir}/molino_poster.webp", "WEBP", quality=90)

    # Encode animated WebP
    # Idle: 42 frames @ 18 FPS (55ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "55", f])
    cmd_idle.extend(["-o", f"{out_dir}/molino_idle.webp"])
    run_cmd(cmd_idle)

    # Const: ~74 frames @ 22 FPS (45ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/molino_construccion.webp"])
    run_cmd(cmd_const)

    create_atlas(idle_processed, f"{out_dir}/molino_idle_atlas.webp", f"{out_dir}/molino_idle_atlas.json",
                 cols=7, cell_w=180, cell_h=144)
    create_atlas(const_processed, f"{out_dir}/molino_const_atlas.webp", f"{out_dir}/molino_const_atlas.json",
                 cols=10, cell_w=120, cell_h=96)

    # Audio copy
    sound_const = f"{src_dir}/contruccion/Timeline 1.mp3"
    if os.path.exists(sound_const):
        subprocess.run(["cp", sound_const, f"{sound_dir}/windmill_build.mp3"])
        print(f"Windmill build audio saved to {sound_dir}/windmill_build.mp3")

    sound_idle = f"{src_dir}/idle/Timeline 1.mp3"
    if os.path.exists(sound_idle):
        subprocess.run(["cp", sound_idle, f"{sound_dir}/windmill_loop.mp3"])
        print(f"Windmill ambient audio saved to {sound_dir}/windmill_loop.mp3")

    print(f"Molino complete! Output at {out_dir}")

if __name__ == "__main__":
    process_castillo()
    process_molino()
    print("\nCASTILLO AND MOLINO PROCESSED SUCCESSFULLY!")
