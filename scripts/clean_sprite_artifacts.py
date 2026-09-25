#!/usr/bin/env python3
"""
Clean dark semi-transparent pixel artifacts from animated WebP sprites.

These artifacts appear as dark borders/boxes around the character during
animation playback - caused by WebP lossy compression bleeding dark pixels
into the alpha channel edges.

Strategy:
  1. NUKE: alpha < 50 AND brightness < 35  → alpha = 0 (dark fringe)
  2. NUKE: alpha < 100 AND brightness < 18  → alpha = 0 (dark halo)  
  3. SOFTEN: remaining dark semi-transparent  → alpha *= 0.4 (edge fade)

Backs up originals to .bak before overwriting.
"""

import os
import sys
import glob
import shutil
from PIL import Image, ImageSequence
import numpy as np

SPRITE_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'champions', 'Valiria')

# Files to skip (non-animated or avatar)
SKIP_FILES = {'avatar.webp', 'idle_poster.webp'}


def clean_frame(frame_rgba):
    """Clean dark artifact pixels from a single RGBA frame."""
    arr = np.array(frame_rgba)
    alpha = arr[:, :, 3].astype(float)
    brightness = arr[:, :, :3].mean(axis=2)

    # 1. Nuke dark fringe: low alpha + dark color
    dark_fringe = (alpha > 0) & (alpha < 50) & (brightness < 35)
    # 2. Nuke dark halo: moderate alpha + very dark color  
    dark_halo = (alpha > 0) & (alpha < 100) & (brightness < 18)
    combined = dark_fringe | dark_halo

    arr[combined, 3] = 0

    # 3. Soften remaining dark semi-transparent pixels (smooth anti-aliasing)
    remaining_alpha = arr[:, :, 3].astype(float)
    remaining_bright = arr[:, :, :3].mean(axis=2)
    remaining_dark = (remaining_alpha > 0) & (remaining_alpha < 120) & (remaining_bright < 40)
    arr[remaining_dark, 3] = (arr[remaining_dark, 3].astype(float) * 0.4).astype(np.uint8)

    return Image.fromarray(arr), combined.sum()


def process_animated_webp(filepath):
    """Process all frames of an animated WebP, cleaning artifacts."""
    filename = os.path.basename(filepath)
    
    im = Image.open(filepath)
    n_frames = getattr(im, 'n_frames', 1)
    
    if n_frames <= 1 and filename not in SKIP_FILES:
        # Single frame - still clean it
        frame = im.convert('RGBA')
        cleaned, count = clean_frame(frame)
        if count > 0:
            # Backup
            backup = filepath + '.bak'
            if not os.path.exists(backup):
                shutil.copy2(filepath, backup)
            cleaned.save(filepath, 'WEBP', lossless=True)
            print(f'  ✓ {filename}: cleaned {count} pixels (single frame)')
        else:
            print(f'  · {filename}: clean (no artifacts)')
        return

    # Collect all frames with their durations
    frames = []
    durations = []
    total_cleaned = 0

    for i in range(n_frames):
        im.seek(i)
        frame = im.convert('RGBA')
        duration = im.info.get('duration', 50)  # default 50ms if missing
        
        cleaned_frame, count = clean_frame(frame)
        frames.append(cleaned_frame)
        durations.append(duration)
        total_cleaned += count

    if total_cleaned == 0:
        print(f'  · {filename}: clean ({n_frames} frames, no artifacts)')
        return

    # Backup original
    backup = filepath + '.bak'
    if not os.path.exists(backup):
        shutil.copy2(filepath, backup)

    # Save cleaned animated WebP
    frames[0].save(
        filepath,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        lossless=True,
        method=4,  # Compression quality (0=fast, 6=best)
    )

    avg_per_frame = total_cleaned / n_frames
    print(f'  ✓ {filename}: cleaned {total_cleaned} pixels across {n_frames} frames '
          f'(~{avg_per_frame:.0f}/frame)')


def main():
    sprite_dir = os.path.abspath(SPRITE_DIR)
    webp_files = sorted(glob.glob(os.path.join(sprite_dir, '*.webp')))
    
    if not webp_files:
        print(f'No .webp files found in {sprite_dir}')
        sys.exit(1)
    
    print(f'🧹 Cleaning dark pixel artifacts from {len(webp_files)} sprites...')
    print(f'   Directory: {sprite_dir}\n')
    
    for filepath in webp_files:
        filename = os.path.basename(filepath)
        if filename in SKIP_FILES:
            print(f'  ⏭ {filename}: skipped')
            continue
        
        try:
            process_animated_webp(filepath)
        except Exception as e:
            print(f'  ✗ {filename}: ERROR - {e}')
    
    print(f'\n✅ Done! Originals backed up as .bak files.')
    print(f'   To revert: rename .bak files back to .webp')


if __name__ == '__main__':
    main()
