#!/usr/bin/env python3
"""
Process and replace WALK and RUN animations for Kina Male (knight_male).
Outputs:
- public/CHAMPIONS/KINA_MALE/walk.webp (512x288, 24 FPS, seamless loop)
- public/CHAMPIONS/KINA_MALE/run.webp (512x288, 24 FPS, seamless loop)
- public/CHAMPIONS/KINA_MALE/sounds/walk.ogg (OGG Vorbis)
- public/CHAMPIONS/KINA_MALE/sounds/run.ogg (OGG Vorbis)
- Purges raw PNG sequences and raw MP3 files upon verification.
"""

import os
import glob
import subprocess
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KINA_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS/KINA_MALE")
WALK_DIR = os.path.join(KINA_DIR, "WALK")
RUN_DIR = os.path.join(KINA_DIR, "RUN")
SOUNDS_DIR = os.path.join(KINA_DIR, "sounds")

TARGET_SIZE = (512, 288)
FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms

SCALE = 191.0 / 536.0  # Standard Kina Male scale
TARGET_CX = 251.0
TARGET_FOOT_Y = 277.0


def extract_alpha_black_bg(img):
    """Extract clean alpha for black-background RGB frames via border flood fill."""
    arr = np.array(img)
    if 'A' in img.mode:
        return img

    luminance = arr.max(axis=2)
    bg_seed = luminance <= 8

    labeled, _ = ndi.label(bg_seed)
    border_labels = (
        set(np.unique(labeled[0, :])) |
        set(np.unique(labeled[-1, :])) |
        set(np.unique(labeled[:, 0])) |
        set(np.unique(labeled[:, -1]))
    )
    border_labels.discard(0)

    bg_mask = np.isin(labeled, list(border_labels))
    alpha = (~bg_mask).astype(np.uint8) * 255

    # 1px boundary smoothing for soft anti-aliased edge
    eroded = ndi.binary_erosion(~bg_mask, iterations=1)
    boundary = (~bg_mask) & (~eroded)
    # Blend boundary with luminance
    alpha[boundary] = np.clip(luminance[boundary].astype(float) * 10, 50, 255).astype(np.uint8)

    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba)


def process_frames_to_canvas(png_files, raw_cx, raw_ground_y, is_rgb_black=False, crossfade_k=3):
    new_w = int(round(1920 * SCALE))
    new_h = int(round(1080 * SCALE))
    paste_x = int(round(TARGET_CX - raw_cx * SCALE))
    paste_y = int(round(TARGET_FOOT_Y - raw_ground_y * SCALE))

    frames = []
    for f in png_files:
        im = Image.open(f)
        if is_rgb_black:
            im = extract_alpha_black_bg(im)
        else:
            im = im.convert("RGBA")

        arr = np.array(im)
        # Clear noise
        arr[arr[:, :, 3] <= 15, 3] = 0
        cleaned = Image.fromarray(arr)

        resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        canvas.paste(resized, (paste_x, paste_y), resized)
        frames.append(canvas)

    # Apply seamless loop crossfade
    if crossfade_k > 0 and len(frames) > crossfade_k:
        N = len(frames)
        raw_arrays = [np.array(f) for f in frames]
        for b in range(crossfade_k):
            idx = N - crossfade_k + b
            factor = (b + 1) / (crossfade_k + 1)
            blended = raw_arrays[idx].astype(float) * (1.0 - factor) + raw_arrays[0].astype(float) * factor
            frames[idx] = Image.fromarray(np.round(blended).astype(np.uint8))

    return frames


def convert_sound(mp3_path, ogg_path):
    if not os.path.exists(mp3_path):
        return False
    os.makedirs(os.path.dirname(ogg_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", mp3_path,
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
        ogg_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    return res.returncode == 0 and os.path.exists(ogg_path)


def main():
    print("==================================================")
    print("  PROCESANDO NUEVAS ANIMACIONES KINA MALE")
    print("==================================================")

    # 1. Process WALK
    walk_pngs = sorted(glob.glob(os.path.join(WALK_DIR, "*.png")))
    walk_mp3 = os.path.join(WALK_DIR, "Timeline 1.mp3")
    print(f"WALK: {len(walk_pngs)} fotogramas encontrados.")

    if not walk_pngs:
        print("[!] No se encontraron PNGs en WALK!")
        return

    walk_frames = process_frames_to_canvas(
        walk_pngs,
        raw_cx=948.0,
        raw_ground_y=815.0,
        is_rgb_black=True,
        crossfade_k=3
    )

    walk_out = os.path.join(KINA_DIR, "walk.webp")
    walk_frames[0].save(
        walk_out,
        save_all=True,
        append_images=walk_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=85,
        method=4
    )
    print(f"[OK] walk.webp generado: {os.path.getsize(walk_out)/1024:.1f} KB")

    # WALK audio
    walk_ogg = os.path.join(SOUNDS_DIR, "walk.ogg")
    if os.path.exists(walk_mp3):
        convert_sound(walk_mp3, walk_ogg)
        print(f"[OK] walk.ogg actualizado: {os.path.getsize(walk_ogg)/1024:.1f} KB")

    # 2. Process RUN
    run_pngs = sorted(glob.glob(os.path.join(RUN_DIR, "*.png")))
    run_mp3 = os.path.join(RUN_DIR, "Timeline 1.mp3")
    print(f"\nRUN: {len(run_pngs)} fotogramas encontrados.")

    if not run_pngs:
        print("[!] No se encontraron PNGs en RUN!")
        return

    run_frames = process_frames_to_canvas(
        run_pngs,
        raw_cx=935.5,
        raw_ground_y=841.0,
        is_rgb_black=False,
        crossfade_k=3
    )

    run_out = os.path.join(KINA_DIR, "run.webp")
    run_frames[0].save(
        run_out,
        save_all=True,
        append_images=run_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=85,
        method=4
    )
    print(f"[OK] run.webp generado: {os.path.getsize(run_out)/1024:.1f} KB")

    # RUN audio
    run_ogg = os.path.join(SOUNDS_DIR, "run.ogg")
    if os.path.exists(run_mp3):
        convert_sound(run_mp3, run_ogg)
        print(f"[OK] run.ogg actualizado: {os.path.getsize(run_ogg)/1024:.1f} KB")

    # 3. Verification & Cleanup
    print("\n--------------------------------------------------")
    print("  VERIFICACIÓN Y LIMPIEZA")
    print("--------------------------------------------------")
    walk_ok = os.path.exists(walk_out) and os.path.getsize(walk_out) > 50_000
    run_ok = os.path.exists(run_out) and os.path.getsize(run_out) > 50_000

    if walk_ok and run_ok:
        print("-> Verificación exitosa. Eliminando fotogramas PNG y MP3 antiguos...")
        deleted = 0
        for p in walk_pngs + run_pngs:
            try:
                os.remove(p)
                deleted += 1
            except Exception as e:
                print(f"Error borrando {p}: {e}")

        if os.path.exists(walk_mp3):
            os.remove(walk_mp3)
        if os.path.exists(run_mp3):
            os.remove(run_mp3)

        # Remove old .bak files if any
        for bak in glob.glob(os.path.join(KINA_DIR, "*.bak*")):
            try:
                os.remove(bak)
                print(f"Eliminado backup obsoleto: {os.path.basename(bak)}")
            except:
                pass

        print(f"-> ¡Completado! {deleted} fotogramas PNG eliminados.")
        print(f"-> Nuevas animaciones walk.webp y run.webp listas para combate.")
    else:
        print("[!] Error en la verificación. Archivos crudos preservados.")


if __name__ == "__main__":
    main()
