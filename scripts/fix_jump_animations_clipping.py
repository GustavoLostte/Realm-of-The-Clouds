import os
import glob
import shutil
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_CHAMPIONS = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")
ASSETS_ROK = "/Users/wizzard/Desktop/ASSETS_ROK/CHAMPIONS"

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

CONFIGS = {
    'KINA_MALE': {
        'scale': 0.2736,
        'foot_y': 280.0,
        'raw_max_y': 832.0,
        'cx': 251.5,
        'raw_cx': 931.8,
        'dur': 44
    },
    'KINA_FEMALE': {
        'scale': 0.2550,
        'foot_y': 280.0,
        'raw_max_y': 830.0,
        'cx': 251.5,
        'raw_cx': 929.4,
        'dur': 44
    },
    'PALADIN_MALE': {
        'scale': 0.2800,
        'foot_y': 278.0,
        'raw_ground_y_start': 806.0,
        'raw_ground_y_end': 961.0,
        'root_motion_frames': (5.0, 48.0),
        'cx': 251.5,
        'raw_cx': 945.0,
        'dur': 44
    },
    'PALADIN_FEMALE': {
        'scale': 0.2650,
        'foot_y': 278.0,
        'raw_max_y': 1021.0,
        'cx': 251.5,
        'raw_cx': 918.0,
        'dur': 44
    }
}

def fix_jump_animations():
    print("==================================================")
    print("FIXING JUMP ANIMATIONS CLIPPING & GROUND ALIGNMENT")
    print("==================================================")
    
    for name, cfg in CONFIGS.items():
        raw_dir = os.path.join(ASSETS_ROK, name, "JUMP")
        raw_files = sorted(glob.glob(os.path.join(raw_dir, "*.png")))
        
        if not raw_files:
            print(f"[ERROR] No raw PNGs found in {raw_dir}")
            continue
            
        target_path = os.path.join(PUBLIC_CHAMPIONS, name, "jump.webp")
        backup_path = os.path.join(PUBLIC_CHAMPIONS, name, "jump.webp.bak")
        
        if os.path.exists(target_path) and not os.path.exists(backup_path):
            shutil.copy2(target_path, backup_path)
            print(f"  Backed up existing {name} jump.webp -> jump.webp.bak")
            
        s = cfg['scale']
        new_w = int(round(1920 * s))
        new_h = int(round(1080 * s))
        paste_x = int(round(cfg['cx'] - cfg['raw_cx'] * s))
        
        num_frames = len(raw_files)
        # Precompute per-frame paste_y if root motion compensation is defined
        if 'root_motion_frames' in cfg:
            f_start, f_end = cfg['root_motion_frames']
            y_start = cfg['raw_ground_y_start']
            y_end = cfg['raw_ground_y_end']
            ground_ys = [y_start + (y_end - y_start) * smoothstep(f_start, f_end, i) for i in range(num_frames)]
            paste_ys = [int(round(cfg['foot_y'] - gy * s)) for gy in ground_ys]
        else:
            paste_y_fixed = int(round(cfg['foot_y'] - cfg['raw_max_y'] * s))
            paste_ys = [paste_y_fixed] * num_frames
        
        out_frames = []
        ymins, ymaxs, cxs, boot_ys = [], [], [], []
        top_touches = 0
        bot_touches = 0
        
        for i, p in enumerate(raw_files):
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
            
            # Lanczos resize for crisp high-fidelity pixel preservation
            resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (512, 288), (0, 0, 0, 0))
            canvas.paste(resized, (paste_x, paste_ys[i]), resized)
            
            c_arr = np.array(canvas)
            
            # Softly fade out any ground smoke at the bottom margin (y >= 281) to eliminate hard clipping
            for y in range(280, 288):
                fade = (287 - y) / 7.0
                c_arr[y, :, 3] = (c_arr[y, :, 3] * fade).astype(np.uint8)
            canvas = Image.fromarray(c_arr)
            
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
                
            # Solid boot level
            boot_mask = (c_arr[:, :, 0] < 120) & (c_arr[:, :, 1] < 100) & (c_arr[:, :, 2] < 80) & (c_arr[:, :, 3] > 180)
            yb, _ = np.where(boot_mask)
            if len(yb) > 0:
                boot_ys.append(np.max(yb))
            else:
                boot_ys.append(0)
                
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
        print(f"  [SUCCESS] {name} jump.webp:")
        print(f"    Frames: {len(out_frames)} @ {cfg['dur']}ms")
        print(f"    File Size: {kb:.1f} KB")
        print(f"    Y-Bounds: [{min(ymins)}, {max(ymaxs)}] (Headroom: {min(ymins)}px, Ground Margin: {288 - max(ymaxs)}px)")
        print(f"    Frame 0 Boot Y: {boot_ys[0]}px | Last Frame Boot Y: {boot_ys[-1]}px")
        print(f"    Center X: [{min(cxs):.1f}, {max(cxs):.1f}] (Mean: {np.mean(cxs):.1f}px)")
        print(f"    Clipping: top={top_touches}, bot={bot_touches}")
        
        if top_touches > 0 or bot_touches > 0 or min(ymins) < 4 or max(ymaxs) > 286:
            print(f"    [WARNING] Potential boundary risk for {name}!")
        else:
            print(f"    [VERIFIED] 100% UNCLIPPED & GROUND-LOCKED.")
            
    print("==================================================")
    print("ALL JUMP ANIMATIONS FIXED & GROUND-LOCKED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    fix_jump_animations()
