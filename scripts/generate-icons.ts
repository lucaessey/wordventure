/**
 * Authoring-time PWA icon generator: npm run generate:icons
 *
 * Draws a rounded green letter-tile with a white "W" and writes it as PNG at
 * 192 and 512 px — no image dependencies, just raw PNG chunks + zlib.
 * Placeholder art: replace with real artwork whenever we feel like it.
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const TILE = { r: 0x6a, g: 0xaa, b: 0x64 } // Wordle green
const CORNER_RADIUS = 0.14
const STROKE = 0.062

// The "W" as four line segments in unit coordinates
const SEGMENTS: Array<[number, number, number, number]> = [
  [0.24, 0.3, 0.36, 0.7],
  [0.36, 0.7, 0.5, 0.38],
  [0.5, 0.38, 0.64, 0.7],
  [0.64, 0.7, 0.76, 0.3],
]

function distanceToSegment(px: number, py: number, [x1, y1, x2, y2]: [number, number, number, number]): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function insideRoundedSquare(x: number, y: number, radius: number): boolean {
  if (x < 0 || x > 1 || y < 0 || y > 1) return false
  const cx = Math.max(radius - x, x - (1 - radius), 0)
  const cy = Math.max(radius - y, y - (1 - radius), 0)
  return cx * cx + cy * cy <= radius * radius
}

/** Returns RGBA for one unit-square sample point. */
function sample(x: number, y: number): [number, number, number, number] {
  if (!insideRoundedSquare(x, y, CORNER_RADIUS)) return [0, 0, 0, 0]
  const onStroke = SEGMENTS.some((segment) => distanceToSegment(x, y, segment) <= STROKE / 2)
  return onStroke ? [255, 255, 255, 255] : [TILE.r, TILE.g, TILE.b, 255]
}

function renderPixels(size: number): Buffer {
  // One filter byte per row, then RGBA per pixel; 2x2 supersampling for edges
  const rows = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    rows[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const [sr, sg, sb, sa] = sample((x + ox) / size, (y + oy) / size)
        r += sr; g += sg; b += sb; a += sa
      }
      const offset = rowStart + 1 + x * 4
      rows[offset] = r / 4
      rows[offset + 1] = g / 4
      rows[offset + 2] = b / 4
      rows[offset + 3] = a / 4
    }
  }
  return rows
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData) >>> 0)
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size: number): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(renderPixels(size))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const file = join(OUT_DIR, `pwa-${size}x${size}.png`)
  writeFileSync(file, encodePng(size))
  console.log(`public/pwa-${size}x${size}.png`)
}
