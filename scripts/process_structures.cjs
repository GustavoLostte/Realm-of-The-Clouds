const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = '/Users/wizzard/.gemini/antigravity-ide/brain/cf95d19f-d84b-4714-b9e8-d7cc21f46c7c';
const outputDir = path.resolve(__dirname, '../public/assets/structures');
const chromaDir = path.join(outputDir, 'chroma');
const cutoutDir = path.join(outputDir, 'cutout');

fs.mkdirSync(chromaDir, { recursive: true });
fs.mkdirSync(cutoutDir, { recursive: true });

const structures = [
  {
    id: '01_palacio_soberano',
    name: 'Palacio Soberano Celestial (Castillo)',
    file: 'celestial_palace_structure_1789383522525.jpg'
  },
  {
    id: '02_cuartel_celestial',
    name: 'Cuartel de Guerra Angelical',
    file: 'angel_barracks_structure_1789383539182.jpg'
  },
  {
    id: '03_mina_oro',
    name: 'Mina de Oro Profunda Celestial',
    file: 'celestial_gold_mine_1789383558631.jpg'
  },
  {
    id: '04_molino_alado',
    name: 'Molino de Viento Alado de las Nubes',
    file: 'celestial_windmill_structure_1789383578072.jpg'
  },
  {
    id: '05_torre_vigilancia',
    name: 'Torre de Vigilancia y Arqueros con Alas',
    file: 'winged_tower_structure_1789383600038.jpg'
  },
  {
    id: '06_portal_arcano',
    name: 'Portal Arcano Dimensional de Teletransporte',
    file: 'celestial_portal_structure_1789383620899.jpg'
  },
  {
    id: '07_morada_residencia',
    name: 'Morada Celestial (Residencia de Colonos)',
    file: 'angel_house_structure_1789383644088.jpg'
  },
  {
    id: '08_gran_boveda',
    name: 'Gran Bóveda y Almacén del Tesoro',
    file: 'celestial_vault_structure_1789383666199.jpg'
  },
  {
    id: '09_aserradero_madera',
    name: 'Aserradero y Taller de Madera Sagrada',
    file: 'celestial_sawmill_structure_1789383690445.jpg'
  },
  {
    id: '10_cantera_marmol',
    name: 'Cantera de Granito y Mármol Celestial',
    file: 'celestial_quarry_structure_1789383714409.jpg'
  }
];

async function processChroma(srcPath, destChromaPath, destCutoutPath) {
  // 1. Copy raw chroma image
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

    if (g > 70 && greenDiff > 15) {
      if (greenDiff > 45 && g > 110) {
        alpha = 0;
      } else {
        // Smooth transition edge
        const t = (greenDiff - 15) / (45 - 15);
        alpha = Math.round(255 * (1 - t));
        // Despill green fringe on edges
        outG = maxRB;
      }
    }

    // Despill fringe if alpha > 0 but green still dominant
    if (alpha > 0 && outG > maxRB + 5) {
      outG = maxRB + 5;
    }

    outBuffer[dstIdx] = outR;
    outBuffer[dstIdx + 1] = outG;
    outBuffer[dstIdx + 2] = outB;
    outBuffer[dstIdx + 3] = alpha;
  }

  // Save transparent WebP
  await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .webp({ quality: 95, effort: 6 })
    .toFile(destCutoutPath);

  console.log(`Processed: ${destChromaPath} -> ${destCutoutPath}`);
}

async function run() {
  for (const item of structures) {
    const src = path.join(brainDir, item.file);
    const destChroma = path.join(chromaDir, `${item.id}.jpg`);
    const destCutout = path.join(cutoutDir, `${item.id}.webp`);

    if (!fs.existsSync(src)) {
      console.error(`Source not found: ${src}`);
      continue;
    }

    await processChroma(src, destChroma, destCutout);
  }
  console.log('All 10 structures processed successfully!');
}

run().catch(console.error);
