import os
import glob
import subprocess
from PIL import Image, ImageSequence
import numpy as np

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

def get_webp_durations(webp_path):
    try:
        res = subprocess.run(["webpinfo", webp_path], capture_output=True, text=True)
        lines = [l for l in res.stdout.split("\n") if "Duration:" in l]
        durs = [int(l.split("Duration:")[1].strip()) for l in lines]
        if durs:
            return durs
    except Exception:
        pass
    im = Image.open(webp_path)
    return [f.info.get("duration", 44) for f in ImageSequence.Iterator(im)]

def create_avatar_from_frame(frame, out_path, size=(256, 256)):
    arr = np.array(frame)
    alpha = arr[:, :, 3]
    y_idx, x_idx = np.where(alpha > 40)
    if len(y_idx) > 0 and len(x_idx) > 0:
        min_y, max_y = np.min(y_idx), np.max(y_idx)
        min_x, max_x = np.min(x_idx), np.max(x_idx)
        char_h = max_y - min_y
        
        # Focus on head + upper torso (top 50% of character height)
        head_top = max(0, min_y - int(char_h * 0.04))
        head_bottom = min(frame.height, min_y + int(char_h * 0.52))
        center_x = (min_x + max_x) // 2
        
        box_dim = int(head_bottom - head_top)
        half_box = box_dim // 2
        crop_x1 = max(0, center_x - half_box)
        crop_x2 = min(frame.width, center_x + half_box)
        
        crop_w = crop_x2 - crop_x1
        crop_h = head_bottom - head_top
        side = max(crop_w, crop_h)
        
        crop_im = frame.crop((crop_x1, head_top, crop_x1 + side, head_top + side))
        avatar = crop_im.resize(size, Image.Resampling.LANCZOS)
    else:
        avatar = frame.resize(size, Image.Resampling.LANCZOS)
        
    avatar.save(out_path, "WEBP", quality=92, method=4)
    print(f"  [Avatar] -> {os.path.basename(out_path)} ({os.path.getsize(out_path)/1024:.1f} KB)")

def rescale_champion_kina(champ_name, scale=0.75):
    cdir = os.path.join(CHAMPIONS_DIR, champ_name)
    if not os.path.isdir(cdir):
        print(f"Directory not found: {cdir}")
        return False
        
    print(f"\n==================================================")
    print(f"RESCALING {champ_name} BY -25% (Scale = {scale:.2f})")
    print(f"==================================================")
    
    pivot_x = 251.0
    pivot_y = 278.0
    
    new_w = int(round(512 * scale))
    new_h = int(round(288 * scale))
    paste_x = int(round(pivot_x * (1 - scale)))
    paste_y = int(round(pivot_y * (1 - scale)))
    
    anims = ["idle.webp", "walk.webp", "run.webp", "jump.webp", "dash_front.webp", "dash_back.webp"]
    first_idle_frame = None
    
    for anim_name in anims:
        p = os.path.join(cdir, anim_name)
        if not os.path.exists(p):
            print(f"  [SKIP] Missing {anim_name}")
            continue
            
        durations = get_webp_durations(p)
        im = Image.open(p)
        frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
        
        out_frames = []
        for f in frames:
            scaled_f = f.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (512, 288), (0, 0, 0, 0))
            canvas.paste(scaled_f, (paste_x, paste_y), scaled_f)
            out_frames.append(canvas)
            
        if anim_name == "idle.webp" and len(out_frames) > 0:
            first_idle_frame = out_frames[0].copy()
            
        out_frames[0].save(
            p,
            save_all=True,
            append_images=out_frames[1:],
            duration=durations,
            loop=0,
            quality=92,
            method=4
        )
        
        # Verify result
        chk_im = Image.open(p)
        chk_f0 = np.array(next(ImageSequence.Iterator(chk_im)).convert("RGBA"))
        ay, ax = np.where(chk_f0[:, :, 3] > 80)
        h = (ay.max() - ay.min()) if len(ay) else 0
        cx = ((ax.min() + ax.max()) / 2.0) if len(ax) else 0
        foot = ay.max() if len(ay) else 0
        print(f"  [OK] {anim_name:<16} {len(out_frames):2d} frames | sum: {sum(durations)}ms | h={h}px, cx={cx:.1f}, foot={foot}")

    # Update idle poster
    if first_idle_frame:
        poster_p = os.path.join(cdir, "idle_poster.webp")
        first_idle_frame.save(poster_p, "WEBP", quality=92, method=4)
        print(f"  [Poster] -> idle_poster.webp")
        
        avatar_p = os.path.join(cdir, "avatar.webp")
        create_avatar_from_frame(first_idle_frame, avatar_p)

    return True

def main():
    print("Rescaling KINA (Knight) by -25%...")
    rescale_champion_kina("KINA_MALE", scale=0.75)
    rescale_champion_kina("KINA_FEMALE", scale=0.75)
    print("\nSuccessfully rescaled KINA MALE and KINA FEMALE by 25%!")

if __name__ == "__main__":
    main()
