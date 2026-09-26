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

# -------------------------------------------------------------
# 1. OPTIMIZE CASA MOLINO (SAWMILL / ASERRADERO)
# -------------------------------------------------------------
def process_casa_molino():
    print("=== Processing Casa con Molino (Sawmill) ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/casa_molino"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/casa_molino"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_molino"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")

    # Geometry crop window (1200 x 1000) -> resized to 360 x 300
    CROP_BOX = (320, 0, 1520, 1000)
    OUT_W, OUT_H = 360, 300

    # Load reference const end frame for alpha alignment
    const_end = Image.open(f"{src_dir}/Timeline 1_00086599.png")
    const_alpha = np.array(const_end)[:, :, 3]

    # Process IDLE (18 frames)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} idle frames...")

    H, W = 1080, 1920
    wheel_region = (np.arange(W)[None, :] >= 340) & (np.arange(W)[None, :] <= 600) & (np.arange(H)[:, None] >= 500) & (np.arange(H)[:, None] <= 860)
    smoke_region = (np.arange(W)[None, :] >= 800) & (np.arange(W)[None, :] <= 1160) & (np.arange(H)[:, None] <= 520)

    idle_processed = []
    for i, fpath in enumerate(idle_files):
        im = Image.open(fpath)
        arr = np.array(im)
        alpha = np.zeros((H, W), dtype=np.uint8)

        # Smoke alpha from brightness
        brightness = arr.max(axis=2).astype(float)
        smoke_alpha = np.clip((brightness - 6) * 1.8, 0, 220).astype(np.uint8)
        alpha[smoke_region] = smoke_alpha[smoke_region]

        # Building body
        alpha[const_alpha > 200] = 255
        # Wheel rotation
        alpha[wheel_region & (brightness > 18)] = 255
        # Smooth contact edges
        contact_mask = (const_alpha > 50) & (const_alpha <= 200)
        alpha[contact_mask] = const_alpha[contact_mask]

        rgba = np.dstack([arr, alpha])
        cleaned_im = Image.fromarray(rgba)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/idle/frame_{i:03d}.png"
        cropped.save(out_f)
        idle_processed.append(out_f)

    # Process CONSTRUCTION (every 3rd frame -> ~67 frames)
    const_files = sorted([f for f in glob.glob(f"{src_dir}/*.png") if os.path.isfile(f)])
    step = 3
    selected_const = const_files[::step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} construction frames (step {step})...")

    const_processed = []
    for i, fpath in enumerate(selected_const):
        im = Image.open(fpath)
        arr = np.array(im)
        # Clean low alpha noise
        if arr.shape[2] == 4:
            arr[:, :, 3] = np.where(arr[:, :, 3] < 20, 0, arr[:, :, 3])
        cleaned_im = Image.fromarray(arr)
        cropped = cleaned_im.crop(CROP_BOX).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        out_f = f"{temp_dir}/const/frame_{i:03d}.png"
        cropped.save(out_f)
        const_processed.append(out_f)

    # Save static poster thumbnail
    Image.open(idle_processed[0]).save(f"{out_dir}/casa_molino_poster.webp", "WEBP", quality=90)

    # Encode animated WebP using img2webp
    # Idle: 18 frames @ ~16 FPS (62ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "62", f])
    cmd_idle.extend(["-o", f"{out_dir}/casa_molino_idle.webp"])
    run_cmd(cmd_idle)

    # Const: ~67 frames @ 22 FPS (45ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "45", f])
    cmd_const.extend(["-o", f"{out_dir}/casa_molino_construccion.webp"])
    run_cmd(cmd_const)

    # Generate Atlases
    create_atlas(idle_processed, f"{out_dir}/casa_molino_idle_atlas.webp", f"{out_dir}/casa_molino_idle_atlas.json",
                 cols=6, cell_w=180, cell_h=150)
    create_atlas(const_processed, f"{out_dir}/casa_molino_const_atlas.webp", f"{out_dir}/casa_molino_const_atlas.json",
                 cols=8, cell_w=120, cell_h=100)

    # Copy audio track
    if os.path.exists(f"{src_dir}/Timeline 1.mp3"):
        sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
        ensure_dir(sound_dir)
        subprocess.run(["cp", f"{src_dir}/Timeline 1.mp3", f"{sound_dir}/sawmill.mp3"])
        print(f"Audio saved to {sound_dir}/sawmill.mp3")

    print(f"Casa molino complete! Output at {out_dir}")

# -------------------------------------------------------------
# 2. OPTIMIZE MINA DE PIEDRA (STONE MINE / CANTERA)
# -------------------------------------------------------------
def process_mina_piedra():
    print("\n=== Processing Mina de Piedra (Stone Mine) ===")
    src_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/building/mina_piedra"
    out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/mina_piedra"
    temp_dir = "/Users/wizzard/Desktop/TOC FOE/scripts/temp_mina"
    ensure_dir(out_dir)
    ensure_dir(temp_dir)
    ensure_dir(f"{temp_dir}/idle")
    ensure_dir(f"{temp_dir}/const")

    # Geometry crop window (1520 x 1080) -> resized to 380 x 270
    CROP_BOX = (80, 0, 1600, 1080)
    OUT_W, OUT_H = 380, 270

    # Process IDLE (8 frames)
    idle_files = sorted(glob.glob(f"{src_dir}/idle/*.png"))
    print(f"Processing {len(idle_files)} idle frames...")

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

    # Process CONSTRUCTION (every 3rd frame from 182 frames -> ~61 frames)
    const_files = sorted(glob.glob(f"{src_dir}/construccion/*.png"))
    step = 3
    selected_const = const_files[::step]
    if const_files[-1] not in selected_const:
        selected_const.append(const_files[-1])
    print(f"Processing {len(selected_const)} construction frames (step {step})...")

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

    # Save static poster thumbnail
    Image.open(idle_processed[0]).save(f"{out_dir}/mina_piedra_poster.webp", "WEBP", quality=90)

    # Encode animated WebP using img2webp
    # Idle: 8 frames @ 12 FPS (83ms per frame)
    cmd_idle = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "3", "-kmax", "8", "-q", "85", "-m", "4"]
    for f in idle_processed:
        cmd_idle.extend(["-d", "83", f])
    cmd_idle.extend(["-o", f"{out_dir}/mina_piedra_idle.webp"])
    run_cmd(cmd_idle)

    # Const: ~61 frames @ 20 FPS (50ms per frame)
    cmd_const = ["/opt/homebrew/bin/img2webp", "-loop", "0", "-kmin", "4", "-kmax", "10", "-q", "80", "-m", "4"]
    for f in const_processed:
        cmd_const.extend(["-d", "50", f])
    cmd_const.extend(["-o", f"{out_dir}/mina_piedra_construccion.webp"])
    run_cmd(cmd_const)

    # Generate Atlases
    create_atlas(idle_processed, f"{out_dir}/mina_piedra_idle_atlas.webp", f"{out_dir}/mina_piedra_idle_atlas.json",
                 cols=4, cell_w=190, cell_h=135)
    create_atlas(const_processed, f"{out_dir}/mina_piedra_const_atlas.webp", f"{out_dir}/mina_piedra_const_atlas.json",
                 cols=8, cell_w=120, cell_h=85)

    # Copy audio track
    if os.path.exists(f"{src_dir}/construccion/Timeline 1.mp3"):
        sound_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
        ensure_dir(sound_dir)
        subprocess.run(["cp", f"{src_dir}/construccion/Timeline 1.mp3", f"{sound_dir}/stone_mine.mp3"])
        print(f"Audio saved to {sound_dir}/stone_mine.mp3")

    print(f"Mina de piedra complete! Output at {out_dir}")

# -------------------------------------------------------------
# ATLAS GENERATOR HELPER
# -------------------------------------------------------------
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

if __name__ == "__main__":
    process_casa_molino()
    process_mina_piedra()
    print("\nALL BUILDINGS PROCESSED SUCCESSFULLY!")
