import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, 'public', 'icons')

// Create simple icon with text "LC"
async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#2563EB" rx="${size * 0.15}"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial, sans-serif" font-weight="bold"
            font-size="${size * 0.45}" fill="white">LC</text>
    </svg>
  `

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(iconsDir, filename))

  console.log(`Created ${filename}`)
}

await mkdir(iconsDir, { recursive: true })

await createIcon(192, 'icon-192.png')
await createIcon(512, 'icon-512.png')

console.log('Icons generated!')