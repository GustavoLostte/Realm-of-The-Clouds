const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processMarket() {
  const src = path.resolve(__dirname, '../public/assets/structures/chroma/Market.png');
  if (!fs.existsSync(src)) {
    throw new Error('Source file not found: ' + src);
  }

  console.log('Reading source image:', src);
  const img = sharp(src);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  console.log('Original dimensions:', info.width, 'x', info.height, 'channels:', info.channels);

  // 1. Clean low alpha noise (< 22 to 0) and faint bottom shadow noise (y >= 1058 with alpha < 50)
  const cleaned = Buffer.from(data);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const a = cleaned[idx + 3];
      if (a < 22) {
        cleaned[idx + 3] = 0;
      } else if (y >= 1058 && a < 50) {
        cleaned[idx + 3] = 0;
      }
    }
  }

  // 2. Measure tight content bounds
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      if (cleaned[idx + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  console.log('Cleaned bounds:', { minX, maxX, minY, maxY, contentW, contentH });

  // 3. Canvas composition: 1024x1024
  // Target base line at y = 950 (matching the castle anchor line at 92.8%), top at y = 40
  const targetH = 910;
  const targetW = Math.round(contentW * (targetH / contentH)); // 932px
  const topOffset = 40;
  const leftOffset = Math.round((1024 - targetW) / 2); // 46px

  console.log('Target composition on 1024x1024:', { targetW, targetH, leftOffset, topOffset, baseY: topOffset + targetH });

  // Extract clean content and resize
  const resizedBuffer = await sharp(cleaned, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .extract({ left: minX, top: minY, width: contentW, height: contentH })
    .resize(targetW, targetH, { fit: 'contain' })
    .png()
    .toBuffer();

  // Create 1024x1024 master WebP
  const master1024Buffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resizedBuffer, left: leftOffset, top: topOffset }])
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  // Also create a 640x640 optimized version for compact building directories
  const compact640Buffer = await sharp(master1024Buffer)
    .resize(640, 640, { fit: 'contain' })
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  // List of destinations
  const cutoutDestinations = [
    'public/assets/structures/cutout/01_palacio_soberano.webp',
    'public/assets/structures/cutout/11_mercado_celestial.webp',
    'public/assets/structures/cutout/market.webp'
  ];

  const buildingDestinations = [
    'public/assets/buildings/ayuntamiento/palacio_soberano.webp',
    'public/assets/buildings/ayuntamiento/ayuntamiento.webp',
    'public/assets/buildings/ayuntamiento/ayuntamiento_idle.webp',
    'public/assets/buildings/ayuntamiento/castillo.webp',
    'public/assets/buildings/castillo/palacio_soberano.webp',
    'public/assets/buildings/castillo/castillo_idle.webp',
    'public/assets/buildings/castillo/castillo_poster.webp',
    'public/assets/buildings/castillo/castillo_construccion.webp',
    'public/assets/buildings/castillo/castillo_idle_atlas.webp',
    'public/assets/buildings/castillo/castillo_const_atlas.webp',
    'public/deck/assets/palacio_soberano.webp'
  ];

  console.log('--- Writing Cutout Assets (1024x1024) ---');
  for (const dest of cutoutDestinations) {
    const destPath = path.resolve(__dirname, '..', dest);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, master1024Buffer);
    const sz = (fs.statSync(destPath).size / 1024).toFixed(1);
    console.log(`✓ Written: ${dest} (${sz} KB)`);
  }

  console.log('--- Writing Building Assets (640x640) ---');
  for (const dest of buildingDestinations) {
    const destPath = path.resolve(__dirname, '..', dest);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, compact640Buffer);
    const sz = (fs.statSync(destPath).size / 1024).toFixed(1);
    console.log(`✓ Written: ${dest} (${sz} KB)`);
  }

  console.log('\n🎉 ALL castle destinations successfully replaced with the new 3D Celestial Market!');
}

processMarket().catch(err => {
  console.error('Error processing market:', err);
  process.exit(1);
});
