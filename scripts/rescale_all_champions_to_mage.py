import os
import glob
from PIL import Image, ImageSequence
import numpy as np
from concurrent.futures import ProcessPoolExecutor

CHAMPIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/CHAMPIONS"))

# Targets derived from MAGE_MALE idle (the user's perfect standard)
# MAGE_MALE idle: height ~270px, grounded at bottom 286-288, center X ~252
TARGET_MALE_HEIGHT = 270.0
TARGET_FEMALE_HEIGHT = 275.0
TARGET_FOOT_Y = 286.0
TARGET_CENTER_X = 252.0

def create_avatar_from_frame(frame, out_path, size=(256, 256)):
    """Create a focused head/torso portrait avatar from character frame."""
    arr = np.array(frame)
    alpha = arr[:, :, 3]
    y_idx, x_idx = np.where(alpha > 30)
    if len(y_idx) > 0 and len(x_idx) > 0:
        min_y, max_y = np.min(y_idx), np.max(y_idx)
        min_x, max_x = np.min(x_idx), np.max(x_idx)
        char_h = max_y - min_y
        
        # Focus on head + upper torso (top 45% of character height)
        head_top = max(0, min_y - int(char_h * 0.05))
        head_bottom = min(frame.height, min_y + int(char_h * 0.45))
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
    print(f"  [Avatar]  -> {os.path.basename(out_path)} ({os.path.getsize(out_path)/1024:.1f} KB)")
    return out_path

def process_champion(champ_name):
    champ_dir = os.path.join(CHAMPIONS_DIR, champ_name)
    if not os.path.isdir(champ_dir):
        return None
        
    print(f"\n==================================================")
    print(f"RESCALING CHAMPION TO MAGE STANDARD: {champ_name}")
    print(f"==================================================")
    
    is_female = "FEMALE" in champ_name
    target_h = TARGET_FEMALE_HEIGHT if is_female else TARGET_MALE_HEIGHT
    
    # Read original idle frame 0
    idle_path = os.path.join(champ_dir, "idle.webp")
    if not os.path.exists(idle_path):
        print(f"Error: {idle_path} not found!")
        return None
        
    im_idle = Image.open(idle_path)
    f0_idle = next(ImageSequence.Iterator(im_idle)).convert("RGBA")
    bb0 = f0_idle.getbbox()
    if not bb0:
        print(f"Error: Empty bounding box for {champ_name} idle!")
        return None
        
    h_orig = float(bb0[3] - bb0[1])
    foot_orig = float(bb0[3])
    cx_orig = float(bb0[0] + bb0[2]) / 2.0
    
    master_scale = target_h / h_orig
    print(f"  Baseline: h={h_orig:.1f}, foot={foot_orig:.1f}, cx={cx_orig:.1f} -> Target: h={target_h:.1f}, foot={TARGET_FOOT_Y:.1f}")
    print(f"  Master Scale: {master_scale:.4f}")
    
    # Process all animations
    anim_files = sorted(glob.glob(os.path.join(champ_dir, "*.webp")))
    saved_new_idle_f0 = None
    
    for anim_path in anim_files:
        fname = os.path.basename(anim_path)
        if "avatar" in fname or "poster" in fname:
            continue
            
        im = Image.open(anim_path)
        durations = [f.info.get("duration", 44) for f in ImageSequence.Iterator(im)]
        frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
        
        # Determine total unscaled motion span across frames
        min_ux, max_ux = 9999, -9999
        for f in frames:
            bb = f.getbbox()
            if bb:
                min_ux = min(min_ux, bb[0])
                max_ux = max(max_ux, bb[2])
        span_u = max_ux - min_ux
        
        s = master_scale
        # If wide movement would exceed 512 canvas, adjust scale for this action
        if span_u * s > 504:
            s = 500.0 / span_u
            print(f"  -> Action {fname}: Adjusted scale to {s:.4f} to fit span ({span_u}px)")
            
        new_w = int(round(512 * s))
        new_h = int(round(288 * s))
        
        offset_y = int(round(TARGET_FOOT_Y - foot_orig * s))
        raw_offset_x = int(round(TARGET_CENTER_X - cx_orig * s))
        
        # Scale frames
        scaled_frames = [f.resize((new_w, new_h), Image.Resampling.LANCZOS) for f in frames]
        
        # Check X bounds across all scaled frames
        min_sx, max_sx = 9999, -9999
        for sf in scaled_frames:
            bb = sf.getbbox()
            if bb:
                min_sx = min(min_sx, bb[0] + raw_offset_x)
                max_sx = max(max_sx, bb[2] + raw_offset_x)
                
        # Gentle shift to guarantee inside [6, 506]
        shift_x = 0
        if min_sx < 6:
            shift_x = 6 - min_sx
        elif max_sx > 506:
            shift_x = 506 - max_sx
            
        final_offset_x = raw_offset_x + shift_x
        
        # Compose onto standard 512x288 canvases
        out_frames = []
        for sf in scaled_frames:
            canvas = Image.new("RGBA", (512, 288), (0, 0, 0, 0))
            canvas.paste(sf, (final_offset_x, offset_y), sf)
            out_frames.append(canvas)
            
        # Overwrite with rescaled animation
        out_frames[0].save(
            anim_path,
            save_all=True,
            append_images=out_frames[1:],
            duration=durations,
            loop=0,
            quality=85,
            method=4
        )
        
        print(f"  [Anim]    -> {fname:16} ({os.path.getsize(anim_path)/1024:.1f} KB, {len(out_frames)} frames)")
        
        if fname == "idle.webp":
            saved_new_idle_f0 = out_frames[0]
            # Update idle_poster.webp
            poster_path = os.path.join(champ_dir, "idle_poster.webp")
            saved_new_idle_f0.save(poster_path, "WEBP", quality=90, method=4)
            print(f"  [Poster]  -> idle_poster.webp ({os.path.getsize(poster_path)/1024:.1f} KB)")
            
    # Update avatar.webp from the new high-res idle frame
    if saved_new_idle_f0:
        avatar_path = os.path.join(champ_dir, "avatar.webp")
        create_avatar_from_frame(saved_new_idle_f0, avatar_path)
        
    print(f"-> COMPLETED: {champ_name} perfectly matched to Mage standard!")
    return champ_name

