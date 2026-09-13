import os
import glob
import subprocess
import shutil
from PIL import Image
import numpy as np
from scipy import ndimage

NPC_DIR = '/Users/wizzard/Desktop/TOC FOE/public/npc'
OUTPUT_DIR = '/Users/wizzard/Desktop/TOC FOE/public/assets/npcs'
SCRATCH_DIR = '/Users/wizzard/.gemini/antigravity-ide/brain/9bd7ea17-0d73-4db6-bad5-d59d512cbfb3/scratch_frames'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

CONFIGS = {
    'aldeana': {
        'crop': (715, 190, 1170, 950), # w=455, h=760
        'target_size': (120, 200),
        'front_delay': 33, # 45 frames @ 30fps = 1.48s
        'back_delay': 42,  # 29 frames @ 24fps = 1.22s
        'front_name': 'aldeana_walk_front.webp',
        'back_name': 'aldeana_walk_back.webp',
        'aliases': [
            ('baker_villager.webp', 'baker_villager_back.webp')
        ]
    },
    'lumberjack': {
        'crop': (660, 150, 1180, 965), # w=520, h=815
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
        'crop': (700, 100, 1165, 940), # w=465, h=840
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
    
    # Isolate solid character and dilate slightly to preserve soft anti-aliased edge
    solid = arr[:, :, 3] > 120
    dilated = ndimage.binary_dilation(solid, iterations=4)
    clean_alpha = np.where(dilated & (arr[:, :, 3] > 25), arr[:, :, 3], 0)
    arr[:, :, 3] = clean_alpha
    
    clean_img = Image.fromarray(arr)
    resized = clean_img.resize(target_size, Image.Resampling.LANCZOS)
    return resized

def build_animation(char_key, label, frame_files, delay_ms, out_filename):
    cfg = CONFIGS[char_key]
    crop = cfg['crop']
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
    for char, cfg in CONFIGS.items():
        char_p = os.path.join(NPC_DIR, char)
        files = sorted(os.listdir(char_p))
        fronts = [os.path.join(char_p, f) for f in files if f.endswith('.png') and not f.startswith('espalda')]
        backs = [os.path.join(char_p, f) for f in files if f.endswith('.png') and f.startswith('espalda')]
        
        build_animation(char, 'front', fronts, cfg['front_delay'], cfg['front_name'])
        build_animation(char, 'back', backs, cfg['back_delay'], cfg['back_name'])

    print('\nAll animations processed successfully!')

if __name__ == '__main__':
    main()
