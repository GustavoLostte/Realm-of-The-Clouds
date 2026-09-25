#!/usr/bin/env python3
"""
Process and optimize DEMO enemy animations into seamless, infinite looping assets.
Target: public/DEMO/ENEMIES/SLIME (and mirror to public/assets/enemies/ENEMIES/SLIME)
Outputs:
- idle.webp, walk.webp, attack.webp, impact.webp, dead.webp (512x288, 24 FPS)
- idle_poster.webp (512x288 static frame 0)
- avatar.webp (160x160 crop for combat HUD)
- sounds/*.ogg (OGG Vorbis sound effects)
- Deletes raw 16-bit PNG frames and MP3s upon successful verification.
"""

import os
import sys
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEMO_ENEMIES_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/ENEMIES")
ASSETS_ENEMIES_DIR = os.path.join(PROJECT_ROOT, "public/assets/enemies/ENEMIES")

TARGET_SIZE = (512, 288)
FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms


def clean_frame(img, target_size=TARGET_SIZE):
    im = img.convert("RGBA")
    arr = np.array(im)
    # Threshold edge noise <= 15 alpha
    arr[arr[:, :, 3] <= 15, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(target_size, Image.Resampling.LANCZOS)


def process_audio(mp3_path, ogg_dest, loop=False):
    if not os.path.exists(mp3_path):
        return None

    os.makedirs(os.path.dirname(ogg_dest), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", mp3_path,
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5"
    ]
    if loop:
        cmd.extend(["-metadata", "LOOPSTART=0"])
    cmd.append(ogg_dest)

    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if res.returncode == 0 and os.path.exists(ogg_dest):
        return ogg_dest
    else:
        print(f"   [Audio Warning] Failed to convert {mp3_path}: {res.stderr.decode()}")
        return None


def process_slime(enemy_dir):
    print(f"\n==================================================")
    print(f"  PROCESANDO ENEMIGO: SLIME ({enemy_dir})")
    print(f"==================================================")

    anims = {
        "IDLE": {"output": "idle.webp", "loop": True, "crossfade": 6, "center": False},
        "WALK": {"output": "walk.webp", "loop": True, "crossfade": 3, "center": True},
        "ATTACK": {"output": "attack.webp", "loop": False, "crossfade": 0, "center": False},
        "IMPACT": {"output": "impact.webp", "loop": False, "crossfade": 0, "center": False},
        "DEAD": {"output": "dead.webp", "loop": False, "crossfade": 0, "center": False},
    }

    sounds_dir = os.path.join(enemy_dir, "sounds")
    os.makedirs(sounds_dir, exist_ok=True)

    total_raw_bytes = 0
    generated_files = []

    # 1. Process each animation
    for anim_name, cfg in anims.items():
        anim_folder = os.path.join(enemy_dir, anim_name)
        if not os.path.exists(anim_folder):
            print(f"   [!] Carpeta no encontrada: {anim_folder}")
            continue

        png_files = sorted(glob.glob(os.path.join(anim_folder, "*.png")))
        if not png_files:
            print(f"   [!] Sin fotogramas PNG en: {anim_folder}")
            continue

        raw_size = sum(os.path.getsize(f) for f in png_files)
        total_raw_bytes += raw_size
        print(f"\n-> Animación: {anim_name} ({len(png_files)} frames, {raw_size/(1024*1024):.1f} MB)")

        # Audio conversion
        raw_mp3 = os.path.join(anim_folder, "Timeline 1.mp3")
        if os.path.exists(raw_mp3):
            total_raw_bytes += os.path.getsize(raw_mp3)
            # Save into sounds/ folder and local animation folder
            target_sound_ogg = os.path.join(sounds_dir, f"{anim_name.lower()}.ogg")
            local_sound_ogg = os.path.join(anim_folder, "sound.ogg")
            process_audio(raw_mp3, target_sound_ogg, loop=cfg["loop"])
            if os.path.exists(target_sound_ogg):
                shutil.copy2(target_sound_ogg, local_sound_ogg)
                generated_files.append(target_sound_ogg)
                generated_files.append(local_sound_ogg)
                print(f"   [Audio] {anim_name.lower()}.ogg ({os.path.getsize(target_sound_ogg)/1024:.1f} KB)")

        # Process frames
        frames = []
        for p in png_files:
            im = Image.open(p).convert("RGBA")
            arr = np.array(im)
            arr[arr[:, :, 3] <= 15, 3] = 0

            # Horizontal centering for walk in-place loop
            if cfg["center"]:
                op = np.where(arr[:, :, 3] > 15)
                if len(op[0]) > 0:
                    cx = (op[1].min() + op[1].max()) / 2.0
                    shift = int(round(940.5 - cx))
                    arr = np.roll(arr, shift, axis=1)

            cleaned = Image.fromarray(arr)
            resized = cleaned.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
            frames.append(resized)

        # Seamless crossfade if configured
        K = cfg["crossfade"]
        if K > 0 and len(frames) > K:
            N = len(frames)
            raw_arrays = [np.array(f) for f in frames]
            for b in range(K):
                idx = N - K + b
                factor = (b + 1) / (K + 1)
                blended = raw_arrays[idx].astype(float) * (1.0 - factor) + raw_arrays[0].astype(float) * factor
                frames[idx] = Image.fromarray(np.round(blended).astype(np.uint8))
            print(f"   [Seamless] Aplicado fundido cruzado de {K} fotogramas para bucle infinito.")

        # Save animated WebP at root and inside anim folder
        out_root = os.path.join(enemy_dir, cfg["output"])
        out_local = os.path.join(anim_folder, cfg["output"])

        frames[0].save(
            out_root,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=FRAME_DURATION_MS,
            loop=0 if cfg["loop"] else 1,
            quality=85,
            method=4
        )
        shutil.copy2(out_root, out_local)
        generated_files.append(out_root)
        generated_files.append(out_local)
        print(f"   [WebP Anim] {cfg['output']} ({os.path.getsize(out_root)/1024:.1f} KB)")

        # Create avatar and idle poster from IDLE
        if anim_name == "IDLE":
            poster_path = os.path.join(enemy_dir, "idle_poster.webp")
            frames[0].save(poster_path, format="WEBP", quality=90, method=6)
            generated_files.append(poster_path)
            print(f"   [Poster] idle_poster.webp ({os.path.getsize(poster_path)/1024:.1f} KB)")

            # Avatar face crop from 1080p frame 0
            im0 = Image.open(png_files[0]).convert("RGBA")
            # Slime head / body is around X=[700, 1180], Y=[380, 860]
            avatar_crop = im0.crop((680, 360, 1200, 880)).resize((160, 160), Image.Resampling.LANCZOS)
            avatar_path = os.path.join(enemy_dir, "avatar.webp")
            avatar_crop.save(avatar_path, format="WEBP", quality=90, method=6)
            generated_files.append(avatar_path)
            print(f"   [Avatar] avatar.webp ({os.path.getsize(avatar_path)/1024:.1f} KB)")

    # 2. Validation
    print("\n--------------------------------------------------")
    print("  VERIFICACIÓN Y LIMPIEZA DE ARCHIVOS")
    print("--------------------------------------------------")
    all_ok = all(os.path.exists(f) and os.path.getsize(f) > 5000 for f in generated_files)

    if all_ok:
        print("   -> ¡Validación exitosa! Todos los archivos generados con integridad.")
        deleted_count = 0
        for anim_name in anims.keys():
            anim_folder = os.path.join(enemy_dir, anim_name)
            # Delete raw PNGs
            pngs = glob.glob(os.path.join(anim_folder, "Timeline 1_*.png"))
            for p in pngs:
                try:
                    os.remove(p)
                    deleted_count += 1
                except Exception as e:
                    print(f"   Aviso al borrar {p}: {e}")

            # Delete raw MP3
            mp3 = os.path.join(anim_folder, "Timeline 1.mp3")
            if os.path.exists(mp3):
                os.remove(mp3)

        final_bytes = sum(os.path.getsize(f) for f in generated_files if os.path.exists(f))
        saved_mb = (total_raw_bytes - final_bytes) / (1024 * 1024)
        pct = ((total_raw_bytes - final_bytes) / total_raw_bytes) * 100.0
        print(f"   -> [COMPLETADO SLIME] {deleted_count} fotogramas PNG eliminados.")
        print(f"   -> Espacio liberado: {saved_mb:.1f} MB (-{pct:.1f}%)")

        # 3. Mirror to public/assets/enemies/ENEMIES/SLIME if it exists
        assets_slime_dir = os.path.join(ASSETS_ENEMIES_DIR, "SLIME")
        if os.path.exists(assets_slime_dir):
            print(f"\n   [Mirror] Sincronizando y limpiando duplicados en {assets_slime_dir}...")
            # Copy all generated webps and sounds
            for item in os.listdir(enemy_dir):
                src_item = os.path.join(enemy_dir, item)
                dst_item = os.path.join(assets_slime_dir, item)
                if os.path.isfile(src_item) and src_item.endswith(".webp"):
                    shutil.copy2(src_item, dst_item)
                elif os.path.isdir(src_item) and item == "sounds":
                    shutil.copytree(src_item, dst_item, dirs_exist_ok=True)
                elif os.path.isdir(src_item) and item in anims:
                    os.makedirs(dst_item, exist_ok=True)
                    for f in glob.glob(os.path.join(src_item, "*.webp")):
                        shutil.copy2(f, os.path.join(dst_item, os.path.basename(f)))
                    for f in glob.glob(os.path.join(src_item, "*.ogg")):
                        shutil.copy2(f, os.path.join(dst_item, os.path.basename(f)))

            # Clean raw pngs and mp3s in assets_slime_dir
            for p in glob.glob(os.path.join(assets_slime_dir, "*", "Timeline 1_*.png")):
                try: os.remove(p)
                except: pass
            for p in glob.glob(os.path.join(assets_slime_dir, "*", "Timeline 1.mp3")):
                try: os.remove(p)
                except: pass
            print(f"   [Mirror OK] Duplicados crudos eliminados de assets/enemies/ENEMIES/SLIME.")

        return True
    else:
        print("   [Error] Algunos archivos no superaron la validación. Archivos crudos preservados.")
        return False


def main():
    slime_dir = os.path.join(DEMO_ENEMIES_DIR, "SLIME")
    if os.path.exists(slime_dir):
        process_slime(slime_dir)
    else:
        print(f"No se encontró directorio de Slime en {slime_dir}")


if __name__ == "__main__":
    main()
