import os
import glob
import subprocess
import shutil
from PIL import Image
import numpy as np
from scipy import ndimage

NPC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets/characters/ANIMADOS'))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets/npcs'))
SCRATCH_DIR = '/tmp/npc_scratch_frames'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

CONFIGS = {
    'angel_chica': {
        'front_crop': (650, 110, 1160, 960), # w=510, h=850
        'back_crop': (725, 92, 1235, 942),   # w=510, h=850
        'target_size': (120, 200),
        'front_delay': 38,
        'back_delay': 38,
        'front_name': 'angel_chica_walk_front.webp',
        'back_name': 'angel_chica_walk_back.webp',
        'aliases': [
            ('aldeana_walk_front.webp', 'aldeana_walk_back.webp'),
            ('baker_villager.webp', 'baker_villager_back.webp')
        ]
    },
    'lumberjack': {
        'front_crop': (660, 150, 1180, 965), # w=520, h=815
        'back_crop': (660, 150, 1180, 965),
        'target_size': (128, 200),
        'front_delay': 42, # 30 frames @ 24fps = 1.26s
        'back_delay': 42,  # 33 frames @ 24fps = 1.38s
        'front_name': 'lumberjack_walk_front.webp',
        'back_name': 'lumberjack_walk_back.webp',
        'aliases': [
            ('lumberjack.webp', 'lumberjack_back.webp')
        ]
    },
    'soldado': {
        'front_crop': (700, 100, 1165, 940), # w=465, h=840
        'back_crop': (700, 100, 1165, 940),
        'target_size': (111, 200),
        'front_delay': 42, # 29 frames @ 24fps = 1.22s
        'back_delay': 42,  # 29 frames @ 24fps = 1.22s
        'front_name': 'soldado_walk_front.webp',
        'back_name': 'soldado_walk_back.webp',
        'aliases': [
            ('town_guard.webp', 'town_guard_back.webp')
        ]
    }
}

def process_frame(img_path, crop_box, target_size):
    img = Image.open(img_path)
    arr = np.array(img)[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]].copy()
    
    # Eliminate cast floor shadow at bottom
    rgb = arr[:, :, :3]
    diff = rgb.max(axis=2) - rgb.min(axis=2)
    shadow_mask = (arr[:, :, 3] < 160) & (
        (arr[:, :, 3] < 80) |
        ((diff < 15) & (rgb.max(axis=2) < 70))
    )
    arr[600:, :][shadow_mask[600:, :], 3] = 0
    
    # Extra cleanup for any faint floor pixels near bottom
    faint_floor = (arr[800:, :, 3] < 40)
    arr[800:, :, 3][faint_floor] = 0
    
    clean_img = Image.fromarray(arr)
    resized = clean_img.resize(target_size, Image.Resampling.LANCZOS)
    return resized

def build_animation(char_key, label, frame_files, delay_ms, out_filename):
    cfg = CONFIGS[char_key]
    crop = cfg.get(f'{label}_crop', cfg.get('front_crop'))
    target_size = cfg['target_size']
    
    temp_dir = os.path.join(SCRATCH_DIR, f'{char_key}_{label}')
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_pngs = []
    print(f'Processing {len(frame_files)} frames for {char_key} {label}...')
    for idx, fpath in enumerate(frame_files):
        processed = process_frame(fpath, crop, target_size)
        temp_out = os.path.join(temp_dir, f'frame_{idx:03d}.png')
        processed.save(temp_out)
        temp_pngs.append(temp_out)
        
    out_path = os.path.join(OUTPUT_DIR, out_filename)
    cmd = ['/opt/homebrew/bin/img2webp', '-loop', '0', '-d', str(delay_ms), '-q', '85'] + temp_pngs + ['-o', out_path]
    print(f'Running img2webp for {out_filename}...')
    subprocess.run(cmd, check=True)
    
    size_kb = os.path.getsize(out_path) / 1024
    print(f'Generated {out_path} ({size_kb:.1f} KB)')
    
    # Copy to aliases if any
    for front_alias, back_alias in cfg['aliases']:
        alias_name = front_alias if label == 'front' else back_alias
        alias_path = os.path.join(OUTPUT_DIR, alias_name)
        shutil.copyfile(out_path, alias_path)
        print(f'  Created alias: {alias_path}')
        
    # Clean up temp frames
    shutil.rmtree(temp_dir, ignore_errors=True)

def main():
    # Process Angel Chica
    angel_dir = os.path.join(NPC_DIR, 'ANGEL CHICA')
    if os.path.exists(angel_dir):
        fronts = sorted(glob.glob(os.path.join(angel_dir, 'FRONT', '*.png')))
        backs = sorted(glob.glob(os.path.join(angel_dir, 'BACK', '*.png')))
        cfg = CONFIGS['angel_chica']
        build_animation('angel_chica', 'front', fronts, cfg['front_delay'], cfg['front_name'])
        build_animation('angel_chica', 'back', backs, cfg['back_delay'], cfg['back_name'])

    print('\nAnimations processed successfully!')

if __name__ == '__main__':
    main()
