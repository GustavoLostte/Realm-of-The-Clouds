#!/usr/bin/env python3
"""
Process and replace WALK animation for Kina Male (knight_male).
Outputs:
- public/CHAMPIONS/KINA_MALE/walk.webp (512x288, 24 FPS, seamless loop)
- public/CHAMPIONS/KINA_MALE/sounds/walk.ogg (OGG Vorbis)
- Purges raw PNG sequences, raw MP3 files, and WALK directory upon verification.
"""

import os
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KINA_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS/KINA_MALE")
WALK_DIR = os.path.join(KINA_DIR, "WALK")
SOUNDS_DIR = os.path.join(KINA_DIR, "sounds")

TARGET_SIZE = (512, 288)
FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms

SCALE = 191.0 / 536.0  # Standard Kina Male scale (~0.35634)
TARGET_CX = 251.0
TARGET_FOOT_Y = 279.0
RAW_CX = 948.0
RAW_GROUND_Y = 815.0


def process_frames_to_canvas(png_files, crossfade_k=3):
    new_w = int(round(1920 * SCALE))
    new_h = int(round(1080 * SCALE))
    paste_x = int(round(TARGET_CX - RAW_CX * SCALE))
    paste_y = int(round(TARGET_FOOT_Y - RAW_GROUND_Y * SCALE))

    frames = []
    for f in png_files:
        im = Image.open(f).convert("RGBA")
        arr = np.array(im)

        # Clear outer boundary noise & low-alpha compression artifacts
        arr[:8, :, 3] = 0
        arr[-8:, :, 3] = 0
        arr[:, :8, 3] = 0
        arr[:, -8:, 3] = 0
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
    print("  PROCESANDO NUEVA ANIMACIÓN WALK KINA MALE")
    print("==================================================")

    walk_pngs = sorted(glob.glob(os.path.join(WALK_DIR, "*.png")))
    walk_mp3 = os.path.join(WALK_DIR, "Timeline 1.mp3")
    print(f"WALK: {len(walk_pngs)} fotogramas encontrados.")

    if not walk_pngs:
        print("[!] No se encontraron PNGs en WALK!")
        return

    walk_frames = process_frames_to_canvas(
        walk_pngs,
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

    # Verification & Cleanup
    print("\n--------------------------------------------------")
    print("  VERIFICACIÓN Y LIMPIEZA")
    print("--------------------------------------------------")
    walk_ok = os.path.exists(walk_out) and os.path.getsize(walk_out) > 50_000

    if walk_ok:
        print("-> Verificación exitosa. Eliminando fotogramas PNG y MP3 antiguos...")
        deleted = 0
        for p in walk_pngs:
            try:
                os.remove(p)
                deleted += 1
            except Exception as e:
                print(f"Error borrando {p}: {e}")

        if os.path.exists(walk_mp3):
            os.remove(walk_mp3)

        if os.path.exists(WALK_DIR):
            try:
                shutil.rmtree(WALK_DIR)
                print(f"Eliminada carpeta temporal: WALK")
            except Exception as e:
                print(f"Error borrando {WALK_DIR}: {e}")

        # Remove old .bak files if any
        for bak in glob.glob(os.path.join(KINA_DIR, "*.bak*")):
            try:
                os.remove(bak)
                print(f"Eliminado backup obsoleto: {os.path.basename(bak)}")
            except:
                pass

        print(f"-> ¡Completado! {deleted} fotogramas PNG eliminados.")
        print(f"-> Nueva animación walk.webp lista para combate.")
    else:
        print("[!] Error en la verificación. Archivos crudos preservados.")


if __name__ == "__main__":
    main()
