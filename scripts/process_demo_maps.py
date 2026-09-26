#!/usr/bin/env python3
"""
Process and optimize DEMO maps into seamless, infinite looping assets.
- Generates 1080p seamless video loop (MP4 H.264 & WebM VP9).
- Generates 960x540 animated WebP (24 FPS, seamless loop).
- Generates 1080p static base poster (WebP).
- Converts audio to seamless looping OGG Vorbis.
- Purges raw uncompressed PNG sequences and MP3s upon verification.
"""

import os
import sys
import glob
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAPS_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/MAPS")
MAP_NAMES = ["MAP1", "MAP2", "MAP3", "MAP4"]

FPS = 24
FRAME_DURATION_MS = int(round(1000 / FPS))  # 42ms
TOTAL_RAW_FRAMES = 96
K_CROSSFADE = 12  # 0.5s crossfade
L_LOOP_FRAMES = TOTAL_RAW_FRAMES - K_CROSSFADE  # 84 frames = 3.50s
AUDIO_SR = 48000
L_AUDIO_SAMPLES = int(round((L_LOOP_FRAMES / FPS) * AUDIO_SR))  # 168000
K_AUDIO_SAMPLES = int(round((K_CROSSFADE / FPS) * AUDIO_SR))  # 24000


def smoothstep(t):
    """Hermite S-curve for silky smooth visual interpolation."""
    return t * t * (3.0 - 2.0 * t)


