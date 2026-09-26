import cv2
import numpy as np
import glob
import os
import json
import subprocess

out_dir = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings/archer_tower"
tmp_dir = "/tmp/tower_frames"
os.makedirs(out_dir, exist_ok=True)
os.makedirs(f"{tmp_dir}/idle", exist_ok=True)
os.makedirs(f"{tmp_dir}/const", exist_ok=True)

idle_files = sorted(glob.glob("/Users/wizzard/Desktop/TOC FOE/public/assets/building/archert tower/idle/*.png"))
const_files = sorted(glob.glob("/Users/wizzard/Desktop/TOC FOE/public/assets/building/archert tower/construccion/*.png"))

TARGET_W, TARGET_H = 320, 360
CROP_X1, CROP_X2 = 480, 1440
CROP_Y1, CROP_Y2 = 0, 1080

def clean_and_crop(f):
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    if im.dtype == np.uint16:
        im = (im / 256).astype(np.uint8)
    cropped = im[CROP_Y1:CROP_Y2, CROP_X1:CROP_X2]
    # Zero out background noise where alpha < 35
    mask = cropped[:, :, 3] < 35
    cropped[mask] = [0, 0, 0, 0]
    # Resize
    resized = cv2.resize(cropped, (TARGET_W, TARGET_H), interpolation=cv2.INTER_AREA)
    # Ensure zeroed background remains zeroed after resize
    mask_small = resized[:, :, 3] < 15
    resized[mask_small] = [0, 0, 0, 0]
    return resized

print(f"Processing {len(idle_files)} idle frames...")
idle_pngs = []
idle_frames = []
for i, f in enumerate(idle_files):
    frame = clean_and_crop(f)
    idle_frames.append(frame)
    p = f"{tmp_dir}/idle/frame_{i:03d}.png"
    cv2.imwrite(p, frame)
    idle_pngs.append(p)

print(f"Processing {len(const_files)} construccion frames (step 2)...")
const_pngs = []
const_frames = []
for i, f in enumerate(const_files[::2]): # step 2 = 67 frames
    frame = clean_and_crop(f)
    const_frames.append(frame)
    p = f"{tmp_dir}/const/frame_{i:03d}.png"
    cv2.imwrite(p, frame)
    const_pngs.append(p)

# Save poster frame (last frame of idle)
poster_path = os.path.join(out_dir, "archer_tower_poster.webp")
cv2.imwrite(poster_path, idle_frames[-1], [cv2.IMWRITE_WEBP_QUALITY, 92])
print("Saved poster frame.")

# Use img2webp to encode animated WebP for idle
idle_webp = os.path.join(out_dir, "archer_tower_idle.webp")
cmd_idle = [
    "img2webp", "-loop", "0", "-min_size", "-lossy", "-q", "85", "-m", "4",
    "-d", "50"
] + idle_pngs + ["-o", idle_webp]

subprocess.run(cmd_idle, check=True)
idle_size = os.path.getsize(idle_webp) / 1024
print(f"Idle animated WebP created: {idle_size:.1f} KB")

# Use img2webp to encode animated WebP for construccion
const_webp = os.path.join(out_dir, "archer_tower_construccion.webp")
cmd_const = [
    "img2webp", "-loop", "1", "-min_size", "-lossy", "-q", "80", "-m", "4",
    "-d", "45"
] + const_pngs + ["-o", const_webp]

subprocess.run(cmd_const, check=True)
const_size = os.path.getsize(const_webp) / 1024
print(f"Construccion animated WebP created: {const_size:.1f} KB")

# BUILD SPRITESHEET ATLAS FOR IDLE
COLS = 5
ROWS = 5
FRAME_W, FRAME_H = 160, 180
atlas_img = np.zeros((ROWS * FRAME_H, COLS * FRAME_W, 4), dtype=np.uint8)
atlas_json = {
    "meta": {
        "image": "archer_tower_idle_atlas.webp",
        "size": {"w": COLS * FRAME_W, "h": ROWS * FRAME_H},
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "totalFrames": len(idle_frames),
        "fps": 20
    },
    "frames": []
}

for idx, frm in enumerate(idle_frames):
    r = idx // COLS
    c = idx % COLS
    x = c * FRAME_W
    y = r * FRAME_H
    small_frm = cv2.resize(frm, (FRAME_W, FRAME_H), interpolation=cv2.INTER_AREA)
    atlas_img[y:y+FRAME_H, x:x+FRAME_W] = small_frm
    atlas_json["frames"].append({
        "name": f"idle_{idx}",
        "frame": {"x": x, "y": y, "w": FRAME_W, "h": FRAME_H}
    })

atlas_webp = os.path.join(out_dir, "archer_tower_idle_atlas.webp")
atlas_json_path = os.path.join(out_dir, "archer_tower_idle_atlas.json")
cv2.imwrite(atlas_webp, atlas_img, [cv2.IMWRITE_WEBP_QUALITY, 90])
with open(atlas_json_path, "w") as jf:
    json.dump(atlas_json, jf, indent=2)

atlas_size = os.path.getsize(atlas_webp) / 1024
print(f"Idle Atlas WebP created: {atlas_size:.1f} KB")

# BUILD SPRITESHEET ATLAS FOR CONSTRUCCION
C_COLS = 8
C_ROWS = 9
C_FRAME_W, C_FRAME_H = 120, 135
c_atlas_img = np.zeros((C_ROWS * C_FRAME_H, C_COLS * C_FRAME_W, 4), dtype=np.uint8)
c_atlas_json = {
    "meta": {
        "image": "archer_tower_const_atlas.webp",
        "size": {"w": C_COLS * C_FRAME_W, "h": C_ROWS * C_FRAME_H},
        "frameWidth": C_FRAME_W,
        "frameHeight": C_FRAME_H,
        "totalFrames": len(const_frames),
        "fps": 22
    },
    "frames": []
}

for idx, frm in enumerate(const_frames):
    r = idx // C_COLS
    c = idx % C_COLS
    x = c * C_FRAME_W
    y = r * C_FRAME_H
    small_frm = cv2.resize(frm, (C_FRAME_W, C_FRAME_H), interpolation=cv2.INTER_AREA)
    c_atlas_img[y:y+C_FRAME_H, x:x+C_FRAME_W] = small_frm
    c_atlas_json["frames"].append({
        "name": f"const_{idx}",
        "frame": {"x": x, "y": y, "w": C_FRAME_W, "h": C_FRAME_H}
    })

c_atlas_webp = os.path.join(out_dir, "archer_tower_const_atlas.webp")
c_atlas_json_path = os.path.join(out_dir, "archer_tower_const_atlas.json")
cv2.imwrite(c_atlas_webp, c_atlas_img, [cv2.IMWRITE_WEBP_QUALITY, 85])
with open(c_atlas_json_path, "w") as jf:
    json.dump(c_atlas_json, jf, indent=2)

c_atlas_size = os.path.getsize(c_atlas_webp) / 1024
print(f"Construccion Atlas WebP created: {c_atlas_size:.1f} KB")
print("ALL ARCHER TOWER ASSETS SUCCESSFULLY GENERATED!")
