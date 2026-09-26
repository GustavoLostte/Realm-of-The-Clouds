import os
import glob
import numpy as np
from PIL import Image

KAEL_SRC = '/Users/wizzard/Desktop/ASSETS_ROK/heroes/kael'
MALAKOR_SRC = '/Users/wizzard/Desktop/ASSETS_ROK/heroes/Malakor'
OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets/champions'))

os.makedirs(OUT_DIR, exist_ok=True)

def process_champion(src_dir, name, target_height=520, step=1, quality=78, delay_ms=42):
    print(f"--- Processing {name} ---")
    files = sorted(glob.glob(os.path.join(src_dir, '*.png')))
    print(f"Total raw frames: {len(files)}")
    
    # Step down frames if needed
    sampled_files = files[::step]
    print(f"Sampled frames: {len(sampled_files)} (step={step})")
    
    # Find overall bounding box across sampled frames
    min_x, min_y, max_x, max_y = 9999, 9999, 0, 0
    
    # Check a few frames to get robust union bbox
    for f in sampled_files[::max(1, len(sampled_files)//10)]:
        im = Image.open(f)
        arr = np.array(im)
        alpha = arr[:, :, 3] > 15
        if np.any(alpha):
            coords = np.argwhere(alpha)
            y0, x0 = coords.min(axis=0)
            y1, x1 = coords.max(axis=0)
            min_x = min(min_x, x0)
            min_y = min(min_y, y0)
            max_x = max(max_x, x1)
            max_y = max(max_y, y1)
            
    # Add a little padding
    pad = 12
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(1920, max_x + pad)
    max_y = min(1080, max_y + pad)
    bbox = (min_x, min_y, max_x, max_y)
    print(f"Union BBox: {bbox}, W: {max_x - min_x}, H: {max_y - min_y}")
    
    # Process frames
    processed = []
    aspect = (max_x - min_x) / float(max_y - min_y)
    target_width = int(target_height * aspect)
    
    for i, f in enumerate(sampled_files):
        im = Image.open(f).convert('RGBA')
        cropped = im.crop(bbox)
        resized = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
        processed.append(resized)
        
    out_anim = os.path.join(OUT_DIR, f"{name}_idle.webp")
    out_poster = os.path.join(OUT_DIR, f"{name}_poster.webp")
    out_avatar = os.path.join(OUT_DIR, f"{name}_avatar.webp")
    
    # Save static poster
    processed[0].save(out_poster, 'WEBP', quality=90)
    
    # Save headshot/bust avatar (top 35% of the frame)
    avatar_crop_h = int(target_height * 0.42)
    avatar_crop_w = int(target_width * 0.55)
    avatar_left = (target_width - avatar_crop_w) // 2
    avatar_im = processed[0].crop((avatar_left, 10, avatar_left + avatar_crop_w, 10 + avatar_crop_h))
    avatar_im.resize((160, 160), Image.Resampling.LANCZOS).save(out_avatar, 'WEBP', quality=85)
    
    # Save animated WebP with infinite loop
    print(f"Encoding animated WebP: {out_anim}...")
    processed[0].save(
        out_anim,
        save_all=True,
        append_images=processed[1:],
        duration=delay_ms,
        loop=0,
        quality=quality,
        method=5
    )
    
    size_kb = os.path.getsize(out_anim) / 1024.0
    print(f"Finished {name}! Anim size: {size_kb:.1f} KB | Poster: {os.path.getsize(out_poster)/1024.0:.1f} KB | Avatar: {os.path.getsize(out_avatar)/1024.0:.1f} KB\n")

if __name__ == '__main__':
    # Malakor has 37 frames: keep all 37 frames (step=1) at 24fps (~42ms)
    process_champion(MALAKOR_SRC, 'malakor', target_height=480, step=1, quality=78, delay_ms=42)
    
    # Kael has 88 frames: sample every 2nd frame = 44 frames at ~24fps (~46ms) to keep size under 2MB for mobile!
    process_champion(KAEL_SRC, 'kael', target_height=480, step=2, quality=78, delay_ms=46)
