import os
import glob
import numpy as np
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STARTER_DIR = os.path.join(BASE_DIR, 'public/assets/champions/starter')
CHAMPIONS_DIR = os.path.join(BASE_DIR, 'public/assets/champions')

CONFIGS = [
    {
        'name': 'knight_male',
        'src_dir': os.path.join(STARTER_DIR, 'kina_male/idle'),
        'scale': 0.785,
        'target_bottom_1080': 995,
        'target_center_x_1080': 960,
        'duration_ms': 40,
        'quality': 80,
        'destinations': [
            os.path.join(STARTER_DIR, 'knight_male'),
            os.path.join(STARTER_DIR, 'kina_male'),
            os.path.join(STARTER_DIR, 'Kina_male'),
        ],
        'root_names': ['knight_male', 'kina_male'],
    },
    {
        'name': 'paladin_male',
        'src_dir': os.path.join(STARTER_DIR, 'arquero_male/idle'),
        'scale': 0.785,
        'target_bottom_1080': 995,
        'target_center_x_1080': 960,
        'duration_ms': 40,
        'quality': 80,
        'destinations': [
            os.path.join(STARTER_DIR, 'paladin_male'),
            os.path.join(STARTER_DIR, 'arquero_male'),
            os.path.join(STARTER_DIR, 'archer_male'),
            os.path.join(STARTER_DIR, 'archert_male'),
        ],
        'root_names': ['paladin_male', 'archer_male'],
    }
]

def transform_frame(im_1080, scale=0.785, target_bottom_1080=995, target_center_x_1080=960):
    w = int(round(1920 * scale))
    h = int(round(1080 * scale))
    scaled = im_1080.resize((w, h), Image.Resampling.LANCZOS)
    
    new_1080 = Image.new('RGBA', (1920, 1080), (0, 0, 0, 0))
    offset_y = target_bottom_1080 - h
    offset_x = target_center_x_1080 - int(round(w / 2.0))
    
    new_1080.paste(scaled, (offset_x, offset_y), scaled)
    arr = np.array(new_1080)
    arr[arr[:, :, 3] <= 15, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize((512, 288), Image.Resampling.LANCZOS)

def process_and_rescale(cfg):
    name = cfg['name']
    files = sorted(glob.glob(os.path.join(cfg['src_dir'], '*.png')))
    if not files:
        print(f"[!] No PNG frames found in {cfg['src_dir']}")
        return False

    print(f"\n==========================================")
    print(f"Rescaling {name} ({len(files)} frames) with scale={cfg['scale']}...")
    print(f"==========================================")

    frames = []
    for f in files:
        im = Image.open(f).convert('RGBA')
        frames.append(transform_frame(
            im,
            scale=cfg['scale'],
            target_bottom_1080=cfg['target_bottom_1080'],
            target_center_x_1080=cfg['target_center_x_1080']
        ))

    # Check bounds of the first transformed frame
    arr0 = np.array(frames[0])
    ys0, xs0 = np.where(arr0[:, :, 3] > 15)
    print(f"  Result bounds on 512x288: height={ys0.max()-ys0.min()}, width={xs0.max()-xs0.min()}, bottom={ys0.max()}")

    # Encode master WebP animation and poster
    temp_anim = f"/tmp/{name}_rescaled_idle.webp"
    temp_poster = f"/tmp/{name}_rescaled_poster.webp"

    print(f"  Encoding WebP ({len(frames)} frames @ {cfg['duration_ms']}ms)...")
    frames[0].save(
        temp_anim,
        save_all=True,
        append_images=frames[1:],
        duration=cfg['duration_ms'],
        loop=0,
        quality=cfg['quality'],
        method=4
    )
    frames[0].save(temp_poster, 'WEBP', quality=90)

    with open(temp_anim, 'rb') as f:
        anim_data = f.read()
    with open(temp_poster, 'rb') as f:
        poster_data = f.read()

    # Distribute to destinations
    for dest in cfg['destinations']:
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, "idle.webp"), 'wb') as f:
            f.write(anim_data)
        with open(os.path.join(dest, "idle_poster.webp"), 'wb') as f:
            f.write(poster_data)

    # Distribute to root public/assets/champions/
    for root_id in cfg['root_names']:
        with open(os.path.join(CHAMPIONS_DIR, f"{root_id}_idle.webp"), 'wb') as f:
            f.write(anim_data)
        with open(os.path.join(CHAMPIONS_DIR, f"{root_id}_poster.webp"), 'wb') as f:
            f.write(poster_data)

    sz_mb = len(anim_data) / (1024 * 1024)
    print(f"  [OK] {name} successfully rescaled and distributed ({sz_mb:.2f} MB)")
    return True

if __name__ == '__main__':
    for cfg in CONFIGS:
        process_and_rescale(cfg)
    print("\nAll male combat champions successfully rescaled to match Mage and Healer proportions!")
