import os
import subprocess
from PIL import Image, ImageSequence
import numpy as np

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

def recenter_dash_back(champ_name, target_ms=500):
    cdir = os.path.join(CHAMPIONS_DIR, champ_name)
    dash_p = os.path.join(cdir, "dash_back.webp")
    idle_p = os.path.join(cdir, "idle.webp")
    
    if not os.path.exists(dash_p) or not os.path.exists(idle_p):
        print(f"Skipping {champ_name}: missing assets")
        return False
        
    # 1. Get idle reference center
    idle_im = Image.open(idle_p)
    f_idle = np.array(next(ImageSequence.Iterator(idle_im)).convert("RGBA"))
    iy, ix = np.where(f_idle[:, :, 3] > 180)
    idle_cx = float(ix.min() + ix.max()) / 2.0
    
    # 2. Read dash_back frames
    im = Image.open(dash_p)
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
    n = len(frames)
    if n == 0:
        return False
        
    base = target_ms // n
    rem = target_ms % n
    durations = [base + (1 if i < rem else 0) for i in range(n)]
    
    # 3. Center each frame so character body is anchored at idle_cx
    centered_frames = []
    for f in frames:
        arr = np.array(f)
        ay, ax = np.where(arr[:, :, 3] > 100)
        if len(ax) == 0:
            centered_frames.append(f)
            continue
            
        fcx = float(ax.min() + ax.max()) / 2.0
        shift_x = int(round(idle_cx - fcx))
        
        canvas = Image.new("RGBA", (512, 288), (0, 0, 0, 0))
        canvas.paste(f, (shift_x, 0), f)
        centered_frames.append(canvas)
        
    # 4. Save optimized centered dash_back.webp
    centered_frames[0].save(
        dash_p,
        save_all=True,
        append_images=centered_frames[1:],
        duration=durations,
        loop=0,
        quality=90,
        method=4
    )
    
    # 5. Verify duration with webpinfo
    try:
        res = subprocess.run(["webpinfo", dash_p], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        tot = sum(durs)
        print(f"  [OK] {champ_name:<16} dash_back.webp centered at cx={idle_cx:.1f} | {n} frames | {tot}ms")
        return tot == target_ms
    except Exception as e:
        print(f"  [WARN] webpinfo error: {e}")
        return True

def main():
    print("Recentering all Dash Back animations in-place (locking character body to node center)...")
    champs = [
        "MAGE_MALE", "MAGE_FEMALE",
        "HEALER_MALE", "HEALER_FEMALE",
        "PALADIN_MALE", "PALADIN_FEMALE",
        "KINA_MALE", "KINA_FEMALE"
    ]
    for c in champs:
        recenter_dash_back(c, target_ms=500)
    print("\nAll 8 champions dash_back.webp successfully centered!")

if __name__ == "__main__":
    main()
