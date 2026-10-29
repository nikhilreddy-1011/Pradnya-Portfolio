/**
 * Generates the DEMONSTRATION assets used by /lab (the viewer preview page):
 *   public/demo/demo-room.glb   a real glTF 2.0 binary, following the node-naming convention
 *   public/demo/demo-plan.svg   the matching 2D plan drawing
 *   src/content/demo.ts         room outlines, camera views and hotspots for the viewers
 *
 * This is generic geometry to prove the pipeline end-to-end. It is NOT one of Pradnya's
 * projects and must never be presented as one.   Run:  npm run demo:glb
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const H = 2.8 // wall height (m)
const T = 0.14 // wall thickness
const W = 10 // footprint x
const D = 7 // footprint z

/* ── Materials (PBR metallic-roughness) ─────────────────────────────────── */
const MATS = {
  plaster: { c: [0.93, 0.91, 0.87], r: 0.92, m: 0 },
  oak: { c: [0.64, 0.49, 0.34], r: 0.58, m: 0 },
  tile: { c: [0.86, 0.85, 0.82], r: 0.35, m: 0 },
  fabric: { c: [0.55, 0.52, 0.48], r: 0.95, m: 0 },
  walnut: { c: [0.36, 0.25, 0.17], r: 0.5, m: 0 },
  terracotta: { c: [0.66, 0.36, 0.26], r: 0.85, m: 0 },
  brass: { c: [0.72, 0.58, 0.36], r: 0.32, m: 0.9 },
  stone: { c: [0.85, 0.83, 0.79], r: 0.3, m: 0 },
  linen: { c: [0.92, 0.89, 0.84], r: 0.9, m: 0 },
  shade: { c: [0.96, 0.92, 0.84], r: 0.8, m: 0 },
  charcoal: { c: [0.16, 0.16, 0.15], r: 0.6, m: 0 },
  glass: { c: [0.8, 0.86, 0.88], r: 0.05, m: 0 },
}
const matNames = Object.keys(MATS)

/* ── Scene description: boxes as [name, material, x0, y0, z0, x1, y1, z1] ── */
const groups = { walls: [], floor: [], furniture: [], lighting: [] }
const box = (g, name, mat, x0, y0, z0, x1, y1, z1) => groups[g].push({ name, mat, x0, y0, z0, x1, y1, z1 })

// Floor
box('floor', 'floor_oak', 'oak', 0, -0.06, 0, W, 0, D)
box('floor', 'floor_bath_tile', 'tile', 5 + T / 2, 0, 4.2 + T / 2, 7 - T / 2, 0.012, D - T / 2)

// Wall run helper: straight wall along x (z fixed) or along z (x fixed), with openings.
function wallX(name, z, x0, x1, openings = []) {
  let cur = x0
  const segs = [...openings].sort((a, b) => a.from - b.from)
  segs.forEach((o, i) => {
    if (o.from > cur) box('walls', `${name}_${i}a`, 'plaster', cur, 0, z - T / 2, o.from, H, z + T / 2)
    if (o.sill) box('walls', `${name}_${i}sill`, 'plaster', o.from, 0, z - T / 2, o.to, o.sill, z + T / 2)
    box('walls', `${name}_${i}head`, 'plaster', o.from, o.head, z - T / 2, o.to, H, z + T / 2)
    if (o.sill) box('walls', `${name}_${i}glass`, 'glass', o.from, o.sill, z - 0.01, o.to, o.head, z + 0.01)
    cur = o.to
  })
  if (cur < x1) box('walls', `${name}_end`, 'plaster', cur, 0, z - T / 2, x1, H, z + T / 2)
}
function wallZ(name, x, z0, z1, openings = []) {
  let cur = z0
  const segs = [...openings].sort((a, b) => a.from - b.from)
  segs.forEach((o, i) => {
    if (o.from > cur) box('walls', `${name}_${i}a`, 'plaster', x - T / 2, 0, cur, x + T / 2, H, o.from)
    if (o.sill) box('walls', `${name}_${i}sill`, 'plaster', x - T / 2, 0, o.from, x + T / 2, o.sill, o.to)
    box('walls', `${name}_${i}head`, 'plaster', x - T / 2, o.head, o.from, x + T / 2, H, o.to)
    if (o.sill) box('walls', `${name}_${i}glass`, 'glass', x - 0.01, o.sill, o.from, x + 0.01, o.head, o.to)
    cur = o.to
  })
  if (cur < z1) box('walls', `${name}_end`, 'plaster', x - T / 2, 0, cur, x + T / 2, H, z1)
}
const door = (from, to) => ({ from, to, head: 2.1 })
const win = (from, to) => ({ from, to, sill: 0.75, head: 2.25 })

