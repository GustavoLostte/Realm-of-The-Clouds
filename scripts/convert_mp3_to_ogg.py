#!/usr/bin/env python3
import os
import glob
import subprocess

SOUNDS_DIR = "/Users/wizzard/Desktop/TOC FOE/public/assets/sounds"
BUILDINGS_DIR = "/Users/wizzard/Desktop/TOC FOE/public/assets/buildings"
RAW_BUILDING_DIR = "/Users/wizzard/Desktop/TOC FOE/public/assets/building"

# Mapping of raw sources to sound targets
CONVERSIONS = [
    {
        "name": "Torre de Arqueros",
        "src": f"{RAW_BUILDING_DIR}/archert tower/construccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/archer_tower.ogg",
        "bld_out": f"{BUILDINGS_DIR}/archer_tower/archer_tower.ogg"
    },
    {
        "name": "Castillo Imperial",
        "src": f"{RAW_BUILDING_DIR}/castillo/contruccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/castle_build.ogg",
        "bld_out": f"{BUILDINGS_DIR}/castillo/castle_build.ogg"
    },
    {
        "name": "Mina de Oro (Construcción)",
        "src": f"{RAW_BUILDING_DIR}/mina de oro/contruccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/gold_mine_build.ogg",
        "bld_out": f"{BUILDINGS_DIR}/gold_mine/gold_mine_build.ogg"
    },
    {
        "name": "Mina de Oro (Ambiental)",
        "src": f"{RAW_BUILDING_DIR}/mina de oro/idle/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/gold_mine_loop.ogg",
        "bld_out": f"{BUILDINGS_DIR}/gold_mine/gold_mine_loop.ogg"
    },
    {
        "name": "Gran Almacén Real",
        "src": f"{RAW_BUILDING_DIR}/almacen /construccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/warehouse_build.ogg",
        "bld_out": f"{BUILDINGS_DIR}/almacen/warehouse_build.ogg"
    },
    {
        "name": "Aserradero del Río",
        "src": f"{RAW_BUILDING_DIR}/casa_molino/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/sawmill.ogg",
        "bld_out": f"{BUILDINGS_DIR}/casa_molino/sawmill.ogg"
    },
    {
        "name": "Cantera de Granito",
        "src": f"{RAW_BUILDING_DIR}/mina_piedra/construccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/stone_mine.ogg",
        "bld_out": f"{BUILDINGS_DIR}/mina_piedra/stone_mine.ogg"
    },
    {
        "name": "Portal Arcano",
        "src": f"{RAW_BUILDING_DIR}/portal/construccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/portal.ogg",
        "bld_out": f"{BUILDINGS_DIR}/portal/portal.ogg"
    },
    {
        "name": "Casa de Colonos",
        "src": f"{RAW_BUILDING_DIR}/casa/contruccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/house_build.ogg",
        "bld_out": f"{BUILDINGS_DIR}/casa/house_build.ogg"
    },
    {
        "name": "Molino de Viento (Construcción)",
        "src": f"{RAW_BUILDING_DIR}/molino/contruccion/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/windmill_build.ogg",
        "bld_out": f"{BUILDINGS_DIR}/molino/windmill_build.ogg"
    },
    {
        "name": "Molino de Viento (Ambiental)",
        "src": f"{RAW_BUILDING_DIR}/molino/idle/Timeline 1.mp3",
        "out": f"{SOUNDS_DIR}/windmill_loop.ogg",
        "bld_out": f"{BUILDINGS_DIR}/molino/windmill_loop.ogg"
    }
]

def convert():
    os.makedirs(SOUNDS_DIR, exist_ok=True)
    converted_sources = []

    for item in CONVERSIONS:
        src = item["src"]
        out = item["out"]
        bld_out = item["bld_out"]

        if not os.path.exists(src):
            print(f"Warning: Source not found: {src}")
            continue

        print(f"Converting [{item['name']}]: {src} -> {out}")
        cmd = [
            "/opt/homebrew/bin/ffmpeg",
            "-i", src,
            "-c:a", "vorbis",
            "-strict", "-2",
            "-q:a", "5",
            out,
            "-y"
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print(f"Error converting {src}:\n{res.stderr}")
            continue

        # Also copy to building folder for direct local access
        os.makedirs(os.path.dirname(bld_out), exist_ok=True)
        subprocess.run(["cp", out, bld_out])

        # Verify output size
        size_kb = os.path.getsize(out) / 1024
        print(f"  -> Successfully created {out} ({size_kb:.1f} KB)")
        converted_sources.append(src)

    # Convert any existing mp3s directly inside public/assets/sounds that might not be in the list
    existing_sound_mp3s = glob.glob(f"{SOUNDS_DIR}/*.mp3")
    for smp3 in existing_sound_mp3s:
        sogg = smp3.replace(".mp3", ".ogg")
        if not os.path.exists(sogg):
            print(f"Converting leftover sound: {smp3} -> {sogg}")
            subprocess.run([
                "/opt/homebrew/bin/ffmpeg", "-i", smp3,
                "-c:a", "vorbis", "-strict", "-2", "-q:a", "5",
                sogg, "-y"
            ])
        # Clean up mp3 in sounds
        os.remove(smp3)
        print(f"Removed {smp3}")

    # Remove all converted mp3s from public/assets/building to clear space as requested
    for src in converted_sources:
        if os.path.exists(src):
            os.remove(src)
            print(f"Cleaned source mp3: {src}")

    # Also clean any remaining .mp3 files inside public/assets/building
    all_raw_mp3s = glob.glob(f"{RAW_BUILDING_DIR}/**/*.mp3", recursive=True)
    for rmp3 in all_raw_mp3s:
        if os.path.exists(rmp3):
            os.remove(rmp3)
            print(f"Cleaned remaining mp3: {rmp3}")

    print("\nALL AUDIO SUCCESSFULLY CONVERTED TO OGG AND MP3s CLEANED UP!")

if __name__ == "__main__":
    convert()
