#!/usr/bin/env python3
"""
Sync Attack and Combat Animation Speeds to Dash Speed (14ms/frame, ~70 FPS).
Modifies:
1. WebP ANMF frame durations in place (lossless binary patch, 0 recompression).
2. Audio OGG Vorbis playback speed via ffmpeg atempo (3.0x speed).
Target champions: KINA_MALE, KINA_FEMALE.
"""

import os
import struct
import subprocess

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHAMPIONS_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")

CHAMPIONS = ["KINA_MALE", "KINA_FEMALE"]
ATTACK_FILES = [
    "attack1.webp",
    "attack1_1.webp",
    "attack1_2.webp",
    "attack1_3.webp",
    "attack2.webp",
    "attack2_1.webp",
    "special.webp",
    "special2.webp",
    "defend.webp",
]

SOUND_FILES = [
    "attack1.ogg",
    "attack1_1.ogg",
    "attack1_2.ogg",
    "attack1_3.ogg",
    "attack2.ogg",
    "attack2_1.ogg",
    "special.ogg",
    "special2.ogg",
    "defend.ogg",
]

TARGET_FRAME_MS = 14  # Exact frame speed of dash_front (~71.4 FPS)


def patch_webp_frame_durations(path, new_duration_ms=TARGET_FRAME_MS):
    """Directly modify ANMF chunk duration in WebP binary without re-encoding pixels."""
    if not os.path.exists(path):
        return False, 0, 0
    with open(path, "rb") as f:
        data = bytearray(f.read())

    pos = 12
    count = 0
    while pos < len(data):
        fourcc = data[pos:pos+4]
        size = struct.unpack("<I", data[pos+4:pos+8])[0]
        if fourcc == b"ANMF":
            dur_pos = pos + 8 + 12
            b0 = new_duration_ms & 0xFF
            b1 = (new_duration_ms >> 8) & 0xFF
            b2 = (new_duration_ms >> 16) & 0xFF
            data[dur_pos] = b0
            data[dur_pos + 1] = b1
            data[dur_pos + 2] = b2
            count += 1
        pos += 8 + size + (size & 1)

    with open(path, "wb") as f:
        f.write(data)

    total_ms = count * new_duration_ms
    return True, count, total_ms


def speedup_audio(path, speedup_factor=3.0):
    """Speed up audio with ffmpeg atempo filter and save back to path."""
    if not os.path.exists(path):
        return False
    tmp_path = path + ".tmp.ogg"
    
    # atempo supports max 2.0 per filter, chain them for 3.0: 2.0 * 1.5 = 3.0
    cmd = [
        "ffmpeg", "-y", "-i", path,
        "-filter:a", "atempo=2.0,atempo=1.5",
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
        tmp_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if res.returncode == 0 and os.path.exists(tmp_path):
        os.replace(tmp_path, path)
        return True
    return False


def main():
    print("==================================================")
    print(f"  SINCRONIZANDO VELOCIDAD DE ATAQUES A DASH ({TARGET_FRAME_MS}ms/frame)")
    print("==================================================")

    for champ in CHAMPIONS:
        print(f"\n--- Campeón: {champ} ---")
        champ_dir = os.path.join(CHAMPIONS_DIR, champ)
        sounds_dir = os.path.join(champ_dir, "sounds")

        # 1. Patch WebP animations
        for f in ATTACK_FILES:
            webp_path = os.path.join(champ_dir, f)
            ok, frames, total_ms = patch_webp_frame_durations(webp_path, TARGET_FRAME_MS)
            if ok:
                print(f"  [WEBP OK] {f:<15}: {frames:3d} frames -> {total_ms:5d} ms ({total_ms/1000:.2f}s)")
            else:
                print(f"  [SKIP] {f} no encontrado")

        # 2. Speed up audio
        for s in SOUND_FILES:
            sound_path = os.path.join(sounds_dir, s)
            ok = speedup_audio(sound_path, 3.0)
            if ok:
                # Get new duration
                res = subprocess.run(
                    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", sound_path],
                    capture_output=True, text=True
                )
                dur = float(res.stdout.strip() or 0)
                print(f"  [AUDIO OK] {s:<15}: nueva duración = {dur:.2f}s ({int(dur*1000)}ms)")
            else:
                print(f"  [SKIP] {s} no encontrado")

    print("\n[OK] Todas las animaciones de ataque y sonidos han sido acelerados.")


if __name__ == "__main__":
    main()
