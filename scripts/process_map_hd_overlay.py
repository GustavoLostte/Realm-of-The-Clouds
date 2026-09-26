import os
import glob
import math
import json
from PIL import Image
import numpy as np

map_dir = 'public/assets/map'
raw_dir = os.path.join(map_dir, 'raw_frames')
output_atlases_dir = 'public/assets/atlases'
os.makedirs(output_atlases_dir, exist_ok=True)

# 1. Obtain raw PNG frames in chronological sequence
raw_files = sorted(glob.glob(os.path.join(raw_dir, 'Timeline 2_*.png')))
if not raw_files:
    raw_files = sorted(glob.glob(os.path.join(map_dir, 'Timeline 2_*.png')))

print(f'Found {len(raw_files)} raw 1080p frames.')
if len(raw_files) == 0:
    raise RuntimeError('No map raw frames found.')

# 2. Generate Master 1080p Native Base Map (Crystal Clear Full HD, Q=96)
base_img = Image.open(raw_files[0]).convert('RGB')
base_1080p_path = os.path.join(map_dir, 'map_base_1080p.webp')
base_img.save(base_1080p_path, 'WEBP', quality=96, method=6)
# Mirror to public/assets/atlases
base_img.save(os.path.join(output_atlases_dir, 'map_base_1080p.webp'), 'WEBP', quality=96, method=6)
print(f'Generated 1080p Full HD Base Map: {base_1080p_path} ({os.path.getsize(base_1080p_path)//1024} KB)')

base_arr = np.array(base_img, dtype=float)

# 3. Process each frame: generate motion overlay with alpha transparency in static terrain
print('Processing 149 motion overlay frames (isolating water/clouds, eliminating temporal noise)...')
overlay_frames = []

for idx, f_path in enumerate(raw_files):
    f_img = Image.open(f_path).convert('RGB')
    f_arr = np.array(f_img, dtype=float)
    
    # Calculate difference against base
    diff = np.abs(f_arr - base_arr).max(axis=-1)
    
    # Denoise: pixels with diff <= 10 are static sensor/encoder noise -> alpha = 0
    # Pixels with diff >= 22 are true motion (water, clouds) -> alpha = 255
    # Smooth ramp between 10 and 22
    alpha = np.clip((diff - 10.0) / (22.0 - 10.0), 0.0, 1.0) * 255.0
    
    # Build RGBA
    rgba = np.dstack([f_arr, alpha]).astype(np.uint8)
    # Clear RGB in zero-alpha areas to prevent texture bleeding and save bandwidth
    rgba[rgba[:, :, 3] == 0] = [0, 0, 0, 0]
    
    # Resize motion overlay to 960x540 (exact 2:1 integer downsampling of 1920x1080)
    overlay_pil = Image.fromarray(rgba).resize((960, 540), Image.Resampling.LANCZOS)
    overlay_frames.append(overlay_pil)
    
    if (idx + 1) % 25 == 0 or idx == len(raw_files) - 1:
        print(f'   Denoised {idx + 1}/{len(raw_files)} frames')

# 4. Pack into 2048x2048 Texture Atlas pages (2 columns x 3 rows = 6 frames per page)
cols = 2
rows = 3
frames_per_page = cols * rows
pad = 2
fw, fh = 960, 540
padded_fw = fw + pad * 2
padded_fh = fh + pad * 2

total_pages = math.ceil(len(overlay_frames) / frames_per_page)
print(f'Packing into {total_pages} atlas pages (2048x2048)...')

master_textures_array = []
consolidated_frames = {}
anim_frame_names = []

