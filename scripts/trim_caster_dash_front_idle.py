import os
from PIL import Image, ImageSequence

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

TRIM_CONFIG = {
    "MAGE_MALE": 18,      # Keep frames 0 to 17 (ends exactly on frame 17)
    "MAGE_FEMALE": 18,    # Keep frames 0 to 17 (ends exactly on frame 17)
    "HEALER_MALE": 18,    # Keep frames 0 to 17 (ends exactly on frame 17)
    "HEALER_FEMALE": 18,  # Keep frames 0 to 17 (ends exactly on frame 17)
}

def trim_dash_front(champ_name, keep_count):
    dash_path = os.path.join(CHAMPIONS_DIR, champ_name, "dash_front.webp")
    if not os.path.exists(dash_path):
        print(f"Error: {dash_path} not found")
        return False
        
    im = Image.open(dash_path)
    total_frames = im.n_frames
    durations = [f.info.get("duration", 44) for f in ImageSequence.Iterator(im)]
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
    
    kept_frames = frames[:keep_count]
    kept_durations = durations[:keep_count]
    discarded = total_frames - keep_count
    
    kept_frames[0].save(
        dash_path,
        save_all=True,
        append_images=kept_frames[1:],
        duration=kept_durations,
        loop=0,
        quality=90,
        method=4
    )
    
    print(f"[OK] {champ_name}: trimmed from {total_frames} frames to {keep_count} frames (removed {discarded} idle frames).")
    print(f"     New animation duration: {sum(kept_durations)}ms")
    return True

def main():
    print("Trimming extra idle frames from Casters dash_front...")
    for champ, count in TRIM_CONFIG.items():
        trim_dash_front(champ, count)
    print("\nTrimming completed successfully!")

if __name__ == "__main__":
    main()
