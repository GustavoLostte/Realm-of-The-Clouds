import os
import glob
import shutil
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_CHAMPIONS = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")
ASSETS_ROK = "/Users/wizzard/Desktop/ASSETS_ROK/CHAMPIONS"

CONFIGS = {
    'KINA_MALE': {
        'scale': 0.2997,
        'foot_y': 278.0,
        'raw_max_y': 942.0,
        'cx': 251.5,
        'raw_cx': 911.3,
        'dur': 44
    },
    'KINA_FEMALE': {
        'scale': 0.2848,
        'foot_y': 279.0,
        'raw_max_y': 942.0,
        'cx': 251.5,
        'raw_cx': 907.5,
        'dur': 44
    },
    'PALADIN_MALE': {
        'scale': 0.3680,
        'foot_y': 279.0,
        'raw_max_y': 974.0,
        'cx': 251.5,
        'raw_cx': 919.0,
        'dur': 44
    },
    'PALADIN_FEMALE': {
        'scale': 0.4207,
        'foot_y': 279.0,
        'raw_max_y': 882.0,
        'cx': 251.5,
        'raw_cx': 932.5,
        'dur': 44
    }
}

def fix_run_animations():
    print("==================================================")
    print("FIXING RUN ANIMATIONS ALIGNMENT FOR KINA & PALADIN")
    print("==================================================")
    
    for name, cfg in CONFIGS.items():
        raw_dir = os.path.join(ASSETS_ROK, name, "RUN")
        raw_files = sorted(glob.glob(os.path.join(raw_dir, "*.png")))
        
        if not raw_files:
            print(f"[ERROR] No raw PNGs found in {raw_dir}")
            continue
            
        target_path = os.path.join(PUBLIC_CHAMPIONS, name, "run.webp")
        backup_path = os.path.join(PUBLIC_CHAMPIONS, name, "run.webp.bak")
        
        if os.path.exists(target_path) and not os.path.exists(backup_path):
            shutil.copy2(target_path, backup_path)
            print(f"  Backed up existing {name} run.webp -> run.webp.bak")
            
        s = cfg['scale']
        new_w = int(round(1920 * s))
        new_h = int(round(1080 * s))
        paste_x = int(round(cfg['cx'] - cfg['raw_cx'] * s))
        paste_y = int(round(cfg['foot_y'] - cfg['raw_max_y'] * s))
        
        out_frames = []
        ymins, ymaxs, cxs = [], [], []
        top_touches = 0
        bot_touches = 0
        
        for p in raw_files:
            im = Image.open(p).convert('RGBA')
            arr = np.array(im)
            # Clear outer rendering viewport noise
            arr[:8, :, 3] = 0
            arr[-8:, :, 3] = 0
            arr[:, :8, 3] = 0
            arr[:, -8:, 3] = 0
            # Remove low alpha noise
            arr[arr[:, :, 3] <= 15, 3] = 0
            cleaned = Image.fromarray(arr)
            
            # Lanczos resize for crisp pixel preservation
            resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (512, 288), (0, 0, 0, 0))
            canvas.paste(resized, (paste_x, paste_y), resized)
            
            c_arr = np.array(canvas)
            a = c_arr[:, :, 3]
            if np.any(a[0, :] > 10):
                top_touches += 1
            if np.any(a[-1, :] > 10):
                bot_touches += 1
                
            y_idx, x_idx = np.where(a > 30)
            if len(y_idx) > 0:
                ymins.append(np.min(y_idx))
                ymaxs.append(np.max(y_idx))
                cxs.append((np.min(x_idx) + np.max(x_idx)) / 2.0)
                
            out_frames.append(canvas)
            
        # Save high quality animated WebP
        out_frames[0].save(
            target_path,
            save_all=True,
            append_images=out_frames[1:],
            duration=cfg['dur'],
            loop=0,
            quality=92,
            method=4
        )
        
        kb = os.path.getsize(target_path) / 1024
        print(f"  [SUCCESS] {name} run.webp:")
        print(f"    Frames: {len(out_frames)} @ {cfg['dur']}ms")
        print(f"    File Size: {kb:.1f} KB")
        print(f"    Foot Y range: [{min(ymaxs)}, {max(ymaxs)}] (Ground line contact: {max(ymaxs)}px)")
        print(f"    Head Y range: [{min(ymins)}, {max(ymins)}] (Headroom: {min(ymins)}px)")
        print(f"    Center X: [{min(cxs):.1f}, {max(cxs):.1f}] (Mean: {np.mean(cxs):.1f}px)")
        print(f"    Clipping: top={top_touches}, bot={bot_touches}")
        
    print("==================================================")
    print("ALL RUN ANIMATIONS ALIGNED & RECENTERED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    fix_run_animations()
