const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processNucleo() {
  const src = '/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/nucleo_azul_01_1789767395466.jpg';
  if (!fs.existsSync(src)) {
    throw new Error('Source file not found: ' + src);
  }

  // 1. Guardar el archivo chroma original
  const chromaDest1 = path.resolve(__dirname, '../public/assets/structures/chroma/08_nucleo_arcano.jpg');
  const chromaDest2 = path.resolve(__dirname, '../public/assets/structures/chroma/nucleo_mecanico.jpg');
  fs.mkdirSync(path.dirname(chromaDest1), { recursive: true });
  fs.copyFileSync(src, chromaDest1);
  fs.copyFileSync(src, chromaDest2);
  console.log('✓ Chroma original guardado en:', chromaDest1);

  // 2. Cargar imagen en memoria y preparar buffer de extracción
  const img = sharp(src);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // Detección de croma verde
  const isGreen = (x, y) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Fondo verde brillante
    return g > 115 && g > r * 1.25 && g > b * 1.25;
  };

  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  function pushQueue(x, y) {
    const pos = y * width + x;
    if (visited[pos] === 0) {
      visited[pos] = 1;
      queueX[qTail] = x;
      queueY[qTail] = y;
      qTail++;
    }
  }

  // Iniciar desde todos los bordes exteriores
  for (let x = 0; x < width; x++) {
    if (isGreen(x, 0)) pushQueue(x, 0);
    if (isGreen(x, height - 1)) pushQueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    if (isGreen(0, y)) pushQueue(0, y);
    if (isGreen(width - 1, y)) pushQueue(width - 1, y);
  }

  // BFS para propagar el fondo exterior
  while (qHead < qTail) {
    const cx = queueX[qHead];
    const cy = queueY[qHead];
    qHead++;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (visited[nPos] === 0 && isGreen(nx, ny)) {
          visited[nPos] = 1;
          queueX[qTail] = nx;
          queueY[qTail] = ny;
          qTail++;
        }
      }
    }
  }

  // Aplicar transparencia y corrección de halo verde
  const outBuf = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (visited[pos] === 1) {
        outBuf[idx + 3] = 0; // Transparente
      } else {
        // En los bordes, atenuar cualquier tinte verde residual
        const r = outBuf[idx];
        const g = outBuf[idx + 1];
        const b = outBuf[idx + 2];
        if (g > r && g > b) {
          outBuf[idx + 1] = Math.round((r + b) / 2);
        }
      }
    }
  }

  // Medir caja delimitadora ajustada
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (outBuf[idx + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log('Dimensiones detectadas del Núcleo:', { cropW, cropH, minX, minY });

  // Escalar para lienzo maestro 1024x1024 manteniendo proporciones
  // La base debe apoyarse cerca de y = 920-940 (donde se sitúa el anclaje isométrico 0.85)
  const targetH = 880;
  const scale = targetH / cropH;
  const targetW = Math.round(cropW * scale);

  const cropped = await sharp(outBuf, {
    raw: { width, height, channels: 4 }
  })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize(targetW, targetH, { fit: 'contain' })
    .png()
    .toBuffer();

  const offX = Math.round((1024 - targetW) / 2);
  const offY = 1024 - targetH - 60; // 60px margen inferior para que coincida con anclaje 0.85-0.90

  const master1024 = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: cropped, left: offX, top: offY }])
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  // Guardar en todos los destinos de cutout y buildings
  const targets = [
    'public/assets/structures/cutout/08_gran_boveda.webp',
    'public/assets/structures/cutout/08_nucleo_arcano.webp',
    'public/assets/buildings/almacen/almacen_poster.webp',
    'public/assets/buildings/almacen/almacen_idle.webp',
    'public/assets/buildings/almacen/nucleo_arcano.webp'
  ];

  for (const t of targets) {
    const fullP = path.resolve(__dirname, '..', t);
    fs.mkdirSync(path.dirname(fullP), { recursive: true });
    fs.writeFileSync(fullP, master1024);
    console.log(`✓ Guardado: ${t} (${(master1024.length / 1024).toFixed(1)} KB)`);
  }

  // Guardar copia en artifact dir
  const artifactPath = '/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/nucleo_arcano_cutout.webp';
  fs.writeFileSync(artifactPath, master1024);
  console.log('✓ Copia para artifact guardada en:', artifactPath);
}

processNucleo().catch(console.error);
