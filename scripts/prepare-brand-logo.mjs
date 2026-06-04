/**
 * Opcional: converte foto escura da marca em PNG (use só se não tiver logo.svg).
 * Preferir public/brand/logo.svg (nítida no app).
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const input = process.argv[2]
const output = process.argv[3] ?? path.join('public', 'brand', 'logo.png')

if (!input || !fs.existsSync(input)) {
  console.error('Arquivo de entrada não encontrado:', input)
  process.exit(1)
}

const meta = await sharp(input).metadata()
const targetW = Math.min(512, Math.max(320, meta.width ?? 320))

let pipe = sharp(input).resize(targetW, null, { fit: 'inside', withoutEnlargement: false }).sharpen({
  sigma: 1.2,
  m1: 1.2,
  m2: 0.4,
})

const { data, info } = await pipe.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

const lums = []
for (let i = 0; i < data.length; i += channels) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  lums.push(0.299 * r + 0.587 * g + 0.114 * b)
}
lums.sort((a, b) => a - b)
const p2 = lums[Math.floor(lums.length * 0.02)] ?? 0
const p98 = lums[Math.floor(lums.length * 0.98)] ?? 255
const bgCut = Math.max(5, p2 + 3)
const hi = Math.max(bgCut + 6, p98)

for (let i = 0; i < data.length; i += channels) {
  const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

  if (lum <= bgCut) {
    data[i + 3] = 0
    continue
  }

  const t = Math.min(1, Math.max(0, (lum - bgCut) / (hi - bgCut)))
  const alpha = t > 0.35 ? 255 : Math.round(120 + t * 135)
  // Índigo claro + esmeralda (paleta do app)
  data[i] = Math.round(165 + t * 90)
  data[i + 1] = Math.round(175 + t * 60)
  data[i + 2] = Math.round(220 + t * 35)
  data[i + 3] = alpha
}

fs.mkdirSync(path.dirname(output), { recursive: true })
await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output)

console.log('OK:', output, `${width}x${height}`)
