/**
 * Authoring-time placeholder generator: npm run generate:placeholder-pokemon
 *
 * Emits simple, distinct, NON-Pokemon stand-in images under public/pokemon/ so
 * the Who's That Pokemon mode is testable before real art exists. Each is a
 * transparent-background PNG with a colored blob — rendered with a
 * brightness(0) CSS filter it reads as a clean black silhouette; on reveal the
 * color shows. Real art overwrites these files (same filenames). No image
 * dependencies — raw PNG chunks + zlib.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'pokemon')
const SIZE = 256

interface Placeholder {
  file: string
  color: [number, number, number]
  /** Blob shape in unit coordinates; return true if (x,y) is inside. */
  inside: (x: number, y: number) => boolean
}

function dist(x: number, y: number, cx: number, cy: number): number {
  return Math.hypot(x - cx, y - cy)
}

const PLACEHOLDERS: Placeholder[] = [
  // Round blob
  { file: 'bulbasaur.png', color: [0x6a, 0xaa, 0x64], inside: (x, y) => dist(x, y, 0.5, 0.52) < 0.34 },
  // Teardrop / flame-ish blob
  {
    file: 'charmander.png',
    color: [0xd9, 0x7a, 0x3f],
    inside: (x, y) => dist(x, y, 0.5, 0.56) < 0.3 || (y < 0.56 && dist(x, y, 0.5, 0.34) < 0.16),
  },
  // Lightning-ish lozenge
  {
    file: 'pikachu.png',
    color: [0xc9, 0xb4, 0x58],
    inside: (x, y) => {
      const dx = Math.abs(x - 0.5)
      const dy = Math.abs(y - 0.5)
      return dx * 1.6 + dy < 0.42
    },
  },
]

function renderPixels(p: Placeholder): Buffer {
  const rows = Buffer.alloc(SIZE * (1 + SIZE * 4))
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (1 + SIZE * 4)
    rows[rowStart] = 0 // filter: none
    for (let x = 0; x < SIZE; x++) {
      let a = 0
      for (const [ox, oy] of [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ]) {
        if (p.inside((x + ox) / SIZE, (y + oy) / SIZE)) a += 255
      }
      const o = rowStart + 1 + x * 4
      rows[o] = p.color[0]
      rows[o + 1] = p.color[1]
      rows[o + 2] = p.color[2]
      rows[o + 3] = a / 4
    }
  }
  return rows
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData) >>> 0)
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(p: Placeholder): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(renderPixels(p))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

for (const p of PLACEHOLDERS) {
  writeFileSync(join(OUT_DIR, p.file), encodePng(p))
  console.log(`public/pokemon/${p.file}`)
}
