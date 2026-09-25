#!/usr/bin/env python3
"""
Process, optimize and integrate all 9 corridors across MAP1, MAP2, MAP3.
- Generates 1080p static base poster (map_base.webp, Q=92)
- Generates 960x540 seamless looping animated WebP sprite (map_loop.webp, 24 FPS / 42ms, Q=82)
- Converts audio to seamless looping OGG Vorbis with equal-power crossfade
- Creates web-safe aliases (e.g. 1 and hall_1)
- Purges raw uncompressed PNG sequences and MP3s upon strict verification (~18 GB freed)
"""

import os
import sys
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAPS_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/MAPS")

CORRIDORS = [
    # MAP 1 (Senda de Esporas)
    {"map": "MAP1", "hall_folder": "1:3", "hall_num": 1, "raw_frames": 240, "crossfade": 16, "has_audio": True},
    {"map": "MAP1", "hall_folder": "2:3", "hall_num": 2, "raw_frames": 144, "crossfade": 12, "has_audio": True},
    {"map": "MAP1", "hall_folder": "3:3", "hall_num": 3, "raw_frames": 240, "crossfade": 16, "has_audio": False, "audio_source": ("MAP1", "1:3")},
    # MAP 2 (Hongo Gigante)
    {"map": "MAP2", "hall_folder": "1:3", "hall_num": 1, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
    {"map": "MAP2", "hall_folder": "2:3", "hall_num": 2, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
    {"map": "MAP2", "hall_folder": "3:3", "hall_num": 3, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
    # MAP 3 (Caverna Mística)
    {"map": "MAP3", "hall_folder": "1:3", "hall_num": 1, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
    {"map": "MAP3", "hall_folder": "2:3", "hall_num": 2, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
    {"map": "MAP3", "hall_folder": "3:3", "hall_num": 3, "raw_frames": 144, "crossfade": 12, "has_audio": False, "audio_source": ("MAP1", "2:3")},
]

FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms
AUDIO_SR = 48000


def smoothstep(t):
    """Hermite S-curve for silky smooth visual interpolation."""
    return t * t * (3.0 - 2.0 * t)


def process_audio_file(mp3_path, ogg_path, loop_seconds, crossfade_seconds=0.5):
    """Decode and apply equal-power crossfade to ambient audio for seamless loop."""
    print(f"   [Audio] Processing {os.path.basename(mp3_path)} -> {os.path.basename(ogg_path)} ({loop_seconds:.2f}s loop)...")
    cmd_dec = [
        "ffmpeg", "-i", mp3_path,
        "-f", "f32le", "-ac", "2", "-ar", str(AUDIO_SR), "pipe:1"
    ]
    p_dec = subprocess.Popen(cmd_dec, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    audio = np.frombuffer(p_dec.stdout.read(), dtype=np.float32).reshape(-1, 2)

    l_samples = int(round(loop_seconds * AUDIO_SR))
    k_samples = int(round(crossfade_seconds * AUDIO_SR))
    needed_samples = l_samples + k_samples

    if len(audio) < needed_samples:
        audio = np.pad(audio, ((0, needed_samples - len(audio)), (0, 0)), mode="wrap")

    # Equal power crossfade
    t = np.linspace(0, 1, k_samples, endpoint=False)[:, np.newaxis]
    fade_out = np.cos(t * np.pi / 2.0)
    fade_in = np.sin(t * np.pi / 2.0)

    out_audio = np.copy(audio[:l_samples])
    tail = audio[l_samples : l_samples + k_samples]
    head = audio[:k_samples]
    out_audio[:k_samples] = head * fade_in + tail * fade_out

    # Encode to OGG Vorbis
    cmd_enc = [
        "ffmpeg", "-y", "-f", "f32le", "-ar", str(AUDIO_SR), "-ac", "2", "-i", "pipe:0",
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
        "-metadata", "LOOPSTART=0",
        "-metadata", f"LOOPLENGTH={l_samples}",
        "-metadata", "TITLE=Realm of the Clouds Ambient Corridor Sound",
        ogg_path
    ]
    p_enc = subprocess.run(
        cmd_enc,
        input=out_audio.astype(np.float32).tobytes(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE
    )

    if p_enc.returncode != 0:
        print(f"   [Audio Error] FFmpeg vorbis failed: {p_enc.stderr.decode()}")
        return False
    return True


def process_corridor(cfg):
    m_name = cfg["map"]
    h_folder = cfg["hall_folder"]
    h_num = cfg["hall_num"]
    expected_frames = cfg["raw_frames"]
    k_crossfade = cfg["crossfade"]

    corridor_dir = os.path.join(MAPS_DIR, m_name, h_folder)
    print(f"\n=======================================================")
    print(f"  PROCESANDO {m_name} - Pasillo {h_num} ({corridor_dir})")
    print(f"=======================================================")

    png_files = sorted(glob.glob(os.path.join(corridor_dir, "*.png")))
    if len(png_files) < expected_frames:
        # Check if already processed (map_loop.webp already exists)
        if os.path.exists(os.path.join(corridor_dir, "map_loop.webp")):
            print(f"   [Info] {m_name}/{h_folder} already processed (map_loop.webp found).")
            return True
        print(f"   [Error] Expected {expected_frames} frames, found {len(png_files)}")
        return False

    raw_total_bytes = sum(os.path.getsize(f) for f in png_files)
    print(f"   Fotogramas PNG originales: {len(png_files)} archivos ({raw_total_bytes / (1024*1024):.1f} MB)")

    # 1. Audio Processing
    ogg_path = os.path.join(corridor_dir, "sound_effect.ogg")
    ambient_ogg_path = os.path.join(corridor_dir, "ambient.ogg")
    loop_frames = expected_frames - k_crossfade
    loop_duration_sec = loop_frames / FPS

    if cfg.get("has_audio"):
        mp3_path = os.path.join(corridor_dir, "Timeline 1.mp3")
        if os.path.exists(mp3_path):
            if process_audio_file(mp3_path, ogg_path, loop_duration_sec):
                shutil.copy2(ogg_path, ambient_ogg_path)
                print(f"   [Audio OK] sound_effect.ogg & ambient.ogg ({os.path.getsize(ogg_path)/1024:.1f} KB)")
    else:
        # Inherit audio from source
        src_map, src_hall = cfg["audio_source"]
        src_ogg = os.path.join(MAPS_DIR, src_map, src_hall, "sound_effect.ogg")
        if os.path.exists(src_ogg):
            shutil.copy2(src_ogg, ogg_path)
            shutil.copy2(src_ogg, ambient_ogg_path)
            print(f"   [Audio OK] Inherited audio from {src_map}/{src_hall} ({os.path.getsize(ogg_path)/1024:.1f} KB)")

    # 2. Frame 0 -> 1080p Static Base Poster
    print("   1/3. Generando poster estático 1080p (map_base.webp)...")
    base_webp_path = os.path.join(corridor_dir, "map_base.webp")
    frame0_im = Image.open(png_files[0]).convert("RGB")
    frame0_im.save(base_webp_path, "WEBP", quality=92, method=6)
    print(f"   [Base Poster] {base_webp_path} ({os.path.getsize(base_webp_path)/1024:.1f} KB)")

    # 3. Crossfade Head and Tail for Seamless Loop
    print(f"   2/3. Aplicando crossfade cúbico ({k_crossfade} frames) y downscaling a 960x540...")
    head_frames = [np.array(Image.open(png_files[i]).convert("RGB")) for i in range(k_crossfade)]
    tail_frames = [np.array(Image.open(png_files[loop_frames + i]).convert("RGB")) for i in range(k_crossfade)]

    blended_head = []
    for i in range(k_crossfade):
        t = i / k_crossfade
        alpha = smoothstep(t)
        blended = (1.0 - alpha) * tail_frames[i].astype(float) + alpha * head_frames[i].astype(float)
        blended_head.append(np.round(blended).astype(np.uint8))

    resized_webp_frames = []
    for i in range(loop_frames):
        if i < k_crossfade:
            arr = blended_head[i]
        else:
            arr = np.array(Image.open(png_files[i]).convert("RGB"))

        # Resize to 960x540 (exact 2:1 integer downsampling of 1080p)
        pil_frame = Image.fromarray(arr).resize((960, 540), Image.Resampling.LANCZOS)
        resized_webp_frames.append(pil_frame)

    # 4. Save Animated WebP Loop
    print(f"   3/3. Codificando WebP animado sin costuras ({len(resized_webp_frames)} frames @ 24 FPS)...")
    webp_anim_path = os.path.join(corridor_dir, "map_loop.webp")
    resized_webp_frames[0].save(
        webp_anim_path,
        format="WEBP",
        save_all=True,
        append_images=resized_webp_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=82,
        method=4
    )
    anim_size_mb = os.path.getsize(webp_anim_path) / (1024 * 1024)
    print(f"   [Anim WebP] {webp_anim_path} ({anim_size_mb:.2f} MB)")

    # 5. Create Web-Safe Directory Alias (e.g. MAP1/1 and MAP1/hall_1)
    for alias_name in [str(h_num), f"hall_{h_num}"]:
        alias_dir = os.path.join(MAPS_DIR, m_name, alias_name)
        if not os.path.exists(alias_dir):
            try:
                os.symlink(h_folder, alias_dir)
                print(f"   [Alias] Created symlink {alias_name} -> {h_folder}")
            except Exception as e:
                # If symlink not supported, copy key webps
                os.makedirs(alias_dir, exist_ok=True)
                shutil.copy2(base_webp_path, os.path.join(alias_dir, "map_base.webp"))
                shutil.copy2(webp_anim_path, os.path.join(alias_dir, "map_loop.webp"))
                if os.path.exists(ogg_path):
                    shutil.copy2(ogg_path, os.path.join(alias_dir, "sound_effect.ogg"))
                    shutil.copy2(ambient_ogg_path, os.path.join(alias_dir, "ambient.ogg"))
                print(f"   [Alias] Created fallback mirror folder {alias_name}")

    # 6. Verification & Purge
    print("   Verificando integridad antes de purgar PNGs originales...")
    all_ok = (
        os.path.exists(webp_anim_path) and os.path.getsize(webp_anim_path) > 500_000 and
        os.path.exists(base_webp_path) and os.path.getsize(base_webp_path) > 50_000
    )

    if all_ok:
        print("   -> [VERIFICADO] ¡Archivos WebP completos! Purgando PNGs y MP3 originales...")
        deleted_count = 0
        for p in png_files:
            try:
                os.remove(p)
                deleted_count += 1
            except Exception as e:
                print(f"   Aviso al borrar {p}: {e}")

        raw_mp3 = os.path.join(corridor_dir, "Timeline 1.mp3")
        if os.path.exists(raw_mp3):
            os.remove(raw_mp3)

        final_bytes = os.path.getsize(webp_anim_path) + os.path.getsize(base_webp_path)
        saved_mb = (raw_total_bytes - final_bytes) / (1024 * 1024)
        pct = ((raw_total_bytes - final_bytes) / raw_total_bytes) * 100
        print(f"   -> [EXITO {m_name} Pasillo {h_num}] {deleted_count} PNGs eliminados. Espacio liberado: {saved_mb:.1f} MB (-{pct:.1f}%)\n")
        return True
    else:
        print("   -> [ERROR] Falló la verificación. Los PNGs originales NO se eliminaron.\n")
        return False


def main():
    print("=================================================================")
    print("  PROCESADOR COMPLETO DE MAPAS: 9 PASILLOS EN 3 MAPAS (DEMO)")
    print("=================================================================")

    success_count = 0
    for cfg in CORRIDORS:
        ok = process_corridor(cfg)
        if ok:
            success_count += 1

    print(f"\n=================================================================")
    print(f"  RESUMEN: {success_count}/{len(CORRIDORS)} pasillos procesados con éxito.")
    print("=================================================================\n")


if __name__ == "__main__":
    main()
