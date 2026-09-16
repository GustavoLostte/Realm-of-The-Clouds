const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = '/Users/wizzard/.gemini/antigravity-ide/brain/cf95d19f-d84b-4714-b9e8-d7cc21f46c7c';
const baseOutputDir = path.resolve(__dirname, '../public/assets/characters');
const chromaDir = path.join(baseOutputDir, 'fullbody_chroma');
const cutoutDir = path.join(baseOutputDir, 'fullbody_cutout');
const spritesDir = path.join(baseOutputDir, 'sprites');

fs.mkdirSync(chromaDir, { recursive: true });
fs.mkdirSync(cutoutDir, { recursive: true });
fs.mkdirSync(spritesDir, { recursive: true });

const characters = [
  {
    id: '01_rey_celestial',
    name: 'Rey Celestial Soberano (Lord King)',
    file: 'char_01_angel_king_1789387273631.jpg'
  },
  {
    id: '02_valquiria_reina',
    name: 'Reina Valquiria Angelical',
    file: 'char_02_angel_valkyrie_1789387311910.jpg'
  },
  {
    id: '03_paladin_sagrado',
    name: 'Paladín Sagrado Cruzado',
    file: 'char_03_angel_paladin_1789387327058.jpg'
  },
  {
    id: '04_archimago_astral',
    name: 'Archimago Astral Hechicero',
    file: 'char_04_angel_mage_1789387343542.jpg'
  },
  {
    id: '05_arquero_celestial',
    name: 'Arquero Celestial de Luz',
    file: 'char_05_angel_archer_1789387358710.jpg'
  },
  {
    id: '06_soldado_infanteria',
    name: 'Soldado de Infantería de la Guardia',
    file: 'char_06_angel_infantry_1789387375639.jpg'
  },
  {
    id: '07_mariscal_comandante',
    name: 'Gran Mariscal Comandante de Guerra',
    file: 'char_07_angel_commander_1789387394081.jpg'
  },
  {
    id: '08_aldeana_panadera',
    name: 'Aldeana Recolectora Panadera',
    file: 'char_08_angel_villager_f_1789387412195.jpg'
  },
  {
    id: '09_constructor_artesano',
    name: 'Aldeano Constructor Artesano Real',
    file: 'char_09_angel_builder_1789387430872.jpg'
  },
  {
    id: '10_lenador_celeste',
    name: 'Leñador Celeste de las Nubes',
    file: 'char_10_angel_lumberjack_1789387449212.jpg'
  }
];

function removeGreenChroma(rawBuffer, width, height) {
  const numPixels = width * height;
  const outBuffer = Buffer.alloc(numPixels * 4);

  for (let i = 0; i < numPixels; i++) {
    const srcIdx = i * 3;
    const dstIdx = i * 4;

    const r = rawBuffer[srcIdx];
    const g = rawBuffer[srcIdx + 1];
    const b = rawBuffer[srcIdx + 2];

    const maxRB = Math.max(r, b);
    const greenDiff = g - maxRB;

    let alpha = 255;
    let outR = r;
    let outG = g;
    let outB = b;

    // Green screen detection
    if (g > 70 && greenDiff > 15) {
      if (greenDiff > 45 && g > 110) {
        alpha = 0;
      } else {
        const t = (greenDiff - 15) / (45 - 15);
        alpha = Math.round(255 * (1 - t));
        outG = maxRB;
      }
    }

    // Edge despill
    if (alpha > 0 && outG > maxRB + 5) {
      outG = maxRB + 5;
    }

    outBuffer[dstIdx] = outR;
    outBuffer[dstIdx + 1] = outG;
    outBuffer[dstIdx + 2] = outB;
    outBuffer[dstIdx + 3] = alpha;
  }

  return outBuffer;
}

async function processCharacter(char) {
  const src = path.join(brainDir, char.file);
  if (!fs.existsSync(src)) {
    console.error(`Missing source image: ${src}`);
    return;
  }

  const destChroma = path.join(chromaDir, `${char.id}.jpg`);
  const destCutout = path.join(cutoutDir, `${char.id}.webp`);

  // 1. Copy raw chroma
  fs.copyFileSync(src, destChroma);

  // 2. Load and extract green screen
  const image = sharp(src);
  const { width, height } = await image.metadata();
  const rawBuffer = await image.raw().toBuffer();

  const outBuffer = removeGreenChroma(rawBuffer, width, height);

  // 3. Save full sheet cutout
  await sharp(outBuffer, {
    raw: { width, height, channels: 4 }
  })
    .webp({ quality: 95, effort: 6 })
    .toFile(destCutout);

  // 4. Crop individual Idle (left half) and Walk (right half) from the generated cutout
  const halfWidth = Math.floor(width / 2);

  try {
    // Idle crop (left side)
    await sharp(destCutout)
      .extract({ left: 0, top: 0, width: halfWidth, height: height })
      .trim()
      .webp({ quality: 95, effort: 6 })
      .toFile(path.join(spritesDir, `${char.id}_idle.webp`));

    // Walk crop (right side)
    await sharp(destCutout)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height: height })
      .trim()
      .webp({ quality: 95, effort: 6 })
      .toFile(path.join(spritesDir, `${char.id}_walk.webp`));
  } catch (err) {
    console.warn(`Trim warning for ${char.id}, saving untrimmed halves:`, err.message);
    await sharp(destCutout)
      .extract({ left: 0, top: 0, width: halfWidth, height: height })
      .webp({ quality: 95, effort: 6 })
      .toFile(path.join(spritesDir, `${char.id}_idle.webp`));

    await sharp(destCutout)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height: height })
      .webp({ quality: 95, effort: 6 })
      .toFile(path.join(spritesDir, `${char.id}_walk.webp`));
  }

  console.log(`✅ Processed ${char.id} (${char.name})`);
}

async function run() {
  console.log('Starting full-body character processing pipeline...');
  for (const char of characters) {
    await processCharacter(char);
  }
  console.log('✨ All 10 full-body characters processed successfully into WebP with transparency!');
}

run().catch(console.error);
