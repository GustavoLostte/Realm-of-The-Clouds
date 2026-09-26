import os
import glob
import numpy as np
from PIL import Image

BASE_STARTER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets/champions/starter'))
CHAMPIONS_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets/champions'))

TARGET_SIZE = (512, 288) # Standard 16:9 combat canvas

# Head centers on 1920x1080 canvas for ultra-crisp avatar framing
HEAD_CENTERS = {
    'KINA_FEMALE': (830, 260),
    'Kina_male': (832, 275),
    'archert_female': (960, 330),
    'archert_male': (990, 330),
    'mage_female': (817, 326),
    'mage_male': (750, 330),
}

CONFIGS = [
    {
        'folder': 'Kina_male',
        'champ_id': 'knight_male',
        'step': 1,
        'duration_ms': 42,
        'quality': 82,
    },
    {
        'folder': 'KINA_FEMALE',
        'champ_id': 'knight_female',
        'step': 2, # 144 -> 72 frames for optimal 2.1MB size & 3.0s smooth loop
        'duration_ms': 42,
        'quality': 80,
    },
    {
        'folder': 'archert_male',
        'champ_id': 'paladin_male',
        'step': 1,
        'duration_ms': 42,
        'quality': 82,
    },
    {
        'folder': 'archert_female',
        'champ_id': 'paladin_female',
        'step': 1,
        'duration_ms': 42,
        'quality': 82,
    },
    {
        'folder': 'mage_male',
        'champ_id': 'mage_male',
        'step': 1,
        'duration_ms': 40,
        'quality': 82,
    },
    {
        'folder': 'mage_female',
        'champ_id': 'mage_female',
        'step': 1,
        'duration_ms': 40,
        'quality': 82,
    },
]

