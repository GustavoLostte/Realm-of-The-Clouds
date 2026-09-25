import os
import glob
import subprocess
import shutil
from concurrent.futures import ProcessPoolExecutor, as_completed
from PIL import Image
import numpy as np

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))
TARGET_SIZE = (512, 288)

def clean_and_resize_frame(img_path):
    """Clean alpha noise <= 15 and resize to standard 512x288 via Lanczos."""
    im = Image.open(img_path).convert("RGBA")
    arr = np.array(im)
    # Zero out low-alpha background noise
    mask = arr[:, :, 3] <= 15
    arr[mask, 3] = 0
    cleaned = Image.fromarray(arr)
    return cleaned.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

def create_avatar(first_frame_path, out_path, size=(256, 256)):
    """Create a focused head/torso portrait avatar from the character bounding box."""
    im = Image.open(first_frame_path).convert("RGBA")
    arr = np.array(im)
    mask = arr[:, :, 3] <= 15
    arr[mask, 3] = 0
    cleaned = Image.fromarray(arr)
    
    # Calculate character bounding box
    alpha = arr[:, :, 3]
    y_idx, x_idx = np.where(alpha > 30)
    if len(y_idx) > 0 and len(x_idx) > 0:
        min_y, max_y = np.min(y_idx), np.max(y_idx)
        min_x, max_x = np.min(x_idx), np.max(x_idx)
        char_h = max_y - min_y
        char_w = max_x - min_x
        
        # Focus on head + upper torso (top 45% of character height)
        head_top = max(0, min_y - int(char_h * 0.05))
        head_bottom = min(im.height, min_y + int(char_h * 0.45))
        center_x = (min_x + max_x) // 2
        
        box_dim = int(head_bottom - head_top)
        half_box = box_dim // 2
        crop_x1 = max(0, center_x - half_box)
        crop_x2 = min(im.width, center_x + half_box)
        
        # Ensure square
        crop_w = crop_x2 - crop_x1
        crop_h = head_bottom - head_top
        side = max(crop_w, crop_h)
        
        crop_im = cleaned.crop((crop_x1, head_top, crop_x1 + side, head_top + side))
        avatar = crop_im.resize(size, Image.Resampling.LANCZOS)
    else:
        # Fallback to center crop
        avatar = cleaned.resize(size, Image.Resampling.LANCZOS)
        
    avatar.save(out_path, "WEBP", quality=90, method=4)
    print(f"  [Avatar] -> {os.path.basename(out_path)} ({os.path.getsize(out_path)/1024:.1f} KB)")
    return out_path

def save_animated_webp(frame_paths, out_path, frame_duration_ms=44, loop=0, quality=82):
    """Generate animated WebP with method=4 for fast, high-quality compression."""
    frames = [clean_and_resize_frame(p) for p in frame_paths]
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=frame_duration_ms,
        loop=loop,
        quality=quality,
        method=4
    )
    kb = os.path.getsize(out_path) / 1024
    print(f"  [WebP] -> {os.path.basename(out_path)} ({kb:.1f} KB, {len(frames)} frames @ {frame_duration_ms}ms)")
    return out_path