// Exterior (windows on north + west + east, entrance on south of study)
wallX('wall_north', 0, 0, W, [win(1.2, 4.4), win(6.6, 8.6)])
wallX('wall_south', D, 0, W, [win(1.4, 3.4), door(8.2, 9.2)])
wallZ('wall_west', 0, 0, D, [win(1.2, 3.0)])
wallZ('wall_east', W, 0, D, [win(1.4, 3.2), win(5.0, 6.2)])
// Interior
wallX('wall_mid', 4.2, 0, W, [door(3.6, 4.5), door(5.6, 6.4), door(8.0, 8.9)])
wallZ('wall_bed_bath', 5, 4.2, D)
wallZ('wall_bath_study', 7, 4.2, D)

// Living
box('furniture', 'furn_rug', 'linen', 1.0, 0, 1.4, 3.8, 0.012, 3.4)
box('furniture', 'furn_sofa_base', 'fabric', 1.2, 0, 2.9, 3.6, 0.42, 3.8)
box('furniture', 'furn_sofa_back', 'fabric', 1.2, 0.42, 3.55, 3.6, 0.82, 3.8)
box('furniture', 'furn_sofa_arm_l', 'fabric', 1.2, 0.42, 2.9, 1.38, 0.62, 3.55)
box('furniture', 'furn_sofa_arm_r', 'fabric', 3.42, 0.42, 2.9, 3.6, 0.62, 3.55)
box('furniture', 'furn_cushion', 'terracotta', 1.5, 0.42, 3.3, 1.95, 0.72, 3.5)
box('furniture', 'furn_coffee_table', 'walnut', 1.9, 0.3, 1.9, 2.9, 0.36, 2.5)
box('furniture', 'furn_coffee_table_base', 'walnut', 2.05, 0, 2.05, 2.75, 0.3, 2.35)
box('furniture', 'furn_media_unit', 'walnut', 1.3, 0, 0.12, 3.5, 0.45, 0.52)
box('furniture', 'furn_armchair', 'terracotta', 4.3, 0, 1.6, 5.1, 0.75, 2.4)
// Kitchen + dining
box('furniture', 'furn_counter', 'stone', 6.3, 0, 0.1, 9.9, 0.9, 0.72)
box('furniture', 'furn_counter_upper', 'walnut', 8.7, 1.6, 0.1, 9.9, 2.4, 0.45)
box('furniture', 'furn_island', 'stone', 7.3, 0, 1.8, 9.1, 0.92, 2.7)
box('furniture', 'furn_island_top', 'brass', 7.25, 0.92, 1.75, 9.15, 0.95, 2.75)
for (const [i, x] of [7.6, 8.2, 8.8].entries()) box('furniture', `furn_stool_${i}`, 'walnut', x - 0.18, 0, 3.0, x + 0.18, 0.66, 3.36)
// Bedroom
box('furniture', 'furn_bed', 'linen', 1.4, 0, 4.85, 3.2, 0.52, 6.85)
box('furniture', 'furn_bed_head', 'walnut', 1.3, 0, 6.8, 3.3, 1.1, 6.9)
box('furniture', 'furn_throw', 'terracotta', 1.4, 0.52, 4.85, 3.2, 0.54, 5.35)
box('furniture', 'furn_side_l', 'walnut', 0.8, 0, 6.35, 1.25, 0.5, 6.85)
box('furniture', 'furn_side_r', 'walnut', 3.35, 0, 6.35, 3.8, 0.5, 6.85)
box('furniture', 'furn_wardrobe', 'walnut', 0.1, 0, 4.4, 0.7, 2.2, 6.0)
// Bath
box('furniture', 'furn_vanity', 'stone', 5.15, 0, 6.35, 6.85, 0.85, 6.9)
box('furniture', 'furn_mirror', 'glass', 5.4, 1.1, 6.9, 6.6, 1.9, 6.92)
box('furniture', 'furn_shower', 'tile', 5.15, 0, 4.4, 6.2, 0.05, 5.4)
// Study
box('furniture', 'furn_desk', 'walnut', 7.5, 0.72, 4.45, 9.8, 0.76, 5.1)
box('furniture', 'furn_desk_leg_l', 'walnut', 7.55, 0, 4.5, 7.6, 0.72, 5.05)
box('furniture', 'furn_desk_leg_r', 'walnut', 9.7, 0, 4.5, 9.75, 0.72, 5.05)
box('furniture', 'furn_chair', 'charcoal', 8.3, 0, 5.3, 8.8, 0.9, 5.8)
box('furniture', 'furn_shelf', 'walnut', 9.5, 0, 5.9, 9.9, 1.8, 6.9)
// Lighting fixtures (glow when the lighting stage runs)
box('lighting', 'light_pendant_island_a', 'shade', 7.75, 1.95, 2.1, 8.05, 2.2, 2.4)
box('lighting', 'light_pendant_island_b', 'shade', 8.35, 1.95, 2.1, 8.65, 2.2, 2.4)
box('lighting', 'light_floor_lamp', 'shade', 3.75, 1.35, 3.35, 4.1, 1.6, 3.7)
box('furniture', 'furn_floor_lamp_stem', 'brass', 3.9, 0, 3.5, 3.95, 1.35, 3.55)
box('lighting', 'light_bedside_l', 'shade', 0.9, 0.5, 6.45, 1.15, 0.78, 6.7)
box('lighting', 'light_bedside_r', 'shade', 3.45, 0.5, 6.45, 3.7, 0.78, 6.7)
box('lighting', 'light_desk', 'brass', 9.3, 0.76, 4.6, 9.45, 1.2, 4.75)

