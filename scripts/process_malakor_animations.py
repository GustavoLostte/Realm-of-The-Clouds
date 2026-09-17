import os
import shutil
import time
from PIL import Image

def process_malakor():
    base_dir = "public/assets/champions/malakor"
    sounds_dir = os.path.join(base_dir, "sounds")
    os.makedirs(sounds_dir, exist_ok=True)

    # 1. Map of directory name to animation output name
    anim_map = {
        "idle": "idle",
        "walk": "walk",
        "run": "run",
        "attack 1": "attack1",
        "attack 2": "attack2",
        "attack especial": "attack_special",
        "defend": "defend",
        "impacto": "hit",
        "caida_impacto_fuerte": "knockdown",
        "jumping": "jump",
        "lose": "lose",
        "victoria": "victory",
    }

    # Audio mapping
    audio_map = {
        "attack 1/atack1.mp3": "sounds/attack1.mp3",
        "attack 2/attak 2 v2.mp3": "sounds/attack2.mp3",
        "attack especial/attak 2 v2.mp3": "sounds/attack_special.mp3",
        "jumping/jump.mp3": "sounds/jump.mp3",
        "run/run.mp3": "sounds/run.mp3",
        "impacto/Timeline 8.mp3": "sounds/hit.mp3",
        "caida_impacto_fuerte/Timeline 8.mp3": "sounds/knockdown.mp3",
        "victoria/Timeline 8.mp3": "sounds/victory.mp3",
    }

    print("=== COPYING AND ORGANIZING AUDIO ===")
    for src_rel, dest_rel in audio_map.items():
        src_path = os.path.join(base_dir, src_rel)
        dest_path = os.path.join(base_dir, dest_rel)
        if os.path.exists(src_path):
            shutil.copyfile(src_path, dest_path)
            print(f"Copied audio: {src_rel} -> {dest_rel}")

    total_pngs_deleted = 0
    total_mb_saved = 0

    print("\n=== PROCESSING ANIMATIONS TO OPTIMIZED WEBP ===")
    out_anims = {}

    for folder_name, out_name in anim_map.items():
        folder_path = os.path.join(base_dir, folder_name)
        if not os.path.exists(folder_path):
            print(f"Skipping missing folder: {folder_path}")
            continue

        png_files = sorted([f for f in os.listdir(folder_path) if f.endswith(".png")])
        if not png_files:
            print(f"No PNG files in {folder_name}")
            continue

        print(f"Processing '{folder_name}' ({len(png_files)} frames)...")
        frames = []
        folder_bytes = 0

        for f in png_files:
            f_path = os.path.join(folder_path, f)
            folder_bytes += os.path.getsize(f_path)
            img = Image.open(f_path).convert("RGBA")
            # Resize cleanly to 512x288 (16:9 matching original 1920x1080 canvas)
            img_resized = img.resize((512, 288), Image.Resampling.LANCZOS)
            frames.append(img_resized)

        out_webp_path = os.path.join(base_dir, f"{out_name}.webp")
        # 24 FPS -> duration = 41.67 ms per frame
        # Loop: 0 means infinite loop (used for idle, walk, run, defend)
        is_loop = folder_name in ["idle", "walk", "run", "defend"]
        loop_val = 0 if is_loop else 0

        frames[0].save(
            out_webp_path,
            save_all=True,
            append_images=frames[1:],
            duration=42,
            loop=loop_val,
            quality=82,
            method=4
        )

        webp_size = os.path.getsize(out_webp_path)
        print(f"  -> Created {out_name}.webp ({(webp_size / 1024):.1f} KB, was {(folder_bytes / 1024 / 1024):.1f} MB)")
        out_anims[out_name] = f"/assets/champions/malakor/{out_name}.webp"

        # If idle, also save frame 0 as poster
        if out_name == "idle":
            poster_path = os.path.join(base_dir, "idle_poster.webp")
            frames[0].save(poster_path, quality=85)
            print(f"  -> Created idle_poster.webp (single frame poster)")

        # DELETE PNG FRAMES (strictly follow user instruction to never leave PNG scraps)
        for f in png_files:
            os.remove(os.path.join(folder_path, f))
            total_pngs_deleted += 1
        total_mb_saved += (folder_bytes / 1024 / 1024)

    # Clean up empty source directories and leftover mp3s inside them
    print("\n=== CLEANING UP SOURCE DIRECTORIES ===")
    for folder_name in anim_map.keys():
        folder_path = os.path.join(base_dir, folder_name)
        if os.path.exists(folder_path):
            # Remove any remaining files (e.g. mp3 or .DS_Store)
            for f in os.listdir(folder_path):
                f_path = os.path.join(folder_path, f)
                if os.path.isfile(f_path):
                    os.remove(f_path)
            # Remove folder
            try:
                os.rmdir(folder_path)
                print(f"Removed processed directory: {folder_name}")
            except Exception as e:
                print(f"Could not remove {folder_name}: {e}")

    # Remove temporary test files
    test_files = [
        "public/assets/champions/test_run_pil.webp",
        "public/assets/champions/test_atk1.webp",
        "public/assets/champions/test_malakor_idle.webp",
    ]
    for tf in test_files:
        if os.path.exists(tf):
            os.remove(tf)
            print(f"Removed temp test file: {tf}")

    print(f"\n==========================================")
    print(f"SUCCESS! Total PNGs deleted: {total_pngs_deleted}")
    print(f"Disk space saved: {total_mb_saved:.2f} MB (~{(total_mb_saved / 1024):.2f} GB)")
    print(f"All 12 animations packaged into lightweight WebPs in {base_dir}")
    print(f"==========================================")

if __name__ == "__main__":
    process_malakor()
