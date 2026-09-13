const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

const mapDir = path.resolve(__dirname, '../map TOC');
const publicAtlasDir = path.resolve(__dirname, '../public/assets/atlases');
const dataDir = path.resolve(__dirname, '../src/data');

async function run() {
  console.log('====================================================');
  console.log('  OPTIMIZACIÓN Y CONVERSIÓN A TEXTURE ATLAS: MAP TOC');
  console.log('====================================================');
  console.log(`Directorio objetivo: ${mapDir}`);

  if (!fs.existsSync(mapDir)) {
    console.error(`Error: Directorio no encontrado: ${mapDir}`);
    process.exit(1);
  }

  // 1. Obtener archivos PNG ordenados cronológicamente
  const pngFiles = fs.readdirSync(mapDir).filter(f => f.endsWith('.png')).sort();
  console.log(`Encontrados ${pngFiles.length} fotogramas PNG originales.`);

  if (pngFiles.length === 0) {
    console.warn('No se encontraron archivos PNG en el directorio.');
    return;
  }

  let totalRawBytes = 0;
  for (const f of pngFiles) {
    totalRawBytes += fs.statSync(path.join(mapDir, f)).size;
  }
  const rawMB = (totalRawBytes / (1024 * 1024)).toFixed(1);
  console.log(`Peso total original PNG: ${rawMB} MB`);

  // 2. Procesar fotogramas a WebP al 80% (960x540) en memoria
  console.log('\n[1/4] Convirtiendo frames a WebP al 80% de calidad (960x540)...');
  const CONCURRENCY = 8;
  const atlasImages = [];
  let totalWebpBufferBytes = 0;

  for (let i = 0; i < pngFiles.length; i += CONCURRENCY) {
    const chunk = pngFiles.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (file) => {
      const srcPath = path.join(mapDir, file);
      const baseName = path.basename(file, '.png');

      const webpBuffer = await sharp(srcPath)
        .resize(960, 540, { fit: 'inside' })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      totalWebpBufferBytes += webpBuffer.length;
      atlasImages.push({
        path: `${baseName}.webp`,
        contents: webpBuffer
      });
    }));

    const processed = Math.min(i + CONCURRENCY, pngFiles.length);
    process.stdout.write(`\r   Progreso: ${processed}/${pngFiles.length} frames convertidos`);
  }
  console.log(`\n   Peso intermedio de frames individuales: ${(totalWebpBufferBytes / (1024 * 1024)).toFixed(1)} MB`);

  // Ordenar imágenes estrictamente en orden cronológico
  atlasImages.sort((a, b) => a.path.localeCompare(b.path));

  // 3. Empaquetar en Texture Atlas 2D (2048x2048, Phaser3, WebP)
  console.log('\n[2/4] Empaquetando en Texture Atlas (2048x2048, formato Phaser3/JSON)...');
  const packOptions = {
    textureName: 'map_toc',
    width: 2048,
    height: 2048,
    fixedSize: false,
    padding: 2,
    allowRotation: false,
    detectIdentical: false,
    allowTrim: false,
    exporter: 'Phaser3',
    removeFileExtension: false,
    prependFolderName: false,
    textureFormat: 'webp'
  };

  const output = await packAsync(atlasImages, packOptions);

  // 4. Guardar y comprimir hojas de textura WebP al 80%
  console.log('\n[3/4] Comprimiendo y guardando páginas del atlas en WebP al 80%...');
  if (!fs.existsSync(publicAtlasDir)) fs.mkdirSync(publicAtlasDir, { recursive: true });

  const masterData = { textures: [] };
  let totalAtlasBytes = 0;
  const createdAtlasFiles = [];

  for (const item of output) {
    if (item.name.endsWith('.webp')) {
      // Re-comprimir con Sharp para garantizar 80% de calidad exacta y máximo esfuerzo
      const compressedWebp = await sharp(item.buffer)
        .webp({ quality: 80, effort: 5 })
        .toBuffer();

      totalAtlasBytes += compressedWebp.length;

      // Guardar en "map TOC"
      const destPath = path.join(mapDir, item.name);
      fs.writeFileSync(destPath, compressedWebp);

      // Guardar también en public/assets/atlases para que el juego React pueda usarlo
      fs.writeFileSync(path.join(publicAtlasDir, item.name), compressedWebp);

      createdAtlasFiles.push(item.name);
      console.log(`   Guardada página atlas: ${item.name} (${(compressedWebp.length / 1024).toFixed(1)} KB)`);
    } else if (item.name.endsWith('.json')) {
      const parsed = JSON.parse(item.buffer.toString());
      if (parsed.textures) {
        masterData.textures.push(...parsed.textures);
      }
    }
  }

  // Guardar master JSON consolidado
  const masterJsonStr = JSON.stringify(masterData, null, 2);
  const masterJsonPath = path.join(mapDir, 'map_toc_master.json');
  fs.writeFileSync(masterJsonPath, masterJsonStr);
  fs.writeFileSync(path.join(mapDir, 'map_toc.json'), masterJsonStr);
  fs.writeFileSync(path.join(publicAtlasDir, 'map_toc_master.json'), masterJsonStr);
  createdAtlasFiles.push('map_toc_master.json', 'map_toc.json');

  // Actualizar / crear atlasesData.js para React
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const atlasesDataContent = `// atlasesData.js - Consolidación de Texture Atlases de TOC FOE\nexport const ATLAS_DATA = {\n  'map_toc': ${masterJsonStr}\n};\n`;
  fs.writeFileSync(path.join(dataDir, 'atlasesData.js'), atlasesDataContent);

  const atlasMB = (totalAtlasBytes / (1024 * 1024)).toFixed(1);
  const totalFramesInAtlas = masterData.textures.reduce((acc, t) => acc + (t.frames ? t.frames.length : 0), 0);

  console.log(`\n====================================================`);
  console.log(`  VERIFICACIÓN DEL ATLAS`);
  console.log(`====================================================`);
  console.log(`Fotogramas en PNG originales: ${pngFiles.length}`);
  console.log(`Fotogramas empaquetados en Atlas: ${totalFramesInAtlas}`);
  console.log(`Páginas de textura generadas: ${masterData.textures.length}`);
  console.log(`Peso total Atlas final: ${atlasMB} MB (vs ${rawMB} MB original)`);
  const savingsPct = (((totalRawBytes - totalAtlasBytes) / totalRawBytes) * 100).toFixed(1);
  console.log(`Ahorro de espacio: -${savingsPct}% 📉`);

  if (totalFramesInAtlas !== pngFiles.length) {
    console.error(`⚠️ ALERTA: La cantidad de frames en el atlas (${totalFramesInAtlas}) no coincide con los PNG (${pngFiles.length}). No se eliminarán los archivos originales por seguridad.`);
    return;
  }

  // 5. Eliminar PNGs sobrantes y WebPs individuales sobrantes
  console.log('\n[4/4] Eliminando archivos PNG sobrantes y WebPs individuales...');
  let deletedPngCount = 0;
  for (const f of pngFiles) {
    const fullPath = path.join(mapDir, f);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      deletedPngCount++;
    }
  }

  // Eliminar cualquier archivo que no sea el atlas
  const remainingFiles = fs.readdirSync(mapDir);
  let deletedOtherCount = 0;
  for (const f of remainingFiles) {
    if (!createdAtlasFiles.includes(f)) {
      fs.unlinkSync(path.join(mapDir, f));
      deletedOtherCount++;
    }
  }

  console.log(`✅ Eliminados ${deletedPngCount} archivos .png sobrantes.`);
  if (deletedOtherCount > 0) {
    console.log(`✅ Eliminados ${deletedOtherCount} archivos adicionales sobrantes.`);
  }

  console.log(`\n🎉 ¡OPTIMIZACIÓN Y CREACIÓN DE ATLAS COMPLETADA CON ÉXITO!`);
  console.log(`Archivos resultantes en "${mapDir}":`);
  fs.readdirSync(mapDir).forEach(f => {
    const sz = (fs.statSync(path.join(mapDir, f)).size / 1024).toFixed(1);
    console.log(` - ${f} (${sz} KB)`);
  });
}

run().catch((err) => {
  console.error('Error fatal durante el procesamiento:', err);
  process.exit(1);
});
