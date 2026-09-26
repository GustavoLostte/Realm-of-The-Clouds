#!/usr/bin/env python3
"""
Process and integrate BAT and SKELETONS enemy animations and audio into the engine.
- Resizes to standard 512x288 (16:9) WebP animated sprites at 24 FPS
- Applies smooth seamless crossfade to IDLE and WALK loops
- Generates impact.webp, attack.webp, dead.webp, idle_poster.webp, avatar.webp (160x160)
- Encodes audio to seamless looping and SFX OGG Vorbis
- Validates file integrity and purges ~2.5 GB of raw PNG sequences and MP3s
"""

import os
import sys
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image, ImageEnhance

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEMO_ENEMIES_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/ENEMIES")
ASSETS_ENEMIES_DIR = os.path.join(PROJECT_ROOT, "public/assets/enemies/ENEMIES")

TARGET_SIZE = (512, 288)
FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms


def clean_frame(img_path, threshold=20):
    im = Image.open(img_path).convert("RGBA")
    arr = np.array(im)
    arr[arr[:, :, 3] <= threshold, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(TARGET_SIZE, Image.Resampling.LANCZOS)


def convert_audio(src_mp3, dest_ogg, loop=False, duration=None, volume=1.0):
    if not os.path.exists(src_mp3):
        return False
    os.makedirs(os.path.dirname(dest_ogg), exist_ok=True)
    cmd = ["ffmpeg", "-y"]
    if duration:
        cmd.extend(["-t", str(duration)])
    cmd.extend(["-i", src_mp3])
    if volume != 1.0:
        cmd.extend(["-filter:a", f"volume={volume}"])
    cmd.extend(["-c:a", "vorbis", "-strict", "-2", "-q:a", "5"])
    if loop:
        cmd.extend(["-metadata", "LOOPSTART=0"])
    cmd.append(dest_ogg)

    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    return res.returncode == 0 and os.path.exists(dest_ogg)


def create_seamless_webp(frames, output_path, crossfade_count=4, loop=0, quality=82):
    if crossfade_count > 0 and len(frames) > crossfade_count:
        K = crossfade_count
        N = len(frames)
        raw_arrays = [np.array(f) for f in frames]
        out_frames = list(frames)
        for b in range(K):
            idx = N - K + b
            factor = (b + 1) / (K + 1)
            blended = raw_arrays[idx].astype(float) * (1.0 - factor) + raw_arrays[0].astype(float) * factor
            out_frames[idx] = Image.fromarray(np.round(blended).astype(np.uint8))
        frames = out_frames

    frames[0].save(
        output_path,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=loop,
        quality=quality,
        method=4
    )


def process_bat():
    enemy_dir = os.path.join(DEMO_ENEMIES_DIR, "BAT")
    print("\n=======================================================")
    print("  PROCESANDO: BAT (MURCIÉLAGO) - MAPA 2")
    print("=======================================================")

    anims_cfg = {
        "IDLE": {"output": "idle.webp", "loop": 0, "crossfade": 4},
        "WALK": {"output": "walk.webp", "loop": 0, "crossfade": 4},
        "ATTACK": {"output": "attack.webp", "loop": 1, "crossfade": 0},
        "IMPACT": {"output": "impact.webp", "loop": 1, "crossfade": 0},
        "DEAD": {"output": "dead.webp", "loop": 1, "crossfade": 0},
    }

    sounds_dir = os.path.join(enemy_dir, "sounds")
    os.makedirs(sounds_dir, exist_ok=True)
    generated = []
    total_raw_bytes = 0

    # 1. Process Animations
    for anim_name, cfg in anims_cfg.items():
        folder = os.path.join(enemy_dir, anim_name)
        pngs = sorted(glob.glob(os.path.join(folder, "*.png")))
        if not pngs:
            print(f"   [!] Sin PNGs en {anim_name}")
            continue

        raw_size = sum(os.path.getsize(p) for p in pngs)
        total_raw_bytes += raw_size
        print(f"-> {anim_name}: {len(pngs)} frames ({raw_size / (1024*1024):.1f} MB)...")

        frames = [clean_frame(p, threshold=20) for p in pngs]
        out_root = os.path.join(enemy_dir, cfg["output"])
        create_seamless_webp(frames, out_root, crossfade_count=cfg["crossfade"], loop=cfg["loop"], quality=82)
        generated.append(out_root)
        print(f"   [WebP] {cfg['output']} -> {os.path.getsize(out_root)/1024:.1f} KB")

        # Static poster and avatar from IDLE
        if anim_name == "IDLE":
            poster_path = os.path.join(enemy_dir, "idle_poster.webp")
            frames[0].save(poster_path, format="WEBP", quality=90, method=6)
            generated.append(poster_path)

            im0 = Image.open(pngs[0]).convert("RGBA")
            # Head crop centered at (675, 250, 1075, 650)
            avatar_crop = im0.crop((675, 250, 1075, 650)).resize((160, 160), Image.Resampling.LANCZOS)
            avatar_path = os.path.join(enemy_dir, "avatar.webp")
            avatar_crop.save(avatar_path, format="WEBP", quality=90, method=6)
            generated.append(avatar_path)
            print(f"   [Avatar & Poster] creados con éxito.")

    # 2. Audio Processing
    audio_map = {
        "impact.ogg": (os.path.join(enemy_dir, "IMPACT", "Timeline 1.mp3"), False),
        "attack.ogg": (os.path.join(enemy_dir, "ATTACK", "Timeline 1.mp3"), False),
        "dead.ogg": (os.path.join(enemy_dir, "DEAD", "Timeline 1.mp3"), False),
    }
    for ogg_name, (src_mp3, loop) in audio_map.items():
        if os.path.exists(src_mp3):
            total_raw_bytes += os.path.getsize(src_mp3)
            dest_ogg = os.path.join(sounds_dir, ogg_name)
            if convert_audio(src_mp3, dest_ogg, loop=loop):
                generated.append(dest_ogg)
                print(f"   [Audio] {ogg_name} ({os.path.getsize(dest_ogg)/1024:.1f} KB)")

    # Fallback soft ambient wing flutter for idle / walk
    if os.path.exists(os.path.join(sounds_dir, "attack.ogg")):
        for a in ["idle.ogg", "walk.ogg"]:
            dest = os.path.join(sounds_dir, a)
            shutil.copy2(os.path.join(sounds_dir, "attack.ogg"), dest)
            generated.append(dest)

    # 3. Validation & Cleanup
    all_ok = all(os.path.exists(f) and os.path.getsize(f) > 3000 for f in generated)
    if all_ok:
        deleted = 0
        for anim_name in anims_cfg.keys():
            folder = os.path.join(enemy_dir, anim_name)
            for p in glob.glob(os.path.join(folder, "Timeline 1_*.png")):
                try: os.remove(p); deleted += 1
                except: pass
            for mp3 in glob.glob(os.path.join(folder, "*.mp3")):
                try: os.remove(mp3)
                except: pass

        # Mirror to public/assets/enemies/ENEMIES/BAT
        mirror_dir = os.path.join(ASSETS_ENEMIES_DIR, "BAT")
        os.makedirs(mirror_dir, exist_ok=True)
        for item in os.listdir(enemy_dir):
            src_i = os.path.join(enemy_dir, item)
            dst_i = os.path.join(mirror_dir, item)
            if os.path.isfile(src_i) and src_i.endswith(".webp"):
                shutil.copy2(src_i, dst_i)
            elif os.path.isdir(src_i) and item == "sounds":
                shutil.copytree(src_i, dst_i, dirs_exist_ok=True)

        final_bytes = sum(os.path.getsize(f) for f in generated if os.path.exists(f))
        print(f"   -> [BAT OK] {deleted} PNGs eliminados. Liberados {(total_raw_bytes-final_bytes)/(1024*1024):.1f} MB.")
        return True
    else:
        print("   [!] Fallo de validación en BAT. Archivos crudos preservados.")
        return False


def process_skeletons():
    enemy_dir = os.path.join(DEMO_ENEMIES_DIR, "SKELETONS")
    print("\n=======================================================")
    print("  PROCESANDO: SKELETONS (ESQUELETOS) - MAPA 3")
    print("=======================================================")

    anims_cfg = {
        "IDLE": {"output": "idle.webp", "loop": 0, "crossfade": 6},
        "WALK": {"output": "walk.webp", "loop": 0, "crossfade": 6},
        "ATTACK": {"output": "attack.webp", "loop": 1, "crossfade": 0},
        "DEAD": {"output": "dead.webp", "loop": 1, "crossfade": 0},
    }

    sounds_dir = os.path.join(enemy_dir, "sounds")
    os.makedirs(sounds_dir, exist_ok=True)
    generated = []
    total_raw_bytes = 0

    dead_pngs_cleaned = []

    # 1. Process Animations
    for anim_name, cfg in anims_cfg.items():
        folder = os.path.join(enemy_dir, anim_name)
        pngs = sorted(glob.glob(os.path.join(folder, "*.png")))
        if not pngs:
            print(f"   [!] Sin PNGs en {anim_name}")
            continue

        raw_size = sum(os.path.getsize(p) for p in pngs)
        total_raw_bytes += raw_size
        print(f"-> {anim_name}: {len(pngs)} frames ({raw_size / (1024*1024):.1f} MB)...")

        frames = [clean_frame(p, threshold=20) for p in pngs]
        if anim_name == "DEAD":
            dead_pngs_cleaned = frames

        out_root = os.path.join(enemy_dir, cfg["output"])
        create_seamless_webp(frames, out_root, crossfade_count=cfg["crossfade"], loop=cfg["loop"], quality=82)
        generated.append(out_root)
        print(f"   [WebP] {cfg['output']} -> {os.path.getsize(out_root)/1024:.1f} KB")

        # Static poster and avatar from IDLE
        if anim_name == "IDLE":
            poster_path = os.path.join(enemy_dir, "idle_poster.webp")
            frames[0].save(poster_path, format="WEBP", quality=90, method=6)
            generated.append(poster_path)

            im0 = Image.open(pngs[0]).convert("RGBA")
            # Skull crop centered at (700, 60, 1100, 460)
            avatar_crop = im0.crop((700, 60, 1100, 460)).resize((160, 160), Image.Resampling.LANCZOS)
            avatar_path = os.path.join(enemy_dir, "avatar.webp")
            avatar_crop.save(avatar_path, format="WEBP", quality=90, method=6)
            generated.append(avatar_path)
            print(f"   [Avatar & Poster] creados con éxito.")

    # 2. Synthesize IMPACT animation for Skeleton (flinch & recoil from early DEAD frames)
    if dead_pngs_cleaned and len(dead_pngs_cleaned) >= 12:
        print("-> Sintetizando IMPACT (impacto / retroceso óseo)...")
        impact_frames = []
        # Flinch backward (frames 0..11)
        for i in range(12):
            f = dead_pngs_cleaned[i].copy()
            # Add white hit flash on frames 1..4
            if 1 <= i <= 4:
                enhancer = ImageEnhance.Brightness(f)
                f = enhancer.enhance(1.4)
            impact_frames.append(f)
        # Recover forward back to standing (frames 10 down to 0, every 2nd frame)
        for i in range(10, -1, -2):
            impact_frames.append(dead_pngs_cleaned[i])

        impact_path = os.path.join(enemy_dir, "impact.webp")
        create_seamless_webp(impact_frames, impact_path, crossfade_count=0, loop=1, quality=82)
        generated.append(impact_path)
        print(f"   [WebP] impact.webp -> {os.path.getsize(impact_path)/1024:.1f} KB ({len(impact_frames)} frames)")

    # 3. Audio Processing
    audio_map = {
        "attack.ogg": (os.path.join(enemy_dir, "ATTACK", "Timeline 1.mp3"), False, None, 1.0),
        "dead.ogg": (os.path.join(enemy_dir, "DEAD", "Timeline 1.mp3"), False, None, 1.0),
        "idle.ogg": (os.path.join(enemy_dir, "IDLE", "Timeline 1.mp3"), True, None, 0.7),
        "walk.ogg": (os.path.join(enemy_dir, "WALK", "Timeline 1.mp3"), True, None, 0.8),
        # Impact bone hit: first 0.55s of DEAD sound with 1.35x volume punch
        "impact.ogg": (os.path.join(enemy_dir, "DEAD", "Timeline 1.mp3"), False, 0.55, 1.35),
    }

    for ogg_name, (src_mp3, loop, dur, vol) in audio_map.items():
        if os.path.exists(src_mp3):
            total_raw_bytes += os.path.getsize(src_mp3)
            dest_ogg = os.path.join(sounds_dir, ogg_name)
            if convert_audio(src_mp3, dest_ogg, loop=loop, duration=dur, volume=vol):
                generated.append(dest_ogg)
                print(f"   [Audio] {ogg_name} ({os.path.getsize(dest_ogg)/1024:.1f} KB)")

    # 4. Validation & Cleanup
    all_ok = all(os.path.exists(f) and os.path.getsize(f) > 3000 for f in generated)
    if all_ok:
        deleted = 0
        for anim_name in anims_cfg.keys():
            folder = os.path.join(enemy_dir, anim_name)
            for p in glob.glob(os.path.join(folder, "Timeline 1_*.png")):
                try: os.remove(p); deleted += 1
                except: pass
            for mp3 in glob.glob(os.path.join(folder, "*.mp3")):
                try: os.remove(mp3)
                except: pass

        # Mirror to public/assets/enemies/ENEMIES/SKELETONS
        mirror_dir = os.path.join(ASSETS_ENEMIES_DIR, "SKELETONS")
        os.makedirs(mirror_dir, exist_ok=True)
        for item in os.listdir(enemy_dir):
            src_i = os.path.join(enemy_dir, item)
            dst_i = os.path.join(mirror_dir, item)
            if os.path.isfile(src_i) and src_i.endswith(".webp"):
                shutil.copy2(src_i, dst_i)
            elif os.path.isdir(src_i) and item == "sounds":
                shutil.copytree(src_i, dst_i, dirs_exist_ok=True)

        final_bytes = sum(os.path.getsize(f) for f in generated if os.path.exists(f))
        print(f"   -> [SKELETONS OK] {deleted} PNGs eliminados. Liberados {(total_raw_bytes-final_bytes)/(1024*1024):.1f} MB.")
        return True
    else:
        print("   [!] Fallo de validación en SKELETONS. Archivos crudos preservados.")
        return False


def main():
    print("Iniciando procesamiento de enemigos BAT y SKELETONS...")
    ok_bat = process_bat()
    ok_skel = process_skeletons()

    if ok_bat and ok_skel:
        print("\n=======================================================")
        print("  TODOS LOS ENEMIGOS PROCESADOS CON ÉXITO")
        print("=======================================================")
    else:
        print("\n[!] Hubo errores durante el procesamiento.")
        sys.exit(1)


if __name__ == "__main__":
    main()
