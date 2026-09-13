import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const inputLogo = path.join(rootDir, 'public', 'assets', 'logo', 'logo.webp')
const outputDir = path.join(rootDir, 'public', 'icons')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const BG_COLOR = { r: 9, g: 12, b: 16, alpha: 1 } // #090c10

async function generateIcons() {
  console.log('Generating PWA icons from:', inputLogo)

  const targets = [
    { name: 'icon-192.png', size: 192, padding: 12, maskable: false },
    { name: 'icon-512.png', size: 512, padding: 32, maskable: false },
    { name: 'icon-maskable-512.png', size: 512, padding: 80, maskable: true },
    { name: 'icon-180.png', size: 180, padding: 12, maskable: false }, // iOS Apple Touch
    { name: 'favicon-32.png', size: 32, padding: 2, maskable: false },
    { name: 'favicon-16.png', size: 16, padding: 1, maskable: false },
  ]

  for (const target of targets) {
    const innerSize = target.size - (target.padding * 2)
    const resizedLogo = await sharp(inputLogo)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer()

    const outputPath = path.join(outputDir, target.name)
    await sharp({
      create: {
        width: target.size,
        height: target.size,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center',
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(outputPath)

    console.log(`✓ Created ${target.name} (${target.size}x${target.size})`)
  }

  console.log('All PWA icons generated successfully!')
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
