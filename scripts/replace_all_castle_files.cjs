const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  const src = path.resolve(__dirname, '../public/assets/structures/cutout/01_palacio_soberano.webp');
  if (!fs.existsSync(src)) {
    throw new Error('Source file not found: ' + src);
  }

  // Get trimmed bounding box
  const img = sharp(src);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      if (data[idx+3] > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Bounds:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

  const padX = 16;
  const padTop = 16;
  const padBottom = 6;

  const extractLeft = Math.max(0, minX - padX);
  const extractTop = Math.max(0, minY - padTop);
  const extractWidth = Math.min(info.width - extractLeft, (maxX - minX + 1) + padX * 2);
  const extractHeight = Math.min(info.height - extractTop, (maxY - minY + 1) + padTop + padBottom);

  const trimmedBuffer = await sharp(src)
    .extract({ left: extractLeft, top: extractTop, width: extractWidth, height: extractHeight })
    .resize({ width: 640, height: Math.round(640 * (extractHeight / extractWidth)), fit: 'contain' })
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  const destinations = [
    'public/assets/buildings/castillo/palacio_soberano.webp',
    'public/assets/buildings/castillo/castillo_idle.webp',
    'public/assets/buildings/castillo/castillo_poster.webp',
    'public/assets/buildings/castillo/castillo_construccion.webp',
    'public/assets/buildings/castillo/castillo_idle_atlas.webp',
    'public/assets/buildings/castillo/castillo_const_atlas.webp',
    'public/assets/buildings/ayuntamiento/castillo.webp',
    'public/assets/buildings/ayuntamiento/ayuntamiento.webp',
    'public/assets/buildings/ayuntamiento/ayuntamiento_idle.webp',
    'public/assets/buildings/ayuntamiento/palacio_soberano.webp'
  ];

  for (const dest of destinations) {
    const destPath = path.resolve(__dirname, '..', dest);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, trimmedBuffer);
    console.log('Written to:', dest);
  }

  console.log('All destinations successfully replaced with new 3D celestial palace!');
}

run().catch(console.error);
