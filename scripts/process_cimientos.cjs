const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function run() {
  const cimientosDir = path.resolve(__dirname, '../public/assets/structures/cimientos')
  const files = fs.readdirSync(cimientosDir)
    .filter(f => f.endsWith('.png'))
    .sort()

  console.log(`Found ${files.length} PNG frames in ${cimientosDir}`)
  if (files.length === 0) {
    console.log('No PNG frames found to process.')
    return
  }

  // Exact global bounds across all 99 frames
  const cropBox = { left: 356, top: 50, width: 1244, height: 885 }
  const frameW = 280
  const frameH = 200
  const cols = 10
  const rows = Math.ceil(files.length / cols)
  const atlasW = cols * frameW
  const atlasH = rows * frameH

  console.log(`Building Atlas: ${atlasW}x${atlasH} with ${cols} cols and ${rows} rows`)

  const composites = []
  const framesObj = {}
  const animArray = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const posX = col * frameW
    const posY = row * frameH

    const frameKey = `cimientos_${String(i).padStart(3, '0')}`
    animArray.push(frameKey)

    framesObj[frameKey] = {
      frame: { x: posX, y: posY, w: frameW, h: frameH },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
      sourceSize: { w: frameW, h: frameH }
    }

    const frameBuffer = await sharp(path.join(cimientosDir, file))
      .extract(cropBox)
      .resize(frameW, frameH, { kernel: sharp.kernel.lanczos3 })
      .toBuffer()

    composites.push({
      input: frameBuffer,
      left: posX,
      top: posY
    })

    if ((i + 1) % 20 === 0 || i === files.length - 1) {
      console.log(`Processed ${i + 1}/${files.length} frames...`)
    }
  }

  console.log('Compositing atlas WebP...')
  const atlasFile = path.join(cimientosDir, 'cimientos_atlas.webp')
  await sharp({
    create: {
      width: atlasW,
      height: atlasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .webp({ quality: 82, effort: 4 })
    .toFile(atlasFile)

  const atlasStat = fs.statSync(atlasFile)
  console.log(`Atlas written: ${atlasFile} (${(atlasStat.size / 1024 / 1024).toFixed(2)} MB)`)

  // Write Pixi-compatible spritesheet JSON
  const jsonContent = {
    frames: framesObj,
    animations: {
      play: animArray
    },
    meta: {
      image: 'cimientos_atlas.webp',
      format: 'RGBA8888',
      size: { w: atlasW, h: atlasH },
      scale: '1'
    }
  }

  const jsonFile = path.join(cimientosDir, 'cimientos.json')
  fs.writeFileSync(jsonFile, JSON.stringify(jsonContent, null, 2))
  console.log(`Spritesheet JSON written: ${jsonFile}`)

  // Copy/rename Timeline 4.mp3 to construction.mp3
  const audioSrc = path.join(cimientosDir, 'Timeline 4.mp3')
  const audioDest = path.join(cimientosDir, 'construction.mp3')
  if (fs.existsSync(audioSrc) && !fs.existsSync(audioDest)) {
    fs.copyFileSync(audioSrc, audioDest)
    console.log('Created construction.mp3')
  }

  // Delete all raw PNG frames to keep project light and clean
  console.log('Deleting raw PNG frames to clean up project...')
  let deletedCount = 0
  for (const file of files) {
    fs.unlinkSync(path.join(cimientosDir, file))
    deletedCount++
  }
  console.log(`Deleted ${deletedCount} PNG frames. Directory is clean and light!`)

  // Clean up any test files
  const testFiles = [
    path.resolve(__dirname, '../public/assets/structures/test_atlas.webp'),
    path.resolve(__dirname, '../public/assets/structures/test_c00.webp'),
    path.resolve(__dirname, '../public/assets/structures/test_c50.webp')
  ]
  for (const tf of testFiles) {
    if (fs.existsSync(tf)) {
      fs.unlinkSync(tf)
    }
  }
  console.log('Cleaned up test files.')
}

run().catch(err => {
  console.error('Error processing cimientos:', err)
  process.exit(1)
})
