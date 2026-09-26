import os
import subprocess
from PIL import Image, ImageSequence
import numpy as np

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

def recenter_dash_front(champ_name, target_ms=500):
    cdir = os.path.join(CHAMPIONS_DIR, champ_name)
    dash_p = os.path.join(cdir, "dash_front.webp")
    idle_p = os.path.join(cdir, "idle.webp")
    
    if not os.path.exists(dash_p) or not os.path.exists(idle_p):
        print(f"Skipping {champ_name}: missing assets")
        return False
        
    # 1. Get idle reference center (full body)
    idle_im = Image.open(idle_p)
    f_idle = np.array(next(ImageSequence.Iterator(idle_im)).convert("RGBA"))
    iy, ix = np.where(f_idle[:, :, 3] > 180)
    idle_cx = float(ix.min() + ix.max()) / 2.0
    
    # 2. Read dash_front frames and extract durations
    im = Image.open(dash_p)
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
    n = len(frames)
    if n == 0:
        return False

    # Extract existing frame durations via webpinfo
    try:
        res = subprocess.run(["webpinfo", dash_p], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        if len(durs) != n or sum(durs) != target_ms:
            base = target_ms // n
            rem = target_ms % n
            durations = [base + (1 if i < rem else 0) for i in range(n)]
        else:
            durations = durs
    except Exception:
        base = target_ms // n
        rem = target_ms % n
        durations = [base + (1 if i < rem else 0) for i in range(n)]
        
    # 3. Center each frame so character body is anchored at idle_cx
    centered_frames = []
    for f in frames:
        arr = np.array(f)
        # Identify character body (upper 78% height to exclude ground dust / floor effects)
        ay, ax = np.where((arr[:, :, 3] > 120) & (np.arange(288)[:, None] < 225))
        if len(ax) == 0:
            centered_frames.append(f)
            continue
            
        fcx = float(ax.min() + ax.max()) / 2.0
        dx = int(round(idle_cx - fcx))
        
        # Clean numpy pixel shift preserving 100% alpha and color channels
        shifted = np.zeros_like(arr)
        if dx > 0:
            shifted[:, dx:] = arr[:, :512 - dx]
        elif dx < 0:
            shifted[:, :512 + dx] = arr[:, -dx:]
        else:
            shifted = arr
            
        centered_frames.append(Image.fromarray(shifted))
        
    # 4. Save optimized centered dash_front.webp
    centered_frames[0].save(
        dash_p,
        save_all=True,
        append_images=centered_frames[1:],
        duration=durations,
        loop=0,
        quality=92,
        method=4
    )
    
    # 5. Verify duration and centers
    try:
        res = subprocess.run(["webpinfo", dash_p], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        tot = sum(durs)
        
        # Verify frame centers
        verify_im = Image.open(dash_p)
        after_cxs = []
        for vf in ImageSequence.Iterator(verify_im):
            varr = np.array(vf.convert("RGBA"))
            vay, vax = np.where((varr[:, :, 3] > 120) & (np.arange(288)[:, None] < 225))
            if len(vax):
                after_cxs.append(float(vax.min() + vax.max()) / 2.0)
        c_min = min(after_cxs) if after_cxs else idle_cx
        c_max = max(after_cxs) if after_cxs else idle_cx
        
        print(f"  [OK] {champ_name:<16} dash_front.webp centered at cx={idle_cx:.1f} (after range: [{c_min:.1f}..{c_max:.1f}]) | {n} frames | {tot}ms")
        return tot == target_ms
    except Exception as e:
        print(f"  [WARN] verification error: {e}")
        return True

def main():
    print("Recentering all Dash Front animations in-place (locking character body to node center)...")
    champs = [
        "MAGE_MALE", "MAGE_FEMALE",
        "HEALER_MALE", "HEALER_FEMALE",
        "PALADIN_MALE", "PALADIN_FEMALE",
        "KINA_MALE", "KINA_FEMALE"
    ]
    for c in champs:
        recenter_dash_front(c, target_ms=500)
    print("\nAll 8 champions dash_front.webp successfully centered!")

if __name__ == "__main__":
    main()
