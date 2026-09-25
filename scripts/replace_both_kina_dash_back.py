import os
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHAMPIONS_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")

TARGET_SIZE = (512, 288)
TOTAL_DURATION_MS = 500

CONFIGS = {
    "KINA_MALE": {
        "src_dir": os.path.join(CHAMPIONS_DIR, "KINA_MALE/DASH_BACK2 copy"),
        "target_webp": os.path.join(CHAMPIONS_DIR, "KINA_MALE/dash_back.webp"),
        "backup_webp": os.path.join(CHAMPIONS_DIR, "KINA_MALE/dash_back.webp.bak2"),
        "scale": 191.0 / 536.0,
        "target_foot_y": 278.0,
        "idle_cx": 250.5,
        "raw_ground_y": 804.0,
    },
    "KINA_FEMALE": {
        "src_dir": os.path.join(CHAMPIONS_DIR, "KINA_FEMALE/DASH_BACK2"),
        "target_webp": os.path.join(CHAMPIONS_DIR, "KINA_FEMALE/dash_back.webp"),
        "backup_webp": os.path.join(CHAMPIONS_DIR, "KINA_FEMALE/dash_back.webp.bak"),
        "scale": 182.0 / 547.0,
        "target_foot_y": 279.0,
        "idle_cx": 252.0,
        "raw_ground_y": 804.0,
    }
}

def process_champion_dash_back(champ_name, cfg):
    print(f"\n==================================================")
    print(f"PROCESSING DASH BACK FOR {champ_name}")
    print(f"==================================================")
    
    src_dir = cfg["src_dir"]
    if not os.path.isdir(src_dir):
        print(f"[ERROR] Source directory not found: {src_dir}")
        return False
        
    png_files = sorted(glob.glob(os.path.join(src_dir, "*.png")))
    if not png_files:
        print(f"[ERROR] No PNG files found in {src_dir}")
        return False
        
    print(f"Found {len(png_files)} PNG frames in {src_dir}")
    
    target_webp = cfg["target_webp"]
    backup_webp = cfg["backup_webp"]
    
    if os.path.exists(target_webp) and not os.path.exists(backup_webp):
        shutil.copy2(target_webp, backup_webp)
        print(f"  Backed up existing dash_back.webp -> {os.path.basename(backup_webp)}")
        
    s = cfg["scale"]
    new_w = int(round(1920 * s))
    new_h = int(round(1080 * s))
    paste_y = int(round(cfg["target_foot_y"] - cfg["raw_ground_y"] * s))
    
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
        y_ht, x_ht = np.where((arr[:, :, 3] > 100) & (np.arange(1080)[:, None] > 200) & (np.arange(1080)[:, None] < 700))
        if len(x_ht):
            raw_cx = float(x_ht.min() + x_ht.max()) / 2.0
        else:
            y_all, x_all = np.where(arr[:, :, 3] > 40)
            raw_cx = float(x_all.min() + x_all.max()) / 2.0 if len(x_all) else 929.0
            
        cleaned = Image.fromarray(arr)
        resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center character body at idle_cx
        paste_x = int(round(cfg["idle_cx"] - raw_cx * s))
        
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

def main():
    print("==================================================")
    print("REPLACING DASH BACK FOR BOTH KINA FEMALE & MALE")
    print("==================================================")
    for champ_name, cfg in CONFIGS.items():
        process_champion_dash_back(champ_name, cfg)
    print("\n[SUCCESS] Both Kina Female and Male dash_back animations successfully updated!")

if __name__ == "__main__":
    main()
