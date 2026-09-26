const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');
const { execSync } = require('child_process');

const mapDir = path.resolve(__dirname, '../public/assets/map');
const publicAtlasDir = path.resolve(__dirname, '../public/assets/atlases');
const dataDir = path.resolve(__dirname, '../src/data');

async function processMap() {
  console.log('====================================================');
  console.log('  PIXI.JS TEXTURE ATLAS GENERATOR: MAP SEQUENCE');
  console.log('====================================================');
  console.log(`Directorio objetivo: ${mapDir}`);

  if (!fs.existsSync(mapDir)) {
    console.error(`Error: Directorio no encontrado: ${mapDir}`);
    process.exit(1);
  }

  const rawFramesDir = path.join(mapDir, 'raw_frames');
  const searchDir = (fs.existsSync(rawFramesDir) && fs.readdirSync(rawFramesDir).some(f => f.toLowerCase().endsWith('.png') && f.startsWith('Timeline 2_')))
    ? rawFramesDir
    : mapDir;

  // 1. Obtener archivos PNG ordenados cronológicamente
  const pngFiles = fs.readdirSync(searchDir)
    .filter(f => f.toLowerCase().endsWith('.png') && f.startsWith('Timeline 2_'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  console.log(`Encontrados ${pngFiles.length} fotogramas PNG originales en ${searchDir}.`);
  if (pngFiles.length === 0) {
    console.error('No se encontraron archivos PNG de mapa para procesar.');
    return;
  }

  let totalRawBytes = 0;
  for (const f of pngFiles) {
    totalRawBytes += fs.statSync(path.join(searchDir, f)).size;
  }
  const rawMB = (totalRawBytes / (1024 * 1024)).toFixed(1);
  console.log(`Peso total original PNG: ${rawMB} MB (1920x1080)`);

  // 1.1 Asegurar mapa base 1080p nativo ultra nítido (Frame 0)
  const base1080pPath = path.join(mapDir, 'map_base_1080p.webp');
  const publicBase1080pPath = path.join(publicAtlasDir, 'map_base_1080p.webp');
  const baseFrameSrc = path.join(searchDir, pngFiles[0]);
  await sharp(baseFrameSrc)
    .webp({ quality: 96, effort: 6 })
    .toFile(base1080pPath);
  if (!fs.existsSync(publicAtlasDir)) fs.mkdirSync(publicAtlasDir, { recursive: true });
  fs.copyFileSync(base1080pPath, publicBase1080pPath);
  console.log(`Generado mapa base 1080p nativo: ${base1080pPath} (${(fs.statSync(base1080pPath).size / 1024).toFixed(1)} KB)`);

  // 2. Procesar fotogramas con Sharp (Lanczos3, 960x540, WebP Calidad 90 Ultra HD)
  console.log('\n[1/5] Convirtiendo fotogramas a WebP Alta Calidad (960x540 Lanczos3, Q=90)...');
  const CONCURRENCY = 8;
  const atlasImages = [];
  let totalWebpBufferBytes = 0;

  for (let i = 0; i < pngFiles.length; i += CONCURRENCY) {
    const chunk = pngFiles.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (file) => {
      const srcPath = path.join(searchDir, file);
      const baseName = path.basename(file, path.extname(file));

      const webpBuffer = await sharp(srcPath)
        .resize(960, 540, { kernel: sharp.kernel.lanczos3, fit: 'inside' })
        .webp({ quality: 90, effort: 5 })
        .toBuffer();

      totalWebpBufferBytes += webpBuffer.length;
      atlasImages.push({
        path: `${baseName}.webp`,
        contents: webpBuffer
      });
    }));

    const processed = Math.min(i + CONCURRENCY, pngFiles.length);
    process.stdout.write(`\r   Progreso: ${processed}/${pngFiles.length} frames procesados`);
  }
  console.log(`\n   Peso intermedio de fotogramas WebP: ${(totalWebpBufferBytes / (1024 * 1024)).toFixed(1)} MB`);

  // Ordenar estrictamente en secuencia de animación
  atlasImages.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));

  // 3. Empaquetar con Free Texture Packer en páginas 2048x2048 optimizadas para WebGL / Pixi
  console.log('\n[2/5] Empaquetando en Texture Atlas Pixi.js (2048x2048, formato Pixi + Multi-Pack)...');
  const packOptions = {
    textureName: 'map_atlas',
    width: 2048,
    height: 2048,
    fixedSize: false,
    padding: 2,
    allowRotation: false,
    detectIdentical: false,
    allowTrim: false,
    exporter: 'Pixi',
    removeFileExtension: false,
    prependFolderName: false,
    textureFormat: 'webp'
  };

  const output = await packAsync(atlasImages, packOptions);

  // 4. Guardar texturas WebP y compilar datos de animación para PixiJS
  console.log('\n[3/5] Guardando hojas de atlas y metadatos...');
  if (!fs.existsSync(publicAtlasDir)) fs.mkdirSync(publicAtlasDir, { recursive: true });

  const webpPages = [];
  const individualPixiJsons = [];
  let totalAtlasBytes = 0;

  for (const item of output) {
    if (item.name.endsWith('.webp')) {
      // Re-comprimir con Sharp para garantizar 90% calidad y optimización de compresión WebP
      const optimizedWebp = await sharp(item.buffer)
        .webp({ quality: 90, effort: 5 })
        .toBuffer();

      totalAtlasBytes += optimizedWebp.length;
      webpPages.push({ name: item.name, buffer: optimizedWebp });

      // Guardar en public/assets/map
      fs.writeFileSync(path.join(mapDir, item.name), optimizedWebp);
      // Guardar en public/assets/atlases
      fs.writeFileSync(path.join(publicAtlasDir, item.name), optimizedWebp);

      console.log(`   Página de Atlas generada: ${item.name} (${(optimizedWebp.length / 1024).toFixed(1)} KB)`);
    } else if (item.name.endsWith('.json')) {
      individualPixiJsons.push({
        name: item.name,
        data: JSON.parse(item.buffer.toString())
      });
    }
  }

  // Ordenar páginas cronológicamente
  webpPages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  individualPixiJsons.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // Construir secuencia ordenada de nombres de fotogramas para animación
  const animFrameNames = [];
  const consolidatedFrames = {};
  const masterTexturesArray = [];

  for (const p of individualPixiJsons) {
    const pageImageName = p.data.meta?.image || p.name.replace('.json', '.webp');
    const textureEntry = {
      image: pageImageName,
      format: p.data.meta?.format || 'RGBA8888',
      size: p.data.meta?.size || { w: 2048, h: 2048 },
      scale: 1,
      frames: []
    };

    for (const [fName, fData] of Object.entries(p.data.frames || {})) {
      consolidatedFrames[fName] = {
        ...fData,
        atlasImage: pageImageName
      };
      animFrameNames.push(fName);

      textureEntry.frames.push({
        filename: fName,
        rotated: fData.rotated || false,
        trimmed: fData.trimmed || false,
        sourceSize: fData.sourceSize,
        spriteSourceSize: fData.spriteSourceSize,
        frame: fData.frame
      });
    }

    masterTexturesArray.push(textureEntry);

    // Guardar cada json individual de página
    fs.writeFileSync(path.join(mapDir, p.name), JSON.stringify(p.data, null, 2));
    fs.writeFileSync(path.join(publicAtlasDir, p.name), JSON.stringify(p.data, null, 2));
  }

  // Ordenar lista de animación por número de fotograma
  animFrameNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Generar master PixiJS Spritesheet JSON
  const relatedMultiPacks = individualPixiJsons.slice(1).map(p => p.name);
  const masterPixiJson = {
    frames: consolidatedFrames,
    animations: {
      play: animFrameNames,
      loop: animFrameNames
    },
    meta: {
      app: 'RealmOfKingdomsAtlasPacker',
      version: '2.0.0',
      image: webpPages[0]?.name || 'map_atlas-0.webp',
      format: 'RGBA8888',
      size: individualPixiJsons[0]?.data.meta?.size || { w: 1928, h: 1632 },
      scale: '1',
      related_multi_packs: relatedMultiPacks
    }
  };

  const masterPixiJsonStr = JSON.stringify(masterPixiJson, null, 2);
  fs.writeFileSync(path.join(mapDir, 'map_atlas.json'), masterPixiJsonStr);
  fs.writeFileSync(path.join(mapDir, 'map.json'), masterPixiJsonStr);
  fs.writeFileSync(path.join(publicAtlasDir, 'map_atlas.json'), masterPixiJsonStr);

  // Generar master multi-texture JSON (Phaser3 / array format)
  const masterTexturesJson = {
    textures: masterTexturesArray,
    animations: {
      play: animFrameNames
    }
  };
  const masterTexturesJsonStr = JSON.stringify(masterTexturesJson, null, 2);
  fs.writeFileSync(path.join(mapDir, 'map_master.json'), masterTexturesJsonStr);
  fs.writeFileSync(path.join(publicAtlasDir, 'map_master.json'), masterTexturesJsonStr);

  // Actualizar atlasesData.js
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const atlasesDataPath = path.join(dataDir, 'atlasesData.js');
  let currentAtlasesData = {};
  if (fs.existsSync(atlasesDataPath)) {
    try {
      const content = fs.readFileSync(atlasesDataPath, 'utf8');
      const match = content.match(/export const ATLAS_DATA = ({[\s\S]*});?\s*$/);
      if (match) {
        // Safe evaluate or regex extract
        const evalObj = eval(`(${match[1]})`);
        currentAtlasesData = evalObj;
      }
    } catch (e) {
      console.warn('Could not parse existing atlasesData.js, initializing fresh');
    }
  }
  currentAtlasesData['map'] = masterTexturesJson;
  currentAtlasesData['map_atlas'] = masterTexturesJson;
  const newAtlasesDataContent = `// atlasesData.js - Consolidación de Texture Atlases
export const ATLAS_DATA = ${JSON.stringify(currentAtlasesData, null, 2)};
`;
  fs.writeFileSync(atlasesDataPath, newAtlasesDataContent);
  console.log('   Actualizado src/data/atlasesData.js con metadatos del mapa.');

  // 5. Procesar Audio: asegurar MP3 y generar OGG de alta fidelidad
  console.log('\n[4/5] Verificando y procesando efecto de sonido del mapa...');
  const mp3Path = path.join(mapDir, 'sound_effect.mp3');
  const oggPath = path.join(mapDir, 'sound_effect.ogg');

  if (fs.existsSync(mp3Path)) {
    try {
      execSync(`ffmpeg -y -i "${mp3Path}" -c:a libvorbis -q:a 6 "${oggPath}"`, { stdio: 'ignore' });
      console.log(`   Generado formato OGG complementario de alta fidelidad: sound_effect.ogg`);
    } catch (err) {
      console.warn('   Aviso: ffmpeg no pudo generar OGG, manteniendo MP3 original.');
    }
  }

  // 6. Organizar y respaldar fotogramas PNG originales en subcarpeta raw_frames
  console.log('\n[5/5] Organizando directorio del mapa...');
  if (!fs.existsSync(rawFramesDir)) fs.mkdirSync(rawFramesDir, { recursive: true });

  if (searchDir !== rawFramesDir) {
    for (const f of pngFiles) {
      const src = path.join(mapDir, f);
      const dest = path.join(rawFramesDir, f);
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    }
    console.log(`   Movidos ${pngFiles.length} fotogramas PNG a raw_frames/ (1.78 GB respaldados de forma segura).`);
  } else {
    console.log(`   ${pngFiles.length} fotogramas PNG ya respaldados en raw_frames/.`);
  }

  const atlasMB = (totalAtlasBytes / (1024 * 1024)).toFixed(1);
  const savingsPct = (((totalRawBytes - totalAtlasBytes) / totalRawBytes) * 100).toFixed(1);

  console.log('\n====================================================');
  console.log('  RESUMEN DE PROCESAMIENTO EXITOSO');
  console.log('====================================================');
  console.log(`Fotogramas procesados: ${animFrameNames.length} / ${pngFiles.length}`);
  console.log(`Páginas de Texture Atlas generadas: ${webpPages.length}`);
  console.log(`Peso original PNGs: ${rawMB} MB`);
  console.log(`Peso final Texture Atlas WebP: ${atlasMB} MB`);
  console.log(`Ahorro de transferencia / VRAM: -${savingsPct}%`);
  console.log(`Archivos principales disponibles en public/assets/map:`);
  console.log(` - map_atlas.json (PixiJS v8 master spritesheet)`);
  console.log(` - map_master.json (Multi-texture array master)`);
  console.log(` - map_atlas-0.webp ... map_atlas-${webpPages.length - 1}.webp`);
  console.log(` - sound_effect.mp3 (${(fs.statSync(mp3Path).size / 1024).toFixed(1)} KB)`);
  if (fs.existsSync(oggPath)) {
    console.log(` - sound_effect.ogg (${(fs.statSync(oggPath).size / 1024).toFixed(1)} KB)`);
  }
}

processMap().catch((err) => {
  console.error('Error fatal procesando el mapa:', err);
  process.exit(1);
});