/* ── glTF assembly: one unit cube, one mesh per material, scaled nodes ───── */
const cube = (() => {
  const P = [],
    N = [],
    I = []
  const faces = [
    [[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]],
    [[-1, 0, 0], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]],
    [[0, 1, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]],
    [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]],
    [[0, 0, 1], [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]]],
    [[0, 0, -1], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
  ]
  for (const [n, vs] of faces) {
    const b = P.length / 3
    for (const v of vs) {
      P.push(...v)
      N.push(...n)
    }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3)
  }
  return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) }
})()

const bin = Buffer.concat([Buffer.from(cube.P.buffer), Buffer.from(cube.N.buffer), Buffer.from(cube.I.buffer)])
const pad4 = (b, fill = 0) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), fill)]) : b)

const gltf = {
  asset: { version: '2.0', generator: 'pradnya-portfolio demo generator' },
  extras: { note: 'Demonstration geometry for the viewer preview. Not a Pradnya Salunkhe project.' },
  scene: 0,
  scenes: [{ name: 'demo', nodes: [] }],
  nodes: [],
  meshes: matNames.map((m, i) => ({ name: `box_${m}`, primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: i }] })),
  materials: matNames.map((m) => ({
    name: m,
    pbrMetallicRoughness: { baseColorFactor: [...MATS[m].c, 1], roughnessFactor: MATS[m].r, metallicFactor: MATS[m].m },
  })),
  buffers: [{ byteLength: pad4(bin).length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: cube.P.byteLength, target: 34962 },
    { buffer: 0, byteOffset: cube.P.byteLength, byteLength: cube.N.byteLength, target: 34962 },
    { buffer: 0, byteOffset: cube.P.byteLength + cube.N.byteLength, byteLength: cube.I.byteLength, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 1] },
    { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' },
    { bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' },
  ],
}

for (const [gname, boxes] of Object.entries(groups)) {
  const children = []
  for (const b of boxes) {
    gltf.nodes.push({
      name: b.name,
      mesh: matNames.indexOf(b.mat),
      translation: [b.x0, b.y0, b.z0],
      scale: [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0],
    })
    children.push(gltf.nodes.length - 1)
  }
  gltf.nodes.push({ name: gname, children })
  gltf.scenes[0].nodes.push(gltf.nodes.length - 1)
}

const json = pad4(Buffer.from(JSON.stringify(gltf)), 0x20)
const binPadded = pad4(bin)
const header = Buffer.alloc(12)
header.writeUInt32LE(0x46546c67, 0) // 'glTF'
header.writeUInt32LE(2, 4)
header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8)
const chunk = (buf, type) => {
  const h = Buffer.alloc(8)
  h.writeUInt32LE(buf.length, 0)
  h.writeUInt32LE(type, 4)
  return Buffer.concat([h, buf])
}
const glb = Buffer.concat([header, chunk(json, 0x4e4f534a), chunk(binPadded, 0x004e4942)])

mkdirSync(path.join(root, 'public/demo'), { recursive: true })
writeFileSync(path.join(root, 'public/demo/demo-room.glb'), glb)

/* ── Matching plan drawing (1 unit = 1 cm) ──────────────────────────────── */
const M = 70 // margin (cm)
const VW = W * 100 + M * 2
const VH = D * 100 + M * 2
const px = (x) => (x * 100 + M).toFixed(1)
const wallsSvg = groups.walls
  .filter((b) => b.y0 === 0 && b.y1 === H)
  .map((b) => `<rect x="${px(b.x0)}" y="${px(b.z0)}" width="${((b.x1 - b.x0) * 100).toFixed(1)}" height="${((b.z1 - b.z0) * 100).toFixed(1)}"/>`)
  .join('')
const winSvg = groups.walls
  .filter((b) => b.name.endsWith('sill'))
  .map((b) => `<rect x="${px(b.x0)}" y="${px(b.z0)}" width="${((b.x1 - b.x0) * 100).toFixed(1)}" height="${((b.z1 - b.z0) * 100).toFixed(1)}"/>`)
  .join('')
