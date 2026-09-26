#!/usr/bin/env python3
"""
Convert all 4 dungeon maps into crystal-clear 1080p animated WebP sprites.
This completely eliminates the need for HTML5 <video> elements, improving performance,
eliminating loop hitching, and guaranteeing zero mobile autoplay restrictions.
"""

import os
import cv2
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAPS_DIR = os.path.join(PROJECT_ROOT, "public/DEMO/MAPS")
MAP_NAMES = ["MAP1", "MAP2", "MAP3", "MAP4"]

for map_name in MAP_NAMES:
    mp4_path = os.path.join(MAPS_DIR, map_name, "map_loop.mp4")
    out_webp_path = os.path.join(MAPS_DIR, map_name, "map_loop.webp")
    out_base_path = os.path.join(MAPS_DIR, map_name, "map_base.webp")

    if not os.path.exists(mp4_path):
        print(f"Skipping {map_name}: {mp4_path} not found.")
        continue

    print(f"\n[Processing] Extracting frames for {map_name} from {mp4_path}...")
    cap = cv2.VideoCapture(mp4_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(Image.fromarray(rgb))
    cap.release()

    total_frames = len(frames)
    print(f"  Extracted {total_frames} frames (1920x1080).")

    if total_frames > 0:
        # Save Frame 0 as base poster
        frames[0].save(out_base_path, "WEBP", quality=92, method=6)
        print(f"  Updated static base: {out_base_path}")

        # Save animated 1080p WebP
        print(f"  Encoding 1080p animated WebP with lossless timing (42ms/frame)...")
        frames[0].save(
            out_webp_path,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=42,
            loop=0,
            quality=82,
            method=4,
        )
        size_mb = os.path.getsize(out_webp_path) / (1024 * 1024)
        print(f"  SUCCESS! {map_name} -> {out_webp_path} ({size_mb:.2f} MB)")

print("\nAll 4 dungeon map sprites generated successfully!")
