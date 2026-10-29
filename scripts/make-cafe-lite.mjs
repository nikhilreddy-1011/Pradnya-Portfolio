/**
 * Builds the lightweight Café Lumière model (merged by material, meshopt + WebP textures) from the original GLB.
 * One-off tool — not part of the site build. Run from the project root:
 *   npm i --no-save @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer sharp
 *   node scripts/make-cafe-lite.mjs
 * The cut-away node `Ceiling_Removable_Main_Slab` is deliberately NOT merged so the "Ceiling" toggle keeps working.
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { flatten, join, weld, prune, dedup, textureCompress, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import sharp from 'sharp'
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read('assets/originals/portfolio-incoming/cafe-lumiere-interactive-model.glb')
const root = doc.getRoot()
const KEEP = 'Ceiling_Removable_Main_Slab'
// Anonymise everything except the cut-away ceiling so join() can merge by material but never merges the ceiling.
for (const n of root.listNodes()) if (n.getName() !== KEEP) n.setName('')
for (const m of root.listMeshes()) if (m.getName() !== KEEP && !root.listNodes().some((n) => n.getName() === KEEP && n.getMesh() === m)) m.setName('')
await doc.transform(
  flatten(),
  join({ keepNamed: true }),
  weld(),
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)
const names = root.listNodes().map((n) => n.getName()).filter(Boolean)
console.log('named nodes left:', names)
console.log('meshes', root.listMeshes().length, 'prims', root.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0), 'materials', root.listMaterials().length)
await io.write('public/models/cafe-lumiere/cafe-lumiere-interactive-model-lite.glb', doc)