def clean_and_resize(img, target_size=TARGET_SIZE):
    im = img.convert("RGBA")
    arr = np.array(im)
    # Threshold edge fringing and compression noise <= 15 alpha
    mask = arr[:, :, 3] <= 15
    arr[mask, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(target_size, Image.Resampling.LANCZOS)

def create_avatar(raw_frame_path, folder_key, size=(160, 160)):
    im = Image.open(raw_frame_path).convert("RGBA")
    cx, cy = HEAD_CENTERS.get(folder_key, (960, 300))
    crop_size = 480
    x0 = max(0, cx - crop_size // 2)
    y0 = max(0, cy - 80)
    x1 = min(1920, x0 + crop_size)
    y1 = min(1080, y0 + crop_size)
    
    cropped = im.crop((x0, y0, x1, y1))
    arr = np.array(cropped)
    mask = arr[:, :, 3] <= 15
    arr[mask, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(size, Image.Resampling.LANCZOS)

def process_character(cfg):
    folder = cfg['folder']
    champ_id = cfg['champ_id']
    step = cfg.get('step', 1)
    duration_ms = cfg.get('duration_ms', 42)
    quality = cfg.get('quality', 82)
    
    src_dir = os.path.join(BASE_STARTER_DIR, folder, 'idle')
    files = sorted(glob.glob(os.path.join(src_dir, '*.png')))
    if not files:
        print(f"[!] No raw PNGs found for {folder} in {src_dir}")
        return False
        
    print(f"== Processing {folder} -> {champ_id} ({len(files)} raw frames, step={step}) ==")
    
    # Sample frames
    sampled_files = files[::step]
    processed_frames = []
    
    for f in sampled_files:
        im = Image.open(f)
        processed_frames.append(clean_and_resize(im))
        
    # Destinations:
    # 1. Inside starter/<folder>/
    starter_dest = os.path.join(BASE_STARTER_DIR, folder)
    # 2. Inside champions/starter/<champ_id>/
    champ_dest = os.path.join(BASE_STARTER_DIR, champ_id)
    os.makedirs(champ_dest, exist_ok=True)
    
    # Save Idle WebP Animation
    out_anim_starter = os.path.join(starter_dest, "idle.webp")
    out_anim_champ = os.path.join(champ_dest, "idle.webp")
    out_anim_root = os.path.join(CHAMPIONS_OUT_DIR, f"{champ_id}_idle.webp")
    
    print(f"  Encoding animated WebP: {len(processed_frames)} frames @ {duration_ms}ms...")
    processed_frames[0].save(
        out_anim_starter,
        save_all=True,
        append_images=processed_frames[1:],
        duration=duration_ms,
        loop=0,
        quality=quality,
        method=4
    )
    # Copy/Save to champion folders as well
    with open(out_anim_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_anim_champ, 'wb') as f_out:
            f_out.write(data)
        with open(out_anim_root, 'wb') as f_out:
            f_out.write(data)
            
    # Save Static Poster (First frame)
    out_poster_starter = os.path.join(starter_dest, "idle_poster.webp")
    out_poster_champ = os.path.join(champ_dest, "idle_poster.webp")
    out_poster_root = os.path.join(CHAMPIONS_OUT_DIR, f"{champ_id}_poster.webp")
    processed_frames[0].save(out_poster_starter, 'WEBP', quality=90)
    with open(out_poster_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_poster_champ, 'wb') as f_out:
            f_out.write(data)
        with open(out_poster_root, 'wb') as f_out:
            f_out.write(data)
            
    # Save Avatar (Bust / Headshot)
    avatar_im = create_avatar(files[0], folder, size=(160, 160))
    out_avatar_starter = os.path.join(starter_dest, "avatar.webp")
    out_avatar_champ = os.path.join(champ_dest, "avatar.webp")
    out_avatar_root = os.path.join(CHAMPIONS_OUT_DIR, f"{champ_id}_avatar.webp")
    avatar_im.save(out_avatar_starter, 'WEBP', quality=90)
    with open(out_avatar_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_avatar_champ, 'wb') as f_out:
            f_out.write(data)
        with open(out_avatar_root, 'wb') as f_out:
            f_out.write(data)
            
    anim_kb = os.path.getsize(out_anim_starter) / 1024.0
    print(f"  [OK] {champ_id}: Anim={anim_kb:.1f}KB, Poster={os.path.getsize(out_poster_starter)/1024.0:.1f}KB, Avatar={os.path.getsize(out_avatar_starter)/1024.0:.1f}KB")
    return True

def create_healer_aliases():
    """Healer shares the character assets with Mage, but with dedicated healer aliases"""
    print("== Creating Healer Aliases (Sharing Mage Character) ==")
    for gender in ['male', 'female']:
        mage_id = f"mage_{gender}"
        healer_id = f"healer_{gender}"
        
        healer_dest = os.path.join(BASE_STARTER_DIR, healer_id)
        os.makedirs(healer_dest, exist_ok=True)
        
        mage_champ_dest = os.path.join(BASE_STARTER_DIR, mage_id)
        
        # Copy anim, poster, avatar
        for file_type in ['idle.webp', 'idle_poster.webp', 'avatar.webp']:
            src = os.path.join(mage_champ_dest, file_type)
            if os.path.exists(src):
                with open(src, 'rb') as f_in:
                    data = f_in.read()
                    with open(os.path.join(healer_dest, file_type), 'wb') as f_out:
                        f_out.write(data)
                    root_name = f"{healer_id}_{file_type.replace('idle_', '') if file_type != 'idle.webp' else 'idle.webp'}"
                    if file_type == 'idle_poster.webp':
                        root_name = f"{healer_id}_poster.webp"
                    elif file_type == 'avatar.webp':
                        root_name = f"{healer_id}_avatar.webp"
                    with open(os.path.join(CHAMPIONS_OUT_DIR, root_name), 'wb') as f_out:
                        f_out.write(data)
                        
        print(f"  [OK] Created Healer {gender} assets linked from {mage_id}")

if __name__ == '__main__':
    for cfg in CONFIGS:
        process_character(cfg)
    create_healer_aliases()
    print("\nALL STARTER CHAMPIONS SUCCESSFULLY PROCESSED!")
