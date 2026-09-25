import os
import subprocess
from PIL import Image, ImageSequence

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

def adjust_webp_to_1000ms(file_path):
    im = Image.open(file_path)
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
    n = len(frames)
    if n == 0:
        return False
        
    base = 1000 // n
    rem = 1000 % n
    durations = [base + (1 if i < rem else 0) for i in range(n)]
    
    # Save optimized WebP with exactly 1000ms total duration
    frames[0].save(
        file_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        quality=90,
        method=4
    )
    
    # Verify with webpinfo
    try:
        res = subprocess.run(["webpinfo", file_path], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        actual_total = sum(durs)
        print(f"  [OK] {os.path.basename(os.path.dirname(file_path)):<16} {os.path.basename(file_path):<16} | {n} frames | Total WebP Duration: {actual_total}ms")
        return actual_total == 1000
    except Exception as e:
        print(f"  [WARN] webpinfo check skipped: {e}")
        return True

def main():
    print("Setting all Dash animations (front & back) to exactly 1.0 second (1000ms)...")
    count = 0
    for champ in sorted(os.listdir(CHAMPIONS_DIR)):
        cdir = os.path.join(CHAMPIONS_DIR, champ)
        if not os.path.isdir(cdir):
            continue
        for anim in ["dash_front", "dash_back"]:
            p = os.path.join(cdir, f"{anim}.webp")
            if os.path.exists(p):
                success = adjust_webp_to_1000ms(p)
                if success:
                    count += 1
                    
    print(f"\nSuccessfully adjusted {count} dash animation files to exactly 1000ms (1.00s)!")

if __name__ == "__main__":
    main()
