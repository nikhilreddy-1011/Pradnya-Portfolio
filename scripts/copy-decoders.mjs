// Self-host the Draco + Basis (KTX2) decoders so 3D loading never depends on a third-party CDN.
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const src = path.join(root, 'node_modules/three/examples/jsm/libs')
const out = path.join(root, 'public/decoders')

if (!existsSync(src)) {
  console.warn('[decoders] three not installed yet — skipping')
  process.exit(0)
}
mkdirSync(out, { recursive: true })
for (const dir of ['draco/gltf', 'basis']) {
  const from = path.join(src, dir)
  if (existsSync(from)) cpSync(from, path.join(out, dir.split('/')[0]), { recursive: true })
}
console.log('[decoders] copied Draco + Basis decoders to public/decoders')
