const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = '/Users/wizzard/.gemini/antigravity-ide/brain/575bc3c2-f93f-41f3-af72-f6fd2716b379';
const outputDir = path.resolve(__dirname, '../public/assets/structures');
const chromaDir = path.join(outputDir, 'chroma');
const cutoutDir = path.join(outputDir, 'cutout');

fs.mkdirSync(chromaDir, { recursive: true });
fs.mkdirSync(cutoutDir, { recursive: true });

const newStructures = [
  {
    id: '02_cuartel_celestial',
    name: 'Cuartel de Guerra Angelical',
    file: 'cuartel_celestial_clean_1789656161038.jpg'
  },
  {
    id: '03_mina_oro',
    name: 'Mina de Oro Profunda Celestial',
    file: 'mina_oro_celestial_clean_1789656185885.jpg'
  },
  {
    id: '04_molino_alado',
    name: 'Molino de Viento Alado de las Nubes',
    file: 'molino_alado_celestial_clean_1789656202898.jpg'
  },
  {
    id: '05_torre_vigilancia',
    name: 'Torre de Vigilancia y Bastión de Arqueros',
    file: 'torre_vigilancia_celestial_clean_1789656219795.jpg'
  },
  {
    id: '06_portal_arcano',
    name: 'Portal Arcano Dimensional',
    file: 'portal_arcano_celestial_clean_1789656236786.jpg'
  },
  {
    id: '07_morada_residencia',
    name: 'Morada Celestial (Residencia de Colonos)',
    file: 'morada_residencia_celestial_clean_1789656255949.jpg'
  },
  {
    id: '08_gran_boveda',
    name: 'Gran Bóveda y Almacén del Tesoro',
    file: 'gran_boveda_celestial_clean_1789656273416.jpg'
  },
  {
    id: '09_aserradero_madera',
    name: 'Aserradero y Taller de Madera Sagrada',
    file: 'aserradero_madera_celestial_clean_1789656293369.jpg'
  },
  {
    id: '10_cantera_marmol',
    name: 'Cantera de Granito y Mármol Celestial',
    file: 'cantera_marmol_celestial_clean_1789656311952.jpg'
  }
];

async function processChroma(srcPath, destChromaPath, destCutoutPath) {
  // 1. Copy raw chroma image to public archive
  fs.copyFileSync(srcPath, destChromaPath);

  // 2. Read raw image buffer and metadata
  const image = sharp(srcPath);
  const { width, height } = await image.metadata();
  const rawBuffer = await image.raw().toBuffer();

  const numPixels = width * height;
  const outBuffer = Buffer.alloc(numPixels * 4);

  for (let i = 0; i < numPixels; i++) {
    const srcIdx = i * 3;
    const dstIdx = i * 4;

    const r = rawBuffer[srcIdx];
    const g = rawBuffer[srcIdx + 1];
    const b = rawBuffer[srcIdx + 2];

    // Green screen keying calculation
    // Pure green chroma check
    const maxRB = Math.max(r, b);
    const greenDiff = g - maxRB;

    let alpha = 255;
    let outR = r;
    let outG = g;
    let outB = b;

    if (g > 65 && greenDiff > 12) {
      if (greenDiff > 38 && g > 100) {
        alpha = 0;
      } else {
        // Smooth anti-aliased edge transition
        const t = (greenDiff - 12) / (38 - 12);
        alpha = Math.round(255 * (1 - t));
        // Despill green fringe on boundary pixels
        outG = maxRB;
      }
    }

    // Despill fringe if alpha > 0 but green still unnaturally dominant
    if (alpha > 0 && outG > maxRB + 4) {
      outG = maxRB + 4;
    }

    outBuffer[dstIdx] = outR;
    outBuffer[dstIdx + 1] = outG;
    outBuffer[dstIdx + 2] = outB;
    outBuffer[dstIdx + 3] = alpha;
  }

  // 3. Save high-quality WebP cutout with trimmed transparent boundaries
  const transparentWebpBuffer = await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  // Trim extraneous transparent space, leaving a tight 16px safety margin
  await sharp(transparentWebpBuffer)
    .trim({ threshold: 5 })
    .extend({
      top: 16,
      bottom: 8,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 95, effort: 6 })
    .toFile(destCutoutPath);

  const stats = fs.statSync(destCutoutPath);
  console.log(`✓ Processed: ${path.basename(destCutoutPath)} (${Math.round(stats.size / 1024)} KB)`);
}

async function run() {
  console.log('--- Processing 9 New Clean Structures (No ground/platforms) ---');
  for (const item of newStructures) {
    const src = path.join(brainDir, item.file);
    const destChroma = path.join(chromaDir, `${item.id}.jpg`);
    const destCutout = path.join(cutoutDir, `${item.id}.webp`);

    if (!fs.existsSync(src)) {
      console.error(`Source not found: ${src}`);
      continue;
    }

    await processChroma(src, destChroma, destCutout);
  }
  console.log('All new structures processed into clean cutouts successfully!');
}

run().catch(console.error);
