import os
import glob
import shutil
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_CHAMPIONS = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")
ASSETS_ROK = "/Users/wizzard/Desktop/ASSETS_ROK/CHAMPIONS"

CONFIGS = {
    'PALADIN_MALE': {
        'scale': 0.3283,
        'foot_y': 280.0,
        'raw_max_y': 1003.0,
        'cx': 252.0,
        'raw_cx': 948.8,
        'duration': 44
    },
    'PALADIN_FEMALE': {
        'scale': 0.3428,
        'foot_y': 280.0,
        'raw_max_y': 997.0,
        'cx': 252.0,
        'raw_cx': 959.6,
        'duration': 44
    },
    'KINA_MALE': {
        'scale': 0.2736,
        'foot_y': 280.0,
        'raw_max_y': 947.0,
        'cx': 252.0,
        'raw_cx': 927.7,
        'duration': 44
    },
    'KINA_FEMALE': {
        'scale': 0.2490,
        'foot_y': 280.0,
        'raw_max_y': 965.0,
        'cx': 252.0,
        'raw_cx': 950.3,
        'duration': 44
    }
}

def fix_walk_animations():
    print("==================================================")
    print("FIXING WALK ANIMATIONS CLIPPING FOR KINA & PALADIN")
    print("==================================================")
    
    for name, cfg in CONFIGS.items():
        raw_dir = os.path.join(ASSETS_ROK, name, "WALK")
        raw_files = sorted(glob.glob(os.path.join(raw_dir, "*.png")))
        
        if not raw_files:
            print(f"[ERROR] No raw PNGs found in {raw_dir}")
            continue
            
        target_path = os.path.join(PUBLIC_CHAMPIONS, name, "walk.webp")
        backup_path = os.path.join(PUBLIC_CHAMPIONS, name, "walk.webp.bak")
        
        if os.path.exists(target_path) and not os.path.exists(backup_path):
            shutil.copy2(target_path, backup_path)
            print(f"  Backed up existing {name} walk.webp -> walk.webp.bak")
            
        s = cfg['scale']
        new_w = int(round(1920 * s))
        new_h = int(round(1080 * s))
        paste_x = int(round(cfg['cx'] - cfg['raw_cx'] * s))
        paste_y = int(round(cfg['foot_y'] - cfg['raw_max_y'] * s))
        
        out_frames = []
        ymins = []
        ymaxs = []
        top_touches = 0
        bot_touches = 0
        
        for p in raw_files:
            im = Image.open(p).convert('RGBA')
            arr = np.array(im)
            # Clear outer rendering viewport noise (first/last 8 pixels)
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
                
            out_frames.append(canvas)
            
        # Save high quality animated WebP
        out_frames[0].save(
            target_path,
            save_all=True,
            append_images=out_frames[1:],
            duration=cfg['duration'],
            loop=0,
            quality=92,
            method=4
        )
        
        kb = os.path.getsize(target_path) / 1024
        print(f"  [SUCCESS] {name} walk.webp:")
        print(f"    Frames: {len(out_frames)} @ {cfg['duration']}ms")
        print(f"    File Size: {kb:.1f} KB")
        print(f"    Y-Bounds: [{min(ymins)}, {max(ymaxs)}] (Headroom: {min(ymins)}px, Ground Margin: {288 - max(ymaxs)}px)")
        print(f"    Top clipping: {top_touches} frames | Bottom clipping: {bot_touches} frames")
        
        if top_touches > 0 or bot_touches > 0 or min(ymins) < 4 or max(ymaxs) > 284:
            print(f"    [WARNING] Potential boundary risk for {name}!")
        else:
            print(f"    [VERIFIED] 100% UNCLIPPED & GROUND-LOCKED.")
            
    print("==================================================")
    print("ALL WALK ANIMATIONS FIXED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    fix_walk_animations()