def convert_mp3_to_ogg(mp3_path, out_ogg_path):
    """Convert and compress MP3 to OGG Vorbis with native ffmpeg."""
    os.makedirs(os.path.dirname(out_ogg_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", mp3_path,
        "-c:a", "vorbis", "-strict", "-2",
        "-q:a", "2",
        out_ogg_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    kb = os.path.getsize(out_ogg_path) / 1024
    print(f"  [OGG]  -> {os.path.basename(out_ogg_path)} ({kb:.1f} KB)")
    return out_ogg_path

def process_single_champion(champ_dir_name):
    champ_path = os.path.join(CHAMPIONS_DIR, champ_dir_name)
    if not os.path.isdir(champ_path):
        return None
        
    print(f"\n==================================================")
    print(f"PROCESSING CHAMPION: {champ_dir_name}")
    print(f"==================================================")
    
    sounds_dir = os.path.join(champ_path, "sounds")
    os.makedirs(sounds_dir, exist_ok=True)
    
    generated_webps = []
    generated_oggs = []
    dirs_to_clean = []
    
    # Process animation directories
    anim_subdirs = sorted([d for d in os.listdir(champ_path) if os.path.isdir(os.path.join(champ_path, d)) and d != "sounds"])
    
    idle_first_frame = None
    
    for anim_dir_name in anim_subdirs:
        anim_path = os.path.join(champ_path, anim_dir_name)
        norm_anim = anim_dir_name.lower().strip()
        
        # Collect PNGs
        png_files = sorted(
            [os.path.join(anim_path, f) for f in os.listdir(anim_path) if f.lower().endswith(".png")],
            key=lambda x: x.lower()
        )
        # Collect MP3s
        mp3_files = [os.path.join(anim_path, f) for f in os.listdir(anim_path) if f.lower().endswith(".mp3")]
        
        if not png_files:
            continue
            
        dirs_to_clean.append((anim_path, png_files, mp3_files))
        
        out_webp_name = f"{norm_anim}.webp"
        out_webp_path = os.path.join(champ_path, out_webp_name)
        
        # Save animated WebP
        save_animated_webp(png_files, out_webp_path, frame_duration_ms=44, loop=0)
        generated_webps.append(out_webp_path)
        
        if norm_anim == "idle":
            idle_first_frame = png_files[0]
            # Also create static idle_poster.webp
            poster_path = os.path.join(champ_path, "idle_poster.webp")
            poster_im = clean_and_resize_frame(idle_first_frame)
            poster_im.save(poster_path, "WEBP", quality=85, method=4)
            generated_webps.append(poster_path)
            print(f"  [Poster] -> idle_poster.webp ({os.path.getsize(poster_path)/1024:.1f} KB)")
            
        # Process MP3 if present
        if mp3_files:
            out_ogg_name = f"{norm_anim}.ogg"
            out_ogg_path = os.path.join(sounds_dir, out_ogg_name)
            convert_mp3_to_ogg(mp3_files[0], out_ogg_path)
            generated_oggs.append(out_ogg_path)
            
    # Generate avatar if idle frame was found
    if idle_first_frame:
        avatar_path = os.path.join(champ_path, "avatar.webp")
        create_avatar(idle_first_frame, avatar_path)
        generated_webps.append(avatar_path)
        
    # VALIDATION STEP: Verify all generated files are valid and non-empty
    all_valid = True
    for w in generated_webps:
        if not os.path.exists(w) or os.path.getsize(w) < 500:
            print(f"ERROR: WebP validation failed for {w}")
            all_valid = False
            
    for o in generated_oggs:
        if not os.path.exists(o) or os.path.getsize(o) < 500:
            print(f"ERROR: OGG validation failed for {o}")
            all_valid = False
            
    if not all_valid:
        raise RuntimeError(f"Validation failed for champion {champ_dir_name}! Aborting deletion.")
        
    print(f"-> VALIDATION PASSED for {champ_dir_name}: {len(generated_webps)} WebPs, {len(generated_oggs)} OGGs.")
    
    # SAFE DELETION: Delete original PNGs, MP3s, and subdirs
    deleted_pngs_count = 0
    deleted_mp3s_count = 0
    
    for anim_path, png_files, mp3_files in dirs_to_clean:
        for p in png_files:
            if os.path.exists(p):
                os.remove(p)
                deleted_pngs_count += 1
        for m in mp3_files:
            if os.path.exists(m):
                os.remove(m)
                deleted_mp3s_count += 1
        # If directory is now empty, remove directory
        try:
            if os.path.exists(anim_path) and not os.listdir(anim_path):
                os.rmdir(anim_path)
        except Exception:
            pass
            
    print(f"-> CLEANUP COMPLETE for {champ_dir_name}: Deleted {deleted_pngs_count} raw PNGs and {deleted_mp3s_count} MP3s.")
    return {
        "champion": champ_dir_name,
        "webps": len(generated_webps),
        "oggs": len(generated_oggs),
        "deleted_pngs": deleted_pngs_count,
        "deleted_mp3s": deleted_mp3s_count
    }

def run_all():
    print("==================================================")
    print("STARTING FULL CHAMPIONS PROCESSING PIPELINE")
    print(f"Root: {CHAMPIONS_DIR}")
    print("==================================================")
    
    champions = sorted([d for d in os.listdir(CHAMPIONS_DIR) if os.path.isdir(os.path.join(CHAMPIONS_DIR, d)) and not d.startswith(".")])
    print(f"Found {len(champions)} champions: {champions}")
    
    results = []
    # Process champions with a ProcessPoolExecutor (concurrency = 4 for CPU balance)
    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(process_single_champion, c): c for c in champions}
        for future in as_completed(futures):
            c_name = futures[future]
            try:
                res = future.result()
                if res:
                    results.append(res)
            except Exception as e:
                print(f"CRITICAL ERROR processing {c_name}: {e}")
                raise
                
    print("\n==================================================")
    print("PIPELINE EXECUTION SUMMARY")
    print("==================================================")
    total_webps = sum(r["webps"] for r in results)
    total_oggs = sum(r["oggs"] for r in results)
    total_pngs = sum(r["deleted_pngs"] for r in results)
    total_mp3s = sum(r["deleted_mp3s"] for r in results)
    print(f"Processed {len(results)} champions.")
    print(f"Total Animated WebPs Generated: {total_webps}")
    print(f"Total OGG Audio Files Generated: {total_oggs}")
    print(f"Total Raw PNGs Deleted: {total_pngs}")
    print(f"Total Raw MP3s Deleted: {total_mp3s}")
    
    # Calculate final size of CHAMPIONS directory
    total_bytes = 0
    for dirpath, dirnames, filenames in os.walk(CHAMPIONS_DIR):
        for f in filenames:
            total_bytes += os.path.getsize(os.path.join(dirpath, f))
    print(f"Final CHAMPIONS Directory Size: {total_bytes / (1024*1024):.2f} MB")
    print("==================================================")

if __name__ == "__main__":
    run_all()
