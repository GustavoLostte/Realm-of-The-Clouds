import os
import math
import json
from PIL import Image, ImageSequence
import numpy as np

npc_dir = 'public/assets/npcs'
output_dir = 'public/assets/npcs/spritesheets'
os.makedirs(output_dir, exist_ok=True)

def clean_alpha_noise(pil_frame):
    """
    Cleans faint background noise (alpha <= 22) caused by green-screen / chroma cutouts.
    Smooths anti-aliased edges between 23 and 40.
    Zeros out RGB in fully transparent regions to prevent color bleeding.
    """
    arr = np.array(pil_frame.convert('RGBA'))
    alpha = arr[:, :, 3].astype(float)
    
    # Strict thresholding of faint haze / bounding box artifacts
    new_alpha = np.where(
        alpha <= 22, 
        0, 
        np.where(alpha >= 40, alpha, (alpha - 22) / 18.0 * 40.0)
    ).astype(np.uint8)
    
    arr[:, :, 3] = new_alpha
    arr[new_alpha == 0] = [0, 0, 0, 0]
    return Image.fromarray(arr)

targets = [
    ('comandante_idle', 'comandante_idle.webp', 1.0, 7),
    ('comandante_action', 'comandante_action.webp', 0.75, 11),
    ('soldado_vigia_idle', 'soldado_vigia_idle.webp', 0.70, 9),
    ('angel_chica_walk_front', 'angel_chica_walk_front.webp', 0.65, 8),
    ('angel_chica_walk_back', 'angel_chica_walk_back.webp', 0.65, 8),
    ('soldado_walk_front', 'soldado_walk_front.webp', 0.65, 8),
    ('soldado_walk_back', 'soldado_walk_back.webp', 0.65, 8),
    ('worker_walk_front', 'worker_walk_front.webp', 0.65, 8),
    ('worker_walk_back', 'worker_walk_back.webp', 0.65, 8),
]

for name, filename, scale, max_cols in targets:
    src_path = os.path.join(npc_dir, filename)
    if not os.path.exists(src_path):
        print(f'Skipping {filename}, not found')
        continue
    
    im = Image.open(src_path)
    raw_frames = [clean_alpha_noise(frame) for frame in ImageSequence.Iterator(im)]
    total_frames = len(raw_frames)
    if total_frames == 0:
        continue
    
    orig_fw, orig_fh = raw_frames[0].size
    fw = int(round(orig_fw * scale))
    fh = int(round(orig_fh * scale))
    
    frames = [f.resize((fw, fh), Image.Resampling.LANCZOS) for f in raw_frames]
    
    # 2px transparent padding around each frame to prevent bilinear bleeding
    pad = 2
    padded_fw = fw + pad * 2
    padded_fh = fh + pad * 2
    
    cols = min(max_cols, total_frames)
    rows = math.ceil(total_frames / cols)
    
    sheet_w = cols * padded_fw
    sheet_h = rows * padded_fh
    sheet_img = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    
    frames_dict = {}
    anim_list = []
    
    for idx, frame in enumerate(frames):
        c = idx % cols
        r = idx // cols
        x = c * padded_fw + pad
        y = r * padded_fh + pad
        sheet_img.paste(frame, (x, y))
        
        frame_id = f'{name}_{idx:03d}'
        anim_list.append(frame_id)
        frames_dict[frame_id] = {
            'frame': {'x': x, 'y': y, 'w': fw, 'h': fh},
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh},
            'sourceSize': {'w': fw, 'h': fh}
        }
    
    atlas_image_name = f'{name}_atlas.webp'
    atlas_image_path = os.path.join(output_dir, atlas_image_name)
    # Lossless WebP guarantees 100% mathematical zero in transparent areas (eliminates frame squares)
    sheet_img.save(atlas_image_path, 'WEBP', lossless=True)
    
    atlas_json = {
        'frames': frames_dict,
        'animations': {
            'play': anim_list
        },
        'meta': {
            'image': atlas_image_name,
            'format': 'RGBA8888',
            'size': {'w': sheet_w, 'h': sheet_h},
            'scale': '1'
        }
    }
    
    atlas_json_path = os.path.join(output_dir, f'{name}.json')
    with open(atlas_json_path, 'w', encoding='utf-8') as jf:
        json.dump(atlas_json, jf, indent=2)
    
    print(f'Generated {name}: {total_frames} frames ({fw}x{fh}, sheet {sheet_w}x{sheet_h}) -> {atlas_image_name} ({os.path.getsize(atlas_image_path) // 1024} KB) [Lossless HD]')

print('All NPC spritesheets successfully regenerated with clean alpha and zero frame boxes!')
