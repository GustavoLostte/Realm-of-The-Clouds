import os
import glob
import subprocess
from PIL import Image
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/assets/champions/Valiria"))
SOUNDS_DIR = os.path.join(BASE_DIR, "sounds")
os.makedirs(SOUNDS_DIR, exist_ok=True)

TARGET_SIZE = (512, 288)

def clean_and_resize_frame(img_path):
    im = Image.open(img_path).convert("RGBA")
    arr = np.array(im)
    # Threshold slight noise or matte fringing at <= 15 alpha
    mask = arr[:, :, 3] <= 15
    arr[mask, 3] = 0
    cleaned = Image.fromarray(arr)
    # High-quality Lanczos resize to standard 512x288
    return cleaned.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

def save_animated_webp(frame_paths, out_path, frame_duration_ms=42, loop=0, quality=84):
    print(f"Generating {os.path.basename(out_path)} from {len(frame_paths)} frames...")
    frames = []
    for p in frame_paths:
        frames.append(clean_and_resize_frame(p))
    
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=frame_duration_ms,
        loop=loop,
        quality=quality,
        method=4
    )
    kb = os.path.getsize(out_path) / 1024
    print(f"  -> Saved {out_path} ({kb:.1f} KB, {len(frames)} frames @ {frame_duration_ms}ms)")
    return out_path

def concat_mp3s(input_mp3s, out_mp3):
    if not input_mp3s:
        return
    if len(input_mp3s) == 1:
        cmd = ["ffmpeg", "-y", "-i", input_mp3s[0], "-c", "copy", out_mp3]
    else:
        # Create concat demuxer file
        concat_list = os.path.join(SOUNDS_DIR, "_concat_temp.txt")
        with open(concat_list, "w") as f:
            for mp3 in input_mp3s:
                f.write(f"file '{os.path.abspath(mp3)}'\n")
        cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list, "-c:a", "libmp3lame", "-q:a", "2", out_mp3]
    
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(os.path.join(SOUNDS_DIR, "_concat_temp.txt")):
        os.remove(os.path.join(SOUNDS_DIR, "_concat_temp.txt"))
    print(f"  -> Audio created: {os.path.basename(out_mp3)} ({os.path.getsize(out_mp3)/1024:.1f} KB)")

def run_pipeline():
    print("==================================================")
    print("STARTING VALIRIA COMBAT ANIMATION PIPELINE")
    print("==================================================")

    # 1. ATTACK 1 (Lanza Celestial - Combo de Lanza 3 Golpes)
    atk1_f1 = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/atack_1/1/*.png")))
    atk1_f2 = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/atack_1/2/*.png")))
    atk1_f3 = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/atack_1/3/*.png")))
    atk1_frames = atk1_f1 + atk1_f2 + atk1_f3
    
    # 46 frames total, ~45ms/frame -> ~2070ms total duration
    save_animated_webp(atk1_frames, os.path.join(BASE_DIR, "attack1.webp"), frame_duration_ms=45, loop=0)
    
    # Also save individual attack1 stages for precision combo branching
    save_animated_webp(atk1_f1, os.path.join(BASE_DIR, "attack1_1.webp"), frame_duration_ms=45, loop=0)
    save_animated_webp(atk1_f2, os.path.join(BASE_DIR, "attack1_2.webp"), frame_duration_ms=48, loop=0)
    save_animated_webp(atk1_f3, os.path.join(BASE_DIR, "attack1_3.webp"), frame_duration_ms=45, loop=0)

    # Audio for Attack 1
    concat_mp3s([
        os.path.join(BASE_DIR, "attacks/atack_1/1/Timeline 1.mp3"),
        os.path.join(BASE_DIR, "attacks/atack_1/2/Timeline 1.mp3"),
        os.path.join(BASE_DIR, "attacks/atack_1/3/Timeline 1.mp3")
    ], os.path.join(SOUNDS_DIR, "attack1.mp3"))

    # 2. ATTACK 2 (Combo de Patadas - 2 Golpes)
    atk2_f1 = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/attack_2/1/*.png")))
    atk2_f2 = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/attack_2/2/*.png")))
    atk2_frames = atk2_f1 + atk2_f2
    # 29 frames total: 13 frames @ 46ms (~600ms) + 16 frames @ 45ms (~720ms) = 1320ms
    save_animated_webp(atk2_frames, os.path.join(BASE_DIR, "attack2.webp"), frame_duration_ms=45, loop=0)

    concat_mp3s([
        os.path.join(BASE_DIR, "attacks/attack_2/1/kick1.mp3"),
        os.path.join(BASE_DIR, "attacks/attack_2/2/block.mp3")
    ], os.path.join(SOUNDS_DIR, "attack2.mp3"))

    # 3. SPECIAL 1 / HABILIDAD 1 (Espadazo/Lanzazo Celestial con Arco de Luz)
    hab1_frames = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/habilidades/1/*.png")))
    # 78 frames @ 43ms = ~3354ms (audio exact: 3384ms)
    save_animated_webp(hab1_frames, os.path.join(BASE_DIR, "special.webp"), frame_duration_ms=43, loop=0)
    
    hab1_mp3s = glob.glob(os.path.join(BASE_DIR, "attacks/habilidades/1/*.mp3"))
    if hab1_mp3s:
        concat_mp3s([hab1_mp3s[0]], os.path.join(SOUNDS_DIR, "special.mp3"))
        concat_mp3s([hab1_mp3s[0]], os.path.join(SOUNDS_DIR, "special1.mp3"))

    # 4. SPECIAL 2 / HABILIDAD 2 (Estocada Sísmica / Diving Celestial)
    hab2_frames = sorted(glob.glob(os.path.join(BASE_DIR, "attacks/habilidades/2/*.png")))
    # 77 frames @ 42ms = ~3234ms (audio exact: 3264ms)
    save_animated_webp(hab2_frames, os.path.join(BASE_DIR, "special2.webp"), frame_duration_ms=42, loop=0)

    hab2_mp3s = glob.glob(os.path.join(BASE_DIR, "attacks/habilidades/2/*.mp3"))
    if hab2_mp3s:
        concat_mp3s([hab2_mp3s[0]], os.path.join(SOUNDS_DIR, "special2.mp3"))

    # 5. DEFEND PARADO (Bloqueo / Guardia de Pie)
    def_parado_frames = sorted(glob.glob(os.path.join(BASE_DIR, "defend/cubrirse parado/*.png")))
    # 28 frames @ 42ms = ~1176ms
    save_animated_webp(def_parado_frames, os.path.join(BASE_DIR, "defend.webp"), frame_duration_ms=42, loop=0)

    # 6. DEFEND AGACHADO (Bloqueo Agachada)
    def_agachado_frames = sorted(glob.glob(os.path.join(BASE_DIR, "defend/cubrirse agachado/*.png")))
    # 32 frames @ 42ms = ~1344ms
    save_animated_webp(def_agachado_frames, os.path.join(BASE_DIR, "defend_down.webp"), frame_duration_ms=42, loop=0)

    # Audio for defend
    block_mp3 = os.path.join(BASE_DIR, "attacks/attack_2/2/block.mp3")
    if os.path.exists(block_mp3):
        concat_mp3s([block_mp3], os.path.join(SOUNDS_DIR, "defend.mp3"))

    print("\n==================================================")
    print("ALL WEBP ANIMATIONS AND AUDIOS SUCCESSFULLY CREATED!")
    print("==================================================")

if __name__ == "__main__":
    run_pipeline()