def process_audio(map_dir):
    mp3_path = os.path.join(map_dir, "Timeline 1.mp3")
    ogg_path = os.path.join(map_dir, "sound_effect.ogg")
    ambient_ogg_path = os.path.join(map_dir, "ambient.ogg")

    if not os.path.exists(mp3_path):
        print(f"   [Audio] No Timeline 1.mp3 found in {map_dir}, skipping audio.")
        return None

    print(f"   [Audio] Decoding and crossfading ambient audio to {L_LOOP_FRAMES/FPS:.2f}s loop...")
    cmd_dec = [
        "ffmpeg", "-i", mp3_path,
        "-f", "f32le", "-ac", "2", "-ar", str(AUDIO_SR), "pipe:1"
    ]
    p_dec = subprocess.Popen(cmd_dec, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    audio = np.frombuffer(p_dec.stdout.read(), dtype=np.float32).reshape(-1, 2)

    needed_samples = L_AUDIO_SAMPLES + K_AUDIO_SAMPLES
    if len(audio) < needed_samples:
        # Pad with repeat if needed
        audio = np.pad(audio, ((0, needed_samples - len(audio)), (0, 0)), mode="wrap")

    # Equal power crossfade
    t = np.linspace(0, 1, K_AUDIO_SAMPLES, endpoint=False)[:, np.newaxis]
    fade_out = np.cos(t * np.pi / 2.0)
    fade_in = np.sin(t * np.pi / 2.0)

    out_audio = np.copy(audio[:L_AUDIO_SAMPLES])
    tail = audio[L_AUDIO_SAMPLES : L_AUDIO_SAMPLES + K_AUDIO_SAMPLES]
    head = audio[:K_AUDIO_SAMPLES]
    out_audio[:K_AUDIO_SAMPLES] = head * fade_in + tail * fade_out

    # Encode to OGG Vorbis via pipe
    cmd_enc = [
        "ffmpeg", "-y", "-f", "f32le", "-ar", str(AUDIO_SR), "-ac", "2", "-i", "pipe:0",
        "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
        "-metadata", "LOOPSTART=0",
        "-metadata", f"LOOPLENGTH={L_AUDIO_SAMPLES}",
        "-metadata", "TITLE=Realm of the Clouds Ambient Map Sound",
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
        return None

    # Copy to ambient.ogg as well
    if os.path.exists(ogg_path):
        import shutil
        shutil.copy2(ogg_path, ambient_ogg_path)
        print(f"   [Audio OK] sound_effect.ogg generated ({os.path.getsize(ogg_path)/1024:.1f} KB)")
        return ogg_path

    return None


def process_map(map_name):
    map_dir = os.path.join(MAPS_DIR, map_name)
    print(f"\n==================================================")
    print(f"  PROCESANDO {map_name} ({map_dir})")
    print(f"==================================================")

    png_files = sorted(glob.glob(os.path.join(map_dir, "Timeline 1_*.png")))
    if len(png_files) < TOTAL_RAW_FRAMES:
        print(f"Error: Expected {TOTAL_RAW_FRAMES} frames, found {len(png_files)}")
        return False

    raw_total_bytes = sum(os.path.getsize(f) for f in png_files)
    print(f"Fotogramas originales: {len(png_files)} archivos PNG ({raw_total_bytes / (1024*1024):.1f} MB)")

    # 1. Process audio first to have it ready for muxing
    ogg_audio_path = process_audio(map_dir)

    # 2. Pre-load head and tail frames for seamless blending
    print("1/4. Cargando y mezclando fotogramas de transición sin costuras...")
    head_frames = [np.array(Image.open(png_files[i]).convert("RGB")) for i in range(K_CROSSFADE)]
    tail_frames = [np.array(Image.open(png_files[L_LOOP_FRAMES + i]).convert("RGB")) for i in range(K_CROSSFADE)]

    blended_head = []
    for i in range(K_CROSSFADE):
        t = i / K_CROSSFADE
        alpha = smoothstep(t)
        blended = (1.0 - alpha) * tail_frames[i].astype(float) + alpha * head_frames[i].astype(float)
        blended_head.append(np.round(blended).astype(np.uint8))

    # Save Frame 0 as 1080p static base / poster
    base_webp_path = os.path.join(map_dir, "map_base.webp")
    Image.fromarray(blended_head[0]).save(base_webp_path, "WEBP", quality=92, method=6)
    print(f"   [Base Poster] map_base.webp ({os.path.getsize(base_webp_path)/1024:.1f} KB)")

    # 3. Stream 1080p frames into MP4 (H.264) and WebM (VP9)
    print("2/4. Codificando video bucle 1080p (MP4 y WebM)...")
    mp4_path = os.path.join(map_dir, "map_loop.mp4")
    webm_path = os.path.join(map_dir, "map_loop.webm")

    cmd_mp4 = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", "1920x1080", "-pix_fmt", "rgb24", "-r", str(FPS),
        "-i", "-"
    ]
    if ogg_audio_path and os.path.exists(ogg_audio_path):
        cmd_mp4.extend(["-i", ogg_audio_path, "-c:a", "aac", "-b:a", "128k"])
    cmd_mp4.extend([
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
        "-movflags", "+faststart",
        mp4_path
    ])

    cmd_webm = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", "1920x1080", "-pix_fmt", "rgb24", "-r", str(FPS),
        "-i", "-"
    ]
    if ogg_audio_path and os.path.exists(ogg_audio_path):
        cmd_webm.extend(["-i", ogg_audio_path, "-c:a", "libopus", "-b:a", "128k"])
    cmd_webm.extend([
        "-c:v", "libvpx-vp9", "-b:v", "2M", "-crf", "24", "-pix_fmt", "yuv420p",
        webm_path
    ])

    proc_mp4 = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc_webm = subprocess.Popen(cmd_webm, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    resized_webp_frames = []

    for i in range(L_LOOP_FRAMES):
        if i < K_CROSSFADE:
            arr = blended_head[i]
        else:
            arr = np.array(Image.open(png_files[i]).convert("RGB"))

        frame_bytes = arr.tobytes()
        proc_mp4.stdin.write(frame_bytes)
        proc_webm.stdin.write(frame_bytes)

        # Also prepare 960x540 frame for animated WebP
        pil_frame = Image.fromarray(arr).resize((960, 540), Image.Resampling.LANCZOS)
        resized_webp_frames.append(pil_frame)

    proc_mp4.stdin.close()
    proc_mp4.wait()

    proc_webm.stdin.close()
    proc_webm.wait()

    print(f"   [Video MP4] map_loop.mp4 ({os.path.getsize(mp4_path)/(1024*1024):.2f} MB)")
    print(f"   [Video WebM] map_loop.webm ({os.path.getsize(webm_path)/(1024*1024):.2f} MB)")

    # 4. Generate Animated WebP (960x540, 24fps)
    print("3/4. Guardando WebP animado sin costuras (960x540, 24 FPS)...")
    webp_anim_path = os.path.join(map_dir, "map_loop.webp")
    resized_webp_frames[0].save(
        webp_anim_path,
        format="WEBP",
        save_all=True,
        append_images=resized_webp_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=84,
        method=4
    )
    print(f"   [Anim WebP] map_loop.webp ({os.path.getsize(webp_anim_path)/(1024*1024):.2f} MB)")

    # 5. Verification & Cleanup
    print("4/4. Verificando integridad de los archivos...")
    all_ok = (
        os.path.exists(mp4_path) and os.path.getsize(mp4_path) > 500_000 and
        os.path.exists(webm_path) and os.path.getsize(webm_path) > 500_000 and
        os.path.exists(webp_anim_path) and os.path.getsize(webp_anim_path) > 500_000 and
        os.path.exists(base_webp_path) and os.path.getsize(base_webp_path) > 50_000
    )

    if all_ok:
        print("   -> ¡Verificación exitosa! Eliminando archivos PNG y MP3 de sobra...")
        for p in png_files:
            try:
                os.remove(p)
            except Exception as e:
                print(f"   Aviso al borrar {p}: {e}")

        raw_mp3 = os.path.join(map_dir, "Timeline 1.mp3")
        if os.path.exists(raw_mp3):
            os.remove(raw_mp3)

        final_bytes = (
            os.path.getsize(mp4_path) +
            os.path.getsize(webm_path) +
            os.path.getsize(webp_anim_path) +
            os.path.getsize(base_webp_path) +
            (os.path.getsize(ogg_audio_path) if ogg_audio_path else 0)
        )
        saved_mb = (raw_total_bytes - final_bytes) / (1024 * 1024)
        pct = ((raw_total_bytes - final_bytes) / raw_total_bytes) * 100.0
        print(f"   -> [COMPLETADO {map_name}] Espacio liberado: {saved_mb:.1f} MB (-{pct:.1f}%)")
        return True
    else:
        print("   [Error] Algunos archivos no cumplieron los criterios de validación. PNGs preservados.")
        return False


def main():
    print("Iniciando procesamiento de mapas de DEMO...")
    success = []
    for m in MAP_NAMES:
        ok = process_map(m)
        success.append((m, ok))

    print("\n==================================================")
    print("  RESUMEN FINAL DE PROCESAMIENTO DE MAPAS")
    print("==================================================")
    for m, ok in success:
        status = "EXITO (Sin costuras + Optimizado + PNGs borrados)" if ok else "FALLIDO"
        print(f" - {m}: {status}")


if __name__ == "__main__":
    main()
