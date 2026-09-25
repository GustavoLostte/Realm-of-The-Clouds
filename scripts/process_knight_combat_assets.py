#!/usr/bin/env python3
"""
Process and integrate combat animation and sound assets for Knight (Kina Male & Female).
Converts PNG sequences to animated WebP (512x288, 24 FPS) and MP3 sound effects to OGG Vorbis.
Pulls from starter raw folders, outputs to public/CHAMPIONS/ and public/assets/champions/starter/,
and purges source PNGs and MP3s upon successful verification.
"""

import os
import sys
import glob
import shutil
import subprocess
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHAMPIONS_DIR = os.path.join(PROJECT_ROOT, "public/CHAMPIONS")
STARTER_DIR = os.path.join(PROJECT_ROOT, "public/assets/champions/starter")

TARGET_SIZE = (512, 288)
FRAME_DURATION_MS = 42  # ~24 FPS

CONFIGS = {
    "knight_male": {
        "champ_key": "KINA_MALE",
        "scale": 191.0 / 536.0,
        "target_foot_y": 278.0,
        "raw_ground_y": 805.0,
        "root_cx": 894.0,
        "target_cx": 251.0,
        "raw_base_dir": os.path.join(STARTER_DIR, "knight_male"),
        "basic_subdirs": ["1", "2", "3"],
        "attack_basic_dir": os.path.join(STARTER_DIR, "knight_male/Attack Basic"),
        "attack2_dir": os.path.join(STARTER_DIR, "knight_male/ATACK_2"),
        "attack3_dir": os.path.join(STARTER_DIR, "knight_male/ATTACK_3"),
        "attack4_dir": os.path.join(STARTER_DIR, "knight_male/ATTACK_4"),
    },
    "knight_female": {
        "champ_key": "KINA_FEMALE",
        "scale": 182.0 / 547.0,
        "target_foot_y": 278.0,
        "raw_ground_y": 805.0,
        "root_cx": 890.0,
        "target_cx": 251.5,
        "raw_base_dir": os.path.join(STARTER_DIR, "knight_female"),
        "basic_subdirs": ["1", "2", "3"],
        "attack_basic_dir": os.path.join(STARTER_DIR, "knight_female/ATTACK_BASIC"),
        "attack2_dir": os.path.join(STARTER_DIR, "knight_female/ATTACK_2"),
        "attack3_dir": os.path.join(STARTER_DIR, "knight_female/ATTACK_3"),
        "attack4_dir": os.path.join(STARTER_DIR, "knight_female/ATTACK_4"),
    }
}


def process_frames_to_canvas(png_files, cfg):
    """Clean, scale, align and paste frames onto target 512x288 combat canvas."""
    s = cfg["scale"]
    new_w = int(round(1920 * s))
    new_h = int(round(1080 * s))
    paste_y = int(round(cfg["target_foot_y"] - cfg["raw_ground_y"] * s))
    paste_x = int(round(cfg["target_cx"] - cfg["root_cx"] * s))

    out_frames = []
    for f in png_files:
        im = Image.open(f).convert("RGBA")
        arr = np.array(im)

        # 1. Clear outer 1080p boundary noise & low-alpha compression artifacts
        arr[:8, :, 3] = 0
        arr[-8:, :, 3] = 0
        arr[:, :8, 3] = 0
        arr[:, -8:, 3] = 0
        arr[arr[:, :, 3] <= 15, 3] = 0

        # 2. Soft fade for bottom ground dust > y=815 to prevent sharp horizontal cut
        for row in range(815, 1080):
            factor = max(0.0, 1.0 - (row - 815) / 55.0)
            arr[row, :, 3] = (arr[row, :, 3].astype(float) * factor).astype(np.uint8)

        cleaned = Image.fromarray(arr)
        resized = cleaned.resize((new_w, new_h), Image.Resampling.LANCZOS)
        res_arr = np.array(resized)

        canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        canvas.paste(Image.fromarray(res_arr), (paste_x, paste_y), Image.fromarray(res_arr))

        # 3. Smooth fade at bottom 4px (y=284..287) of canvas to avoid any clipping line
        canv_arr = np.array(canvas)
        for cy in range(284, 288):
            fade_fac = (287 - cy) / 4.0
            canv_arr[cy, :, 3] = (canv_arr[cy, :, 3].astype(float) * fade_fac).astype(np.uint8)

        # 4. Clean 2px outer left and right border
        canv_arr[:, :2, 3] = 0
        canv_arr[:, -2:, 3] = 0

        out_frames.append(Image.fromarray(canv_arr))

    return out_frames


