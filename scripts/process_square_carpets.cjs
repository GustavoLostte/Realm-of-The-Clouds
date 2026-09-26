const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputs = [
  {
    name: 'alfombra_cuadrada_opcion_1',
    src: '/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/alfombra_cuadrada_v1_1789765763182.jpg'
  },
  {
    name: 'alfombra_cuadrada_opcion_2',
    src: '/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/alfombra_cuadrada_v2_1789765801698.jpg'
  },
  {
    name: 'alfombra_cuadrada_opcion_3',
    src: '/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/alfombra_cuadrada_v3_1789765814887.jpg'
  }
];

const outDir = path.resolve(__dirname, '../public/assets/herald_proposals');
fs.mkdirSync(outDir, { recursive: true });

async function processCarpet(item) {
  console.log(`Processing ${item.name}...`);
  const img = sharp(item.src);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // Flood fill from borders to identify exterior green background
  // This ensures no green jewels inside the chest are touched
  const isGreen = (x, y) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Background green condition
    return g > 110 && g > r * 1.25 && g > b * 1.25;
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

  // Push all perimeter border pixels that match green
  for (let x = 0; x < width; x++) {
    if (isGreen(x, 0)) pushQueue(x, 0);
    if (isGreen(x, height - 1)) pushQueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    if (isGreen(0, y)) pushQueue(0, y);
    if (isGreen(width - 1, y)) pushQueue(width - 1, y);
  }

  // BFS
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

  // Apply transparency to visited exterior green pixels with smooth edge anti-aliasing
  const outBuf = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (visited[pos] === 1) {
        outBuf[idx + 3] = 0; // Completely transparent
      } else {
        // Check if on the edge of visited green to remove green spill/fringe
        const r = outBuf[idx];
        const g = outBuf[idx + 1];
        const b = outBuf[idx + 2];
        if (g > r && g > b) {
          // Desaturate green spill slightly on the outer border
          outBuf[idx + 1] = Math.round((r + b) / 2);
        }
      }
    }
  }

  // Find tight bounding box of carpet
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
  console.log(`Bounds for ${item.name}:`, { cropW, cropH, minX, minY });

  // Extract and center on a 1024x1024 canvas
  const padding = 32;
  const maxDim = 1024 - (padding * 2);
  const scale = Math.min(maxDim / cropW, maxDim / cropH);
  const finalW = Math.round(cropW * scale);
  const finalH = Math.round(cropH * scale);

  const cropped = await sharp(outBuf, {
    raw: { width, height, channels: 4 }
  })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize(finalW, finalH)
    .png()
    .toBuffer();

  const offX = Math.round((1024 - finalW) / 2);
  const offY = Math.round((1024 - finalH) / 2);

  const finalWebp = await sharp({
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

  const outPath = path.join(outDir, `${item.name}.webp`);
  fs.writeFileSync(outPath, finalWebp);
  console.log(`Saved: ${outPath} (${(finalWebp.length / 1024).toFixed(1)} KB)`);

  // Also copy to artifacts dir for embedding in markdown
  const artifactPath = `/Users/wizzard/.gemini/antigravity-ide/brain/e08b0e2d-ff7b-4eae-910b-8d5305d04b22/${item.name}.webp`;
  fs.writeFileSync(artifactPath, finalWebp);
}

async function run() {
  for (const item of inputs) {
    await processCarpet(item);
  }
}

run().catch(console.error);
