import os
from PIL import Image, ImageSequence

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

def rescale_caster_dash_to_1x(champ_name):
    champ_dir = os.path.join(CHAMPIONS_DIR, champ_name)
    dash_path = os.path.join(champ_dir, "dash_front.webp")
    idle_path = os.path.join(champ_dir, "idle.webp")
    
    if not os.path.exists(dash_path) or not os.path.exists(idle_path):
        print(f"Skipping {champ_name}: file not found")
        return False
        
    print(f"\nRescaling {champ_name} dash_front to 1.0x (Mage Standard)...")
    
    # 1. Get idle targets
    idle_im = Image.open(idle_path)
    f_idle = next(ImageSequence.Iterator(idle_im)).convert("RGBA")
    bb_idle = f_idle.getbbox()
    idle_h = float(bb_idle[3] - bb_idle[1])
    idle_foot = float(bb_idle[3])
    idle_cx = float(bb_idle[0] + bb_idle[2]) / 2.0
    
    # 2. Read dash frames
    dash_im = Image.open(dash_path)
    durations = [f.info.get("duration", 44) for f in ImageSequence.Iterator(dash_im)]
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(dash_im)]
    
    f0 = frames[0]
    bb0 = f0.getbbox()
    dash_h = float(bb0[3] - bb0[1])
    
    ratio = idle_h / dash_h
    new_w = int(round(512 * ratio))
    new_h = int(round(288 * ratio))
    
    f0_scaled = f0.resize((new_w, new_h), Image.Resampling.LANCZOS)
    bb0_s = f0_scaled.getbbox()
    foot_s = float(bb0_s[3])
    cx_s = float(bb0_s[0] + bb0_s[2]) / 2.0
    
    off_x = int(round(idle_cx - cx_s))
    off_y = int(round(idle_foot - foot_s))
    
    out_frames = []
    for f in frames:
        sf = f.resize((new_w, new_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512, 288), (0, 0, 0, 0))
        canvas.paste(sf, (off_x, off_y), sf)
        out_frames.append(canvas)
        
    # Overwrite dash_front.webp
    out_frames[0].save(
        dash_path,
        save_all=True,
        append_images=out_frames[1:],
        duration=durations,
        loop=0,
        quality=88,
        method=4
    )
    
    res_bb = out_frames[0].getbbox()
    res_h = res_bb[3] - res_bb[1]
    print(f"  [OK] -> {champ_name} dash_front.webp: Height increased from {dash_h:.0f}px to {res_h:.0f}px (Target: {idle_h:.0f}px)")
    print(f"       Foot: {res_bb[3]}px, Center X: {(res_bb[0]+res_bb[2])/2:.1f}px")
    return True

def main():
    casters = ["MAGE_MALE", "MAGE_FEMALE", "HEALER_MALE", "HEALER_FEMALE"]
    for c in casters:
        rescale_caster_dash_to_1x(c)
    print("\nAll casters dash_front successfully increased to 1.0x!")

if __name__ == "__main__":
    main()
