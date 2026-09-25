#!/usr/bin/env python3
"""
Process and integrate LA FUNDADORA NPC into the engine.
- Resizes 135 frames to 512x288 (16:9) WebP animated sprite at 24 FPS with seamless 6-frame crossfade
- Generates idle.webp, poster.webp, avatar.webp (160x160)
- Converts Timeline 1.mp3 to seamless looping OGG Vorbis
- Deploys as ambient audio for Map 3 Pasillo 3
- Validates integrity and purges ~1.3 GB of raw PNG frames
"""

import os
import sys
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NPC_DIR = os.path.join(PROJECT_ROOT, "public/assets/npcs/FUNDADORA")
MAP3_3_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/MAPS/MAP3/3")

TARGET_SIZE = (512, 288)
FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms


def clean_frame(img_path, threshold=20):
    im = Image.open(img_path).convert("RGBA")
    arr = np.array(im)
    arr[arr[:, :, 3] <= threshold, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(TARGET_SIZE, Image.Resampling.LANCZOS)


def convert_audio(src_mp3, dest_ogg):
    if not os.path.exists(src_mp3):
        return False
    os.makedirs(os.path.dirname(dest_ogg), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", src_mp3,
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
        "-metadata", "LOOPSTART=0",
        dest_ogg
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    return res.returncode == 0 and os.path.exists(dest_ogg)


def main():
    print("\n=======================================================")
    print("  PROCESANDO: LA FUNDADORA CELESTIAL (NPC MAPA 3-3)")
    print("=======================================================")

    pngs = sorted(glob.glob(os.path.join(NPC_DIR, "Timeline 1_*.png")))
    mp3_path = os.path.join(NPC_DIR, "Timeline 1.mp3")

    if not pngs:
        print("   [!] No se encontraron fotogramas PNG en", NPC_DIR)
        sys.exit(1)

    raw_bytes = sum(os.path.getsize(p) for p in pngs)
    if os.path.exists(mp3_path):
        raw_bytes += os.path.getsize(mp3_path)

    print(f"-> Cargando {len(pngs)} fotogramas ({raw_bytes / (1024*1024):.1f} MB)...")

    # 1. Process frames
    frames = [clean_frame(p, threshold=20) for p in pngs]

    # 2. 6-frame seamless crossfade
    K = 6
    N = len(frames)
    raw_arrays = [np.array(f) for f in frames]
    for b in range(K):
        idx = N - K + b
        factor = (b + 1) / (K + 1)
        blended = raw_arrays[idx].astype(float) * (1.0 - factor) + raw_arrays[0].astype(float) * factor
        frames[idx] = Image.fromarray(np.round(blended).astype(np.uint8))

    # 3. Save animated WebP
    out_idle = os.path.join(NPC_DIR, "idle.webp")
    frames[0].save(
        out_idle,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=82,
        method=4
    )
    print(f"   [WebP Anim] idle.webp ({os.path.getsize(out_idle)/1024:.1f} KB)")

    # 4. Save poster
    out_poster = os.path.join(NPC_DIR, "poster.webp")
    frames[0].save(out_poster, format="WEBP", quality=90, method=6)
    print(f"   [Poster] poster.webp ({os.path.getsize(out_poster)/1024:.1f} KB)")

    # 5. Save avatar crop (160x160)
    im0 = Image.open(pngs[0]).convert("RGBA")
    avatar_crop = im0.crop((640, 100, 1000, 460)).resize((160, 160), Image.Resampling.LANCZOS)
    out_avatar = os.path.join(NPC_DIR, "avatar.webp")
    avatar_crop.save(out_avatar, format="WEBP", quality=90, method=6)
    print(f"   [Avatar] avatar.webp ({os.path.getsize(out_avatar)/1024:.1f} KB)")

    # 6. Audio conversion
    out_audio = os.path.join(NPC_DIR, "ambient.ogg")
    if os.path.exists(mp3_path):
        convert_audio(mp3_path, out_audio)
        print(f"   [Audio] ambient.ogg ({os.path.getsize(out_audio)/1024:.1f} KB)")

        # Also deploy to MAP3/3 as corridor theme
        if os.path.exists(MAP3_3_DIR):
            shutil.copy2(out_audio, os.path.join(MAP3_3_DIR, "sound_effect.ogg"))
            shutil.copy2(out_audio, os.path.join(MAP3_3_DIR, "ambient.ogg"))
            print(f"   [Map Theme] Copiado a MAP3/3 como tema musical del santuario.")

    # 7. Verification & Cleanup
    required_files = [out_idle, out_poster, out_avatar, out_audio]
    all_ok = all(os.path.exists(f) and os.path.getsize(f) > 5000 for f in required_files)

    if all_ok:
        deleted = 0
        for p in pngs:
            try:
                os.remove(p)
                deleted += 1
            except:
                pass
        if os.path.exists(mp3_path):
            try:
                os.remove(mp3_path)
            except:
                pass

        final_bytes = sum(os.path.getsize(f) for f in required_files if os.path.exists(f))
        saved_mb = (raw_bytes - final_bytes) / (1024 * 1024)
        print(f"\n   -> [FUNDADORA OK] {deleted} PNGs eliminados. Liberados {saved_mb:.1f} MB.")
        print("=======================================================\n")
    else:
        print("\n   [!] Fallo de validación. Archivos crudos preservados.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
