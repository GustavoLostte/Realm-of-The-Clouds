import os
import glob
import shutil
import numpy as np
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STARTER_DIR = os.path.join(BASE_DIR, 'public/assets/champions/starter')
CHAMPIONS_DIR = os.path.join(BASE_DIR, 'public/assets/champions')
AVATARS_DIR = os.path.join(BASE_DIR, 'public/assets/avatars')

TARGET_SIZE = (512, 288)

CONFIGS = {
    'male': {
        'src_dir': os.path.join(STARTER_DIR, 'arquero_male/idle'),
        'primary_id': 'paladin_male',
        'aliases': ['archer_male', 'archert_male', 'arquero_male'],
        'cx': 919,
        'top_y': 10,
        'crop_size': 380,
        'duration_ms': 40,
        'quality': 80,
    },
    'female': {
        'src_dir': os.path.join(STARTER_DIR, 'arquera mujer/idle'),
        'primary_id': 'paladin_female',
        'aliases': ['archer_female', 'archert_female', 'arquera mujer'],
        'cx': 890,
        'top_y': 200,
        'crop_size': 360,
        'duration_ms': 40,
        'quality': 80,
    }
}

def clean_and_resize(im, target_size=TARGET_SIZE):
    arr = np.array(im)
    arr[arr[:, :, 3] <= 15, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(target_size, Image.Resampling.LANCZOS)

def create_avatar(raw_frame_path, cfg, size=(160, 160)):
    im = Image.open(raw_frame_path).convert("RGBA")
    cx = cfg['cx']
    y0 = cfg['top_y']
    crop_size = cfg['crop_size']
    x0 = max(0, cx - crop_size // 2)
    x1 = min(1920, x0 + crop_size)
    y1 = min(1080, y0 + crop_size)
    cropped = im.crop((x0, y0, x1, y1))
    arr = np.array(cropped)
    arr[arr[:, :, 3] <= 15, 3] = 0
    return Image.fromarray(arr).resize(size, Image.Resampling.LANCZOS)

def process_archer(gender, cfg):
    files = sorted(glob.glob(os.path.join(cfg['src_dir'], '*.png')))
    if not files:
        print(f"[!] No PNG frames found in {cfg['src_dir']}")
        return False

    champ_id = cfg['primary_id']
    print(f"\n==========================================")
    print(f"Processing Archer {gender} ({champ_id}) - {len(files)} frames...")
    print(f"==========================================")

    # Clean and resize frames
    print("  Resizing and cleaning frames for 512x288 combat canvas...")
    frames = []
    for f in files:
        im = Image.open(f).convert('RGBA')
        frames.append(clean_and_resize(im))

    # Master files in starter/<primary_id>/
    primary_dir = os.path.join(STARTER_DIR, champ_id)
    os.makedirs(primary_dir, exist_ok=True)

    out_anim = os.path.join(primary_dir, "idle.webp")
    out_poster = os.path.join(primary_dir, "idle_poster.webp")
    out_avatar = os.path.join(primary_dir, "avatar.webp")

    # 1. Encode Animated WebP
    print(f"  Encoding animated WebP ({len(frames)} frames @ {cfg['duration_ms']}ms)...")
    frames[0].save(
        out_anim,
        save_all=True,
        append_images=frames[1:],
        duration=cfg['duration_ms'],
        loop=0,
        quality=cfg['quality'],
        method=4
    )

    # 2. Poster
    frames[0].save(out_poster, 'WEBP', quality=90)

    # 3. Avatar
    avatar = create_avatar(files[0], cfg)
    avatar.save(out_avatar, 'WEBP', quality=90)

    # Read binary data for distributing to all aliases and root
    with open(out_anim, 'rb') as f:
        anim_data = f.read()
    with open(out_poster, 'rb') as f:
        poster_data = f.read()
    with open(out_avatar, 'rb') as f:
        avatar_data = f.read()

    # Save to public/assets/champions/
    with open(os.path.join(CHAMPIONS_DIR, f"{champ_id}_idle.webp"), 'wb') as f:
        f.write(anim_data)
    with open(os.path.join(CHAMPIONS_DIR, f"{champ_id}_poster.webp"), 'wb') as f:
        f.write(poster_data)
    with open(os.path.join(CHAMPIONS_DIR, f"{champ_id}_avatar.webp"), 'wb') as f:
        f.write(avatar_data)

    # Also save archer_male / archer_female at root
    generic_archer_id = f"archer_{gender}"
    with open(os.path.join(CHAMPIONS_DIR, f"{generic_archer_id}_idle.webp"), 'wb') as f:
        f.write(anim_data)
    with open(os.path.join(CHAMPIONS_DIR, f"{generic_archer_id}_poster.webp"), 'wb') as f:
        f.write(poster_data)
    with open(os.path.join(CHAMPIONS_DIR, f"{generic_archer_id}_avatar.webp"), 'wb') as f:
        f.write(avatar_data)

    # Also save to public/assets/avatars/
    if os.path.exists(AVATARS_DIR):
        with open(os.path.join(AVATARS_DIR, f"{champ_id}.webp"), 'wb') as f:
            f.write(avatar_data)

    # Distribute to all aliases in starter/
    for alias in cfg['aliases']:
        alias_dir = os.path.join(STARTER_DIR, alias)
        os.makedirs(alias_dir, exist_ok=True)
        with open(os.path.join(alias_dir, "idle.webp"), 'wb') as f:
            f.write(anim_data)
        with open(os.path.join(alias_dir, "idle_poster.webp"), 'wb') as f:
            f.write(poster_data)
        with open(os.path.join(alias_dir, "avatar.webp"), 'wb') as f:
            f.write(avatar_data)

    anim_size = os.path.getsize(out_anim) / (1024 * 1024)
    print(f"  [DONE] {champ_id}:")
    print(f"    - idle.webp: {anim_size:.2f} MB")
    print(f"    - poster: {os.path.getsize(out_poster) / 1024:.1f} KB")
    print(f"    - avatar: {os.path.getsize(out_avatar) / 1024:.1f} KB")
    return True

if __name__ == '__main__':
    for gender, cfg in CONFIGS.items():
        process_archer(gender, cfg)
    print("\nBoth archers successfully processed and integrated!")
