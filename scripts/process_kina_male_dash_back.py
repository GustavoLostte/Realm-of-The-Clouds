import os
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KINA_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS/KINA_MALE")
DASH_BACK2_DIR = os.path.join(KINA_DIR, "DASH_BACK2")
SOUNDS_DIR = os.path.join(KINA_DIR, "sounds")

TARGET_SIZE = (512, 288)
TOTAL_DURATION_MS = 500
SCALE = 0.236
FOOT_Y_TARGET = 278.0
RAW_GROUND_Y = 1021.0
IDLE_CX = 251.0

def process_dash_back():
    print("==================================================")
    print("PROCESSING NEW DASH_BACK2 FOR KINA_MALE")
    print("==================================================")
    
    png_files = sorted(glob.glob(os.path.join(DASH_BACK2_DIR, "*.png")))
    if not png_files:
        print(f"[ERROR] No PNG files found in {DASH_BACK2_DIR}")
        return False
        
    print(f"Found {len(png_files)} PNG frames in {DASH_BACK2_DIR}")
    
    target_webp = os.path.join(KINA_DIR, "dash_back.webp")
    backup_webp = os.path.join(KINA_DIR, "dash_back.webp.bak")
    
    if os.path.exists(target_webp) and not os.path.exists(backup_webp):
        shutil.copy2(target_webp, backup_webp)
        print(f"  Backed up existing dash_back.webp -> dash_back.webp.bak")
        
    new_w = int(round(1920 * SCALE))
    new_h = int(round(1080 * SCALE))
    paste_y = int(round(FOOT_Y_TARGET - RAW_GROUND_Y * SCALE))
    
    out_frames = []
    
    for i, p in enumerate(png_files):
        im = Image.open(p).convert("RGBA")
        arr = np.array(im)
        
        # Clear outer rendering boundary noise
        arr[:8, :, 3] = 0
        arr[-8:, :, 3] = 0
        arr[:, :8, 3] = 0
        arr[:, -8:, 3] = 0
        arr[arr[:, :, 3] <= 15, 3] = 0
        
        # Calculate clean head + torso center of mass
        y_ht, x_ht = np.where((arr[:, :, 3] > 140) & (np.arange(1080)[:, None] > 200) & (np.arange(1080)[:, None] < 700))
        if len(x_ht):
            raw_cx = float(x_ht.min() + x_ht.max()) / 2.0
        else:
            y_all, x_all = np.where(arr[:, :, 3] > 40)
            raw_cx = float(x_all.min() + x_all.max()) / 2.0 if len(x_all) else 960.0
            
        cleaned = Image.fromarray(arr)
        resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center character body at IDLE_CX
        paste_x = int(round(IDLE_CX - raw_cx * SCALE))
        
        canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        canvas.paste(resized, (paste_x, paste_y), resized)
        out_frames.append(canvas)
        
    n = len(out_frames)
    base = TOTAL_DURATION_MS // n
    rem = TOTAL_DURATION_MS % n
    durations = [base + (1 if i < rem else 0) for i in range(n)]
    
    print(f"  Saving animated WebP ({n} frames, total duration {sum(durations)}ms)...")
    out_frames[0].save(
        target_webp,
        save_all=True,
        append_images=out_frames[1:],
        duration=durations,
        loop=0,
        quality=92,
        method=4
    )
    
    file_size_kb = os.path.getsize(target_webp) / 1024
    print(f"  [OK] Saved {target_webp} ({file_size_kb:.1f} KB)")
    
    # Process audio if Timeline 1.mp3 exists
    mp3_path = os.path.join(DASH_BACK2_DIR, "Timeline 1.mp3")
    if os.path.exists(mp3_path):
        target_ogg = os.path.join(SOUNDS_DIR, "dash_back.ogg")
        backup_ogg = os.path.join(SOUNDS_DIR, "dash_back.ogg.bak")
        if os.path.exists(target_ogg) and not os.path.exists(backup_ogg):
            shutil.copy2(target_ogg, backup_ogg)
            print(f"  Backed up existing dash_back.ogg -> dash_back.ogg.bak")
            
        cmd = [
            "ffmpeg", "-y", "-i", mp3_path,
            "-c:a", "vorbis", "-strict", "-2",
            "-q:a", "3",
            target_ogg
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            ogg_kb = os.path.getsize(target_ogg) / 1024
            print(f"  [OK] Converted and updated {target_ogg} ({ogg_kb:.1f} KB)")
        except Exception as e:
            print(f"  [WARN] Failed to convert audio: {e}")
            
    # Verification with webpinfo
    try:
        res = subprocess.run(["webpinfo", target_webp], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        actual_total = sum(durs)
        print(f"  [VERIFY] webpinfo total duration: {actual_total}ms across {len(durs)} frames")
    except Exception as e:
        print(f"  [WARN] webpinfo check skipped: {e}")
        
    return True

if __name__ == "__main__":
    process_dash_back()