def rescale_caster_dash_front(champ_name):
    champ_dir = os.path.join(CHAMPIONS_DIR, champ_name)
    dash_path = os.path.join(champ_dir, "dash_front.webp")
    idle_path = os.path.join(champ_dir, "idle.webp")
    if not os.path.exists(dash_path) or not os.path.exists(idle_path):
        return None
        
    print(f"\nRescaling dash_front to 1.0x for caster: {champ_name}")
    idle_im = Image.open(idle_path)
    f_idle = next(ImageSequence.Iterator(idle_im)).convert("RGBA")
    bb_idle = f_idle.getbbox()
    idle_h = float(bb_idle[3] - bb_idle[1])
    idle_foot = float(bb_idle[3])
    idle_cx = float(bb_idle[0] + bb_idle[2]) / 2.0
    
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
        
    out_frames[0].save(
        dash_path,
        save_all=True,
        append_images=out_frames[1:],
        duration=durations,
        loop=0,
        quality=88,
        method=4
    )
    print(f"  [Anim] -> {champ_name} dash_front.webp at full 1.0x scale!")

def main():
    # Champions that were small (Kina and Paladin)
    to_rescale = [
        "KINA_MALE",
        "KINA_FEMALE",
        "PALADIN_MALE",
        "PALADIN_FEMALE",
    ]
    
    for c in to_rescale:
        process_champion(c)
        
    # Also rescale dash_front for the 4 mages/healers
    for c in ["MAGE_MALE", "MAGE_FEMALE", "HEALER_MALE", "HEALER_FEMALE"]:
        rescale_caster_dash_front(c)
        
    print("\n==================================================")
    print("ALL CHAMPIONS SUCCESSFULLY RESCALED TO MAGE STANDARD!")
    print("==================================================")

if __name__ == "__main__":
    main()
