#!/usr/bin/env python3
"""
Reconstruct all 9 dungeon corridors into razor-sharp 1080p (1920x1080) animated WebPs.
Fuses the pristine 1080p master static texture from map_base.webp with the 
motion-stabilized animated torches and lighting elements, eliminating all blur.
Runs in parallel across all available CPU cores.
"""

import os
import sys
import time
import concurrent.futures
import numpy as np
from PIL import Image, ImageSequence, ImageFilter

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAPS_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/MAPS")

CORRIDORS = [
    os.path.join(MAPS_DIR, "MAP1", "1:3"),
    os.path.join(MAPS_DIR, "MAP1", "2:3"),
    os.path.join(MAPS_DIR, "MAP1", "3:3"),
    os.path.join(MAPS_DIR, "MAP2", "1:3"),
    os.path.join(MAPS_DIR, "MAP2", "2:3"),
    os.path.join(MAPS_DIR, "MAP2", "3:3"),
    os.path.join(MAPS_DIR, "MAP3", "1:3"),
    os.path.join(MAPS_DIR, "MAP3", "2:3"),
    os.path.join(MAPS_DIR, "MAP3", "3:3"),
]


def process_single_corridor(corridor_path):
    t0 = time.time()
    rel = os.path.relpath(corridor_path, MAPS_DIR)
    base_path = os.path.join(corridor_path, "map_base.webp")
    loop_path = os.path.join(corridor_path, "map_loop.webp")

    if not os.path.exists(base_path) or not os.path.exists(loop_path):
        return f"[SKIP] {rel}: missing base or loop"

    base_1080 = Image.open(base_path).convert("RGB")
    base_arr = np.array(base_1080, dtype=np.float32)

    loop_im = Image.open(loop_path)
    n_frames = getattr(loop_im, "n_frames", 1)
    durations = [f.info.get("duration", 42) for f in ImageSequence.Iterator(loop_im)]

    loop_im.seek(0)
    out_frames = []

    for idx, frame in enumerate(ImageSequence.Iterator(loop_im)):
        rgb_frame = frame.convert("RGB")
        # 1. High-precision Lanczos upscale to 1080p
        up_frame = rgb_frame.resize((1920, 1080), Image.Resampling.LANCZOS)
        # 2. Enhance edge definition
        sharp_frame = up_frame.filter(ImageFilter.UnsharpMask(radius=1.2, percent=125, threshold=2))
        sharp_arr = np.array(sharp_frame, dtype=np.float32)

        # 3. Dynamic motion mask: isolate torches, embers, and smoke
        diff = np.mean(np.abs(sharp_arr - base_arr), axis=2)
        motion_mask = np.clip(diff / 22.0, 0.0, 1.0)
        # Blur motion mask for seamless transition
        mask_im = Image.fromarray((motion_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=3))
        w = (np.array(mask_im, dtype=np.float32) / 255.0)[:, :, np.newaxis]

        # 4. Hybrid fusion: 100% native 1080p master for static walls/floor + sharp dynamic animation
        fused_arr = base_arr * (1.0 - w) + sharp_arr * w
        fused_frame = Image.fromarray(np.clip(fused_arr, 0, 255).astype(np.uint8))
        out_frames.append(fused_frame)

    # Save to temp file first
    tmp_out = os.path.join(corridor_path, "map_loop_1080p_tmp.webp")
    out_frames[0].save(
        tmp_out,
        format="WEBP",
        save_all=True,
        append_images=out_frames[1:],
        duration=durations,
        loop=0,
        quality=82,
        method=4
    )

    # Atomic replace
    os.replace(tmp_out, loop_path)
    size_mb = os.path.getsize(loop_path) / (1024 * 1024)
    elapsed = time.time() - t0
    return f"[OK] {rel:<12} -> 1920x1080 ({n_frames} frames, {size_mb:.1f} MB in {elapsed:.1f}s)"


def main():
    print("==================================================")
    print(" RECONSTRUYENDO 9 PASILLOS A 1080P HD NATIVO")
    print("==================================================")
    start_total = time.time()

    workers = min(8, len(CORRIDORS))
    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process_single_corridor, c): c for c in CORRIDORS}
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            print(f"  {res}")

    total_time = time.time() - start_total
    print(f"\n[FINALIZADO] Los 9 pasillos ahora tienen resolución nativa 1080p ({total_time:.1f}s total)!")


if __name__ == "__main__":
    main()