const furnSvg = groups.furniture
  .filter((b) => b.y0 === 0 && !/rug|stem|leg|mirror/.test(b.name))
  .map((b) => `<rect x="${px(b.x0)}" y="${px(b.z0)}" width="${((b.x1 - b.x0) * 100).toFixed(1)}" height="${((b.z1 - b.z0) * 100).toFixed(1)}"/>`)
  .join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">
<rect width="100%" height="100%" fill="#fafaf7"/>
<g fill="none" stroke="#a79a88" stroke-width="1" stroke-dasharray="4 6">${furnSvg}</g>
<g fill="#fafaf7" stroke="#1d1d1b" stroke-width="1.5">${winSvg}</g>
<g fill="#1d1d1b">${wallsSvg}</g>
<g font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#65594c" letter-spacing="2">
<text x="${M}" y="${VH - 24}">DEMONSTRATION PLAN — NOT TO SCALE — NOT A PORTFOLIO PROJECT</text>
</g>
</svg>`
writeFileSync(path.join(root, 'public/demo/demo-plan.svg'), svg)

/* ── Viewer data (rooms in % of the plan image, views + hotspots in metres) ── */
const pct = (x, z) => [+(((x * 100 + M) / VW) * 100).toFixed(2), +(((z * 100 + M) / VH) * 100).toFixed(2)]
const rect = (x0, z0, x1, z1) => [pct(x0, z0), pct(x1, z0), pct(x1, z1), pct(x0, z1)]
const rooms = [
  { name: 'Living', key: 'living-room', points: rect(0.07, 0.07, 6, 4.13) },
  { name: 'Kitchen', key: 'kitchen', points: rect(6, 0.07, 9.93, 4.13) },
  { name: 'Bedroom', key: 'bedroom', points: rect(0.07, 4.27, 4.93, 6.93) },
  { name: 'Bath', key: 'bath', points: rect(5.07, 4.27, 6.93, 6.93) },
  { name: 'Study', key: 'study', points: rect(7.07, 4.27, 9.93, 6.93) },
]
const views = [
  { key: 'living-room', label: 'Living', position: [5.6, 1.55, 3.9], target: [2.2, 0.7, 2.0] },
  { key: 'kitchen', label: 'Kitchen', position: [4.9, 1.6, 3.6], target: [8.3, 0.9, 1.4] },
  { key: 'bedroom', label: 'Bedroom', position: [4.5, 1.7, 4.55], target: [2.1, 0.5, 6.0] },
  { key: 'bath', label: 'Bath', position: [6.0, 2.4, 4.35], target: [6.0, 0.5, 6.1] },
  { key: 'study', label: 'Study', position: [7.35, 1.6, 4.5], target: [8.9, 0.8, 5.9] },
]
const hotspots = [
  { label: 'Lighting', title: 'Pendant pair', text: 'Demonstration hotspot — in a real project this explains the lighting design.', position: [8.2, 2.35, 2.25] },
  { label: 'Sofa', title: 'Living seating', text: 'Demonstration hotspot — furniture notes, dimensions or finish would go here.', position: [2.4, 1.0, 3.35] },
  { label: 'Material', title: 'Timber floor', text: 'Demonstration hotspot — material name, finish and application.', position: [4.6, 0.05, 0.9] },
  { label: 'Dining', title: 'Island seating', text: 'Demonstration hotspot — how the space is used.', position: [8.2, 1.15, 3.2] },
]
const ts = `// GENERATED by scripts/make-demo-glb.mjs — demonstration data for /lab only.
import type { FloorPlan, Model3D } from '@/lib/types'

export const demoPlan: FloorPlan = ${JSON.stringify(
  {
    id: 'demo-plan',
    title: 'Demonstration plan',
    image: { url: '/demo/demo-plan.svg', alt: 'Demonstration floor plan with five rooms', width: VW, height: VH, mimeType: 'image/svg+xml' },
    furnishedImage: null,
    note: 'Demonstration geometry',
    rooms,
  },
  null,
  2,
)}

export const demoModel: Model3D = ${JSON.stringify(
  {
    id: 'demo-model',
    title: 'Demonstration room',
    url: '/demo/demo-room.glb',
    filesize: glb.length,
    poster: { url: '/demo/demo-poster.jpg', alt: 'Demonstration model rendered from above', width: 1600, height: 900 },
    lite: null,
    buildSequence: true,
    views,
    hotspots,
    demo: true,
  },
  null,
  2,
)}
`
writeFileSync(path.join(root, 'src/content/demo.ts'), ts)
console.log(`[demo] demo-room.glb ${(glb.length / 1024).toFixed(1)} KB · ${gltf.nodes.length} nodes · plan ${VW}×${VH}`)
