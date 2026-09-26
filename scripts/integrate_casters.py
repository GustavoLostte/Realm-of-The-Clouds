import os
import glob
import numpy as np
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STARTER_DIR = os.path.join(BASE_DIR, 'public/assets/champions/starter')
CHAMPIONS_DIR = os.path.join(BASE_DIR, 'public/assets/champions')

TARGET_SIZE = (512, 288)

CONFIGS = {
    'healer_female': {'cx': 935, 'top_y': 15, 'crop_size': 380, 'duration_ms': 40, 'quality': 80},
    'healer_male':   {'cx': 1010, 'top_y': 30, 'crop_size': 380, 'duration_ms': 40, 'quality': 80},
    'mage_female':   {'cx': 935, 'top_y': 15, 'crop_size': 380, 'duration_ms': 40, 'quality': 80},
    'mage_male':     {'cx': 1010, 'top_y': 30, 'crop_size': 380, 'duration_ms': 40, 'quality': 80},
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

def process_champion(champ_id, cfg):
    src_dir = os.path.join(STARTER_DIR, champ_id, 'idle')
    files = sorted(glob.glob(os.path.join(src_dir, '*.png')))
    if not files:
        print(f"[!] No PNG frames found for {champ_id} in {src_dir}")
        return False

    print(f"\n==========================================")
    print(f"Processing {champ_id} ({len(files)} frames)...")
    print(f"==========================================")

    starter_champ_dir = os.path.join(STARTER_DIR, champ_id)
    os.makedirs(starter_champ_dir, exist_ok=True)

    # 1. Clean and resize frames for idle animation
    print("  Resizing and cleaning frames...")
    frames = []
    for f in files:
        im = Image.open(f).convert('RGBA')
        frames.append(clean_and_resize(im))

    # 2. Encode Idle WebP
    out_anim_starter = os.path.join(starter_champ_dir, "idle.webp")
    out_anim_root = os.path.join(CHAMPIONS_DIR, f"{champ_id}_idle.webp")
    print(f"  Encoding animated WebP ({len(frames)} frames @ {cfg['duration_ms']}ms)...")
    frames[0].save(
        out_anim_starter,
        save_all=True,
        append_images=frames[1:],
        duration=cfg['duration_ms'],
        loop=0,
        quality=cfg['quality'],
        method=4
    )
    with open(out_anim_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_anim_root, 'wb') as f_out:
            f_out.write(data)

    # 3. Save Poster (first frame)
    out_poster_starter = os.path.join(starter_champ_dir, "idle_poster.webp")
    out_poster_root = os.path.join(CHAMPIONS_DIR, f"{champ_id}_poster.webp")
    frames[0].save(out_poster_starter, 'WEBP', quality=90)
    with open(out_poster_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_poster_root, 'wb') as f_out:
            f_out.write(data)

    # 4. Save Avatar
    out_avatar_starter = os.path.join(starter_champ_dir, "avatar.webp")
    out_avatar_root = os.path.join(CHAMPIONS_DIR, f"{champ_id}_avatar.webp")
    avatar = create_avatar(files[0], cfg)
    avatar.save(out_avatar_starter, 'WEBP', quality=90)
    with open(out_avatar_starter, 'rb') as f_in:
        data = f_in.read()
        with open(out_avatar_root, 'wb') as f_out:
            f_out.write(data)

    anim_size = os.path.getsize(out_anim_starter) / (1024 * 1024)
    print(f"  [DONE] {champ_id}:")
    print(f"    - idle.webp: {anim_size:.2f} MB")
    print(f"    - poster: {os.path.getsize(out_poster_starter) / 1024:.1f} KB")
    print(f"    - avatar: {os.path.getsize(out_avatar_starter) / 1024:.1f} KB")
    return True

if __name__ == '__main__':
    for champ_id, cfg in CONFIGS.items():
        process_champion(champ_id, cfg)
    print("\nAll 4 casters (healers & mages) successfully processed and integrated!")