def save_animated_webp(frames, output_path, duration_ms=FRAME_DURATION_MS, quality=90):
    """Save frame list as animated WebP with duration metadata."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    n = len(frames)
    durations = [duration_ms] * n
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        quality=quality,
        method=4
    )
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  [WebP] -> {output_path} ({n} frames, {sum(durations)}ms, {size_kb:.1f} KB)")
    return output_path


def convert_mp3_to_ogg(mp3_path, ogg_path):
    """Convert an MP3 file to OGG Vorbis using ffmpeg."""
    os.makedirs(os.path.dirname(ogg_path), exist_ok=True)
    cmd = [
        "ffmpeg",
        "-i", mp3_path,
        "-c:a", "vorbis",
        "-strict", "-2",
        "-q:a", "5",
        ogg_path,
        "-y"
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"  [ERROR] ffmpeg audio conversion failed for {mp3_path}:\n{res.stderr}")
        return False
    size_kb = os.path.getsize(ogg_path) / 1024
    print(f"  [OGG]  -> {ogg_path} ({size_kb:.1f} KB)")
    return True


def concatenate_audio_files(mp3_files, out_ogg_path):
    """Concatenate multiple audio files into a single continuous OGG."""
    os.makedirs(os.path.dirname(out_ogg_path), exist_ok=True)
    filter_inputs = "".join([f"[{i}:a]" for i in range(len(mp3_files))])
    filter_complex = f"{filter_inputs}concat=n={len(mp3_files)}:v=0:a=1[outa]"
    cmd = ["ffmpeg"]
    for f in mp3_files:
        cmd.extend(["-i", f])
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[outa]",
        "-c:a", "vorbis",
        "-strict", "-2",
        "-q:a", "5",
        out_ogg_path,
        "-y"
    ])
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"  [WARN] Failed to concatenate audio with filter_complex, falling back to first audio")
        return convert_mp3_to_ogg(mp3_files[0], out_ogg_path)
    size_kb = os.path.getsize(out_ogg_path) / 1024
    print(f"  [OGG Combined] -> {out_ogg_path} ({size_kb:.1f} KB)")
    return True


def copy_to_destinations(src_file, extra_dest_dirs):
    """Mirror generated file into secondary directories (if not the same file)."""
    basename = os.path.basename(src_file)
    for d in extra_dest_dirs:
        os.makedirs(d, exist_ok=True)
        dest_file = os.path.join(d, basename)
        try:
            if os.path.exists(dest_file) and os.path.samefile(src_file, dest_file):
                continue
            shutil.copy2(src_file, dest_file)
        except shutil.SameFileError:
            pass


def process_champion(gender_key, cfg):
    print(f"\n========================================================")
    print(f"PROCESANDO ACTIVOS DE COMBATE PARA: {gender_key.upper()} ({cfg['champ_key']})")
    print(f"========================================================")

    champ_dir = os.path.join(CHAMPIONS_DIR, cfg["champ_key"])
    sounds_dir = os.path.join(champ_dir, "sounds")
    starter_dest_dir = os.path.join(STARTER_DIR, gender_key)
    starter_sounds_dir = os.path.join(starter_dest_dir, "sounds")

    os.makedirs(champ_dir, exist_ok=True)
    os.makedirs(sounds_dir, exist_ok=True)
    os.makedirs(starter_dest_dir, exist_ok=True)
    os.makedirs(starter_sounds_dir, exist_ok=True)

    verified_webp_files = []
    verified_ogg_files = []
    pngs_to_purge = []
    mp3s_to_purge = []

    # ----------------------------------------------------
    # 1. BASIC ATTACK (1, 2, 3 and Full Combo)
    # ----------------------------------------------------
    print("\n--- 1. Procesando Ataque Básico (Combo x3) ---")
    basic_base = cfg["attack_basic_dir"]
    sub_frames = {}
    sub_mp3s = []

    for sub in cfg["basic_subdirs"]:
        sub_dir = os.path.join(basic_base, sub)
        pngs = sorted(glob.glob(os.path.join(sub_dir, "*.png")))
        mp3s = sorted(glob.glob(os.path.join(sub_dir, "*.mp3")))
        if not pngs:
            print(f"  [ERROR] No PNGs found in {sub_dir}")
            return False

        print(f"  Sub {sub}: {len(pngs)} fotogramas PNG encontrados")
        frames = process_frames_to_canvas(pngs, cfg)
        sub_frames[sub] = frames
        pngs_to_purge.extend(pngs)

        # Save attack1_X.webp
        anim_key = f"attack1_{sub}"
        out_webp = os.path.join(champ_dir, f"{anim_key}.webp")
        save_animated_webp(frames, out_webp)
        copy_to_destinations(out_webp, [starter_dest_dir])
        verified_webp_files.append(out_webp)

        # Convert sound attack1_X.ogg
        if mp3s:
            sub_mp3s.append(mp3s[0])
            mp3s_to_purge.append(mp3s[0])
            out_ogg = os.path.join(sounds_dir, f"{anim_key}.ogg")
            convert_mp3_to_ogg(mp3s[0], out_ogg)
            copy_to_destinations(out_ogg, [starter_sounds_dir])
            verified_ogg_files.append(out_ogg)

    # Combined full basic combo: attack1.webp
    all_basic_frames = sub_frames["1"] + sub_frames["2"] + sub_frames["3"]
    print(f"  Generando combo completo attack1.webp ({len(all_basic_frames)} fotogramas)...")
    out_combo_webp = os.path.join(champ_dir, "attack1.webp")
    save_animated_webp(all_basic_frames, out_combo_webp)
    copy_to_destinations(out_combo_webp, [starter_dest_dir])
    verified_webp_files.append(out_combo_webp)

    # Combined basic audio: attack1.ogg
    out_combo_ogg = os.path.join(sounds_dir, "attack1.ogg")
    if sub_mp3s:
        concatenate_audio_files(sub_mp3s, out_combo_ogg)
        copy_to_destinations(out_combo_ogg, [starter_sounds_dir])
        verified_ogg_files.append(out_combo_ogg)

    # ----------------------------------------------------
    # 2. ATTACK 2 (Shield Bash)
    # ----------------------------------------------------
    print("\n--- 2. Procesando Ataque 2 (Shield Bash) ---")
    att2_dir = cfg["attack2_dir"]
    att2_pngs = sorted(glob.glob(os.path.join(att2_dir, "*.png")))
    att2_mp3s = sorted(glob.glob(os.path.join(att2_dir, "*.mp3")))
    if not att2_pngs:
        print(f"  [ERROR] No PNGs found in {att2_dir}")
        return False

    att2_frames = process_frames_to_canvas(att2_pngs, cfg)
    pngs_to_purge.extend(att2_pngs)

    out_att2_webp = os.path.join(champ_dir, "attack2.webp")
    save_animated_webp(att2_frames, out_att2_webp)
    copy_to_destinations(out_att2_webp, [starter_dest_dir])
    verified_webp_files.append(out_att2_webp)

    # Also mirror as attack2_1.webp for combo flexibility
    out_att2_1_webp = os.path.join(champ_dir, "attack2_1.webp")
    shutil.copy2(out_att2_webp, out_att2_1_webp)
    copy_to_destinations(out_att2_1_webp, [starter_dest_dir])

    if att2_mp3s:
        mp3s_to_purge.append(att2_mp3s[0])
        out_att2_ogg = os.path.join(sounds_dir, "attack2.ogg")
        convert_mp3_to_ogg(att2_mp3s[0], out_att2_ogg)
        copy_to_destinations(out_att2_ogg, [starter_sounds_dir])
        verified_ogg_files.append(out_att2_ogg)

        out_att2_1_ogg = os.path.join(sounds_dir, "attack2_1.ogg")
        shutil.copy2(out_att2_ogg, out_att2_1_ogg)
        copy_to_destinations(out_att2_1_ogg, [starter_sounds_dir])

    # ----------------------------------------------------
    # 3. ATTACK 3 (Ground Slam AoE -> special)
    # ----------------------------------------------------
    print("\n--- 3. Procesando Ataque 3 (Golpe Sísmico en Área -> special) ---")
    att3_dir = cfg["attack3_dir"]
    att3_pngs = sorted(glob.glob(os.path.join(att3_dir, "*.png")))
    att3_mp3s = sorted(glob.glob(os.path.join(att3_dir, "*.mp3")))
    if not att3_pngs:
        print(f"  [ERROR] No PNGs found in {att3_dir}")
        return False

    att3_frames = process_frames_to_canvas(att3_pngs, cfg)
    pngs_to_purge.extend(att3_pngs)

    out_special_webp = os.path.join(champ_dir, "special.webp")
    save_animated_webp(att3_frames, out_special_webp)
    copy_to_destinations(out_special_webp, [starter_dest_dir])
    verified_webp_files.append(out_special_webp)

    if att3_mp3s:
        mp3s_to_purge.append(att3_mp3s[0])
        out_special_ogg = os.path.join(sounds_dir, "special.ogg")
        convert_mp3_to_ogg(att3_mp3s[0], out_special_ogg)
        copy_to_destinations(out_special_ogg, [starter_sounds_dir])
        verified_ogg_files.append(out_special_ogg)

    # ----------------------------------------------------
    # 4. ATTACK 4 (Shield Wall / Block -> special2 & defend)
    # ----------------------------------------------------
    print("\n--- 4. Procesando Ataque 4 (Muro de Escudo / Guardia -> special2 & defend) ---")
    att4_dir = cfg["attack4_dir"]
    att4_pngs = sorted(glob.glob(os.path.join(att4_dir, "*.png")))
    att4_mp3s = sorted(glob.glob(os.path.join(att4_dir, "*.mp3")))
    if not att4_pngs:
        print(f"  [ERROR] No PNGs found in {att4_dir}")
        return False

    att4_frames = process_frames_to_canvas(att4_pngs, cfg)
    pngs_to_purge.extend(att4_pngs)

    out_special2_webp = os.path.join(champ_dir, "special2.webp")
    save_animated_webp(att4_frames, out_special2_webp)
    copy_to_destinations(out_special2_webp, [starter_dest_dir])
    verified_webp_files.append(out_special2_webp)

    # Defend uses the same shield wall animation
    out_defend_webp = os.path.join(champ_dir, "defend.webp")
    shutil.copy2(out_special2_webp, out_defend_webp)
    copy_to_destinations(out_defend_webp, [starter_dest_dir])
    verified_webp_files.append(out_defend_webp)

    if att4_mp3s:
        mp3s_to_purge.append(att4_mp3s[0])
        out_special2_ogg = os.path.join(sounds_dir, "special2.ogg")
        convert_mp3_to_ogg(att4_mp3s[0], out_special2_ogg)
        copy_to_destinations(out_special2_ogg, [starter_sounds_dir])
        verified_ogg_files.append(out_special2_ogg)

        out_defend_ogg = os.path.join(sounds_dir, "defend.ogg")
        shutil.copy2(out_special2_ogg, out_defend_ogg)
        copy_to_destinations(out_defend_ogg, [starter_sounds_dir])
        verified_ogg_files.append(out_defend_ogg)

    # ----------------------------------------------------
    # 5. VERIFICACIÓN RIGUROSA
    # ----------------------------------------------------
    print(f"\n--- 5. Verificando Integridad de Archivos Generados ({gender_key}) ---")
    all_ok = True
    for w in verified_webp_files:
        if not os.path.exists(w) or os.path.getsize(w) < 1024:
            print(f"  [FAIL] WebP file corrupted or missing: {w}")
            all_ok = False
        else:
            print(f"  ✓ WebP OK: {os.path.basename(w)} ({os.path.getsize(w)/1024:.1f} KB)")

    for o in verified_ogg_files:
        if not os.path.exists(o) or os.path.getsize(o) < 512:
            print(f"  [FAIL] OGG file corrupted or missing: {o}")
            all_ok = False
        else:
            print(f"  ✓ OGG OK: {os.path.basename(o)} ({os.path.getsize(o)/1024:.1f} KB)")

    if not all_ok:
        print(f"[ERROR] Verificación falló para {gender_key}. Los archivos de origen NO se borrarán.")
        return False

    # ----------------------------------------------------
    # 6. PURGA SEGURA DE PNGs Y MP3s
    # ----------------------------------------------------
    print(f"\n--- 6. Purgando {len(pngs_to_purge)} PNGs y {len(mp3s_to_purge)} MP3s de origen ---")
    for png in pngs_to_purge:
        if os.path.exists(png):
            os.remove(png)

    for mp3 in mp3s_to_purge:
        if os.path.exists(mp3):
            os.remove(mp3)

    # Remove now-empty subdirectories if clean
    for sub in cfg["basic_subdirs"]:
        sub_d = os.path.join(cfg["attack_basic_dir"], sub)
        if os.path.exists(sub_d) and not os.listdir(sub_d):
            os.rmdir(sub_d)

    for d in [cfg["attack_basic_dir"], cfg["attack2_dir"], cfg["attack3_dir"], cfg["attack4_dir"]]:
        if os.path.exists(d) and not os.listdir(d):
            os.rmdir(d)

    print(f"[EXITO] {gender_key.upper()} procesado, verificado y limpiado al 100%!")
    return True


def main():
    print("=================================================================")
    print("PROCESADOR MAESTRO DE ATAQUES Y SONIDOS PARA KNIGHT (KINA)")
    print("=================================================================")

    for gender_key, cfg in CONFIGS.items():
        success = process_champion(gender_key, cfg)
        if not success:
            print(f"\n[FATAL] Error procesando {gender_key}. Deteniendo ejecución.")
            sys.exit(1)

    print("\n=================================================================")
    print("¡TODOS LOS ATAQUES Y SONIDOS PROCESADOS Y LIMPIADOS EXITOSAMENTE!")
    print("=================================================================")


if __name__ == "__main__":
    main()