for page_idx in range(total_pages):
    start_i = page_idx * frames_per_page
    end_i = min(start_i + frames_per_page, len(overlay_frames))
    page_frames = overlay_frames[start_i:end_i]
    
    page_img = Image.new('RGBA', (padded_fw * cols, padded_fh * rows), (0, 0, 0, 0))
    page_name = f'map_atlas-{page_idx}.webp'
    page_json_name = f'map_atlas-{page_idx}.json'
    
    texture_entry = {
        'image': page_name,
        'format': 'RGBA8888',
        'size': {'w': padded_fw * cols, 'h': padded_fh * rows},
        'scale': 1,
        'frames': []
    }
    
    page_frames_dict = {}
    
    for local_idx, frame in enumerate(page_frames):
        global_idx = start_i + local_idx
        c = local_idx % cols
        r = local_idx // cols
        x = c * padded_fw + pad
        y = r * padded_fh + pad
        
        page_img.paste(frame, (x, y))
        
        base_filename = os.path.basename(raw_files[global_idx]).replace('.png', '.webp')
        anim_frame_names.append(base_filename)
        
        frame_data = {
            'frame': {'x': x, 'y': y, 'w': fw, 'h': fh},
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh},
            'sourceSize': {'w': fw, 'h': fh},
            'atlasImage': page_name
        }
        
        page_frames_dict[base_filename] = frame_data
        consolidated_frames[base_filename] = frame_data
        
        texture_entry['frames'].append({
            'filename': base_filename,
            'rotated': False,
            'trimmed': False,
            'sourceSize': {'w': fw, 'h': fh},
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh},
            'frame': {'x': x, 'y': y, 'w': fw, 'h': fh}
        })
        
    page_save_path = os.path.join(map_dir, page_name)
    page_img.save(page_save_path, 'WEBP', quality=92, method=5)
    page_img.save(os.path.join(output_atlases_dir, page_name), 'WEBP', quality=92, method=5)
    
    # Save individual page json
    page_json = {
        'frames': page_frames_dict,
        'meta': {
            'image': page_name,
            'format': 'RGBA8888',
            'size': {'w': padded_fw * cols, 'h': padded_fh * rows},
            'scale': '1'
        }
    }
    with open(os.path.join(map_dir, page_json_name), 'w') as jf:
        json.dump(page_json, jf, indent=2)
    with open(os.path.join(output_atlases_dir, page_json_name), 'w') as jf:
        json.dump(page_json, jf, indent=2)
        
    master_textures_array.append(texture_entry)
    print(f'   Saved page {page_name} ({os.path.getsize(page_save_path)//1024} KB)')

# 5. Save master JSONs
related_multi_packs = [f'map_atlas-{i}.json' for i in range(1, total_pages)]
master_pixi_json = {
    'frames': consolidated_frames,
    'animations': {
        'play': anim_frame_names,
        'loop': anim_frame_names
    },
    'meta': {
        'app': 'RealmOfKingdomsDenoisedMapAtlas',
        'version': '3.0.0',
        'image': 'map_atlas-0.webp',
        'baseImage': 'map_base_1080p.webp',
        'format': 'RGBA8888',
        'size': {'w': padded_fw * cols, 'h': padded_fh * rows},
        'scale': '1',
        'related_multi_packs': related_multi_packs
    }
}

master_pixi_path = os.path.join(map_dir, 'map_atlas.json')
with open(master_pixi_path, 'w') as f:
    json.dump(master_pixi_json, f, indent=2)
with open(os.path.join(map_dir, 'map.json'), 'w') as f:
    json.dump(master_pixi_json, f, indent=2)
with open(os.path.join(output_atlases_dir, 'map_atlas.json'), 'w') as f:
    json.dump(master_pixi_json, f, indent=2)

master_textures_json = {
    'textures': master_textures_array,
    'baseImage': 'map_base_1080p.webp',
    'animations': {
        'play': anim_frame_names
    }
}
with open(os.path.join(map_dir, 'map_master.json'), 'w') as f:
    json.dump(master_textures_json, f, indent=2)
with open(os.path.join(output_atlases_dir, 'map_master.json'), 'w') as f:
    json.dump(master_textures_json, f, indent=2)

print('\nSuccessfully generated Native 1080p Base Map + Temporally Denoised Motion Overlay Atlas!')
