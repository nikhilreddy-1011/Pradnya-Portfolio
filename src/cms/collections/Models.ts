import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { projectRelation, vec3Field } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'
import { guardUpload } from './uploadGuards'

/**
 * Optimised glTF/GLB models. Never upload raw .skp files — export to glTF and run
 * `npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048`
 *
 * Node naming convention (enables the plan → 3D build sequence):
 *   wall*   walls        floor*  floor slabs / finishes
 *   furn*   furniture    light*  light fixtures (glow when lighting appears)
 */
export const Models: CollectionConfig = {
  slug: 'models',
  labels: { singular: '3D Asset', plural: '3D Assets' },
  admin: {
    group: 'Library',
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'filesize', 'updatedAt'],
    description: 'Optimised .glb / .gltf models (target under 15 MB). See docs/3D-PIPELINE.md.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  upload: {
    mimeTypes: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
  },
  hooks: {
    beforeValidate: [guardUpload({ extensions: ['glb', 'gltf'], maxBytes: 100e6, label: '3D model' })],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    projectRelation(),
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Render shown before the model loads and as the fallback on devices without WebGL.' },
    },
    {
      name: 'lite',
      type: 'relationship',
      relationTo: 'models',
      admin: { description: 'Optional lighter version (< 5 MB) used on phones and slow connections.' },
    },
    {
      name: 'buildSequence',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Play the plan → walls → floor → furniture → materials → lighting sequence (requires the naming convention).' },
    },
    {
      type: 'row',
      fields: [
        vec3Field('cameraPosition', 'Default camera position'),
        vec3Field('cameraTarget', 'Default camera target'),
      ],
    },
    {
      name: 'views',
      label: 'Room views',
      type: 'array',
      admin: { description: 'Camera presets. The key links a floor-plan room ("View in 3D") to this view.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', type: 'text', required: true, admin: { description: 'e.g. living-room' } },
            { name: 'label', type: 'text', required: true },
          ],
        },
        { type: 'row', fields: [vec3Field('position', 'Camera position'), vec3Field('target', 'Look at')] },
      ],
    },
    {
      name: 'hotspots',
      type: 'array',
      admin: { description: 'Numbered points of interest, e.g. Lighting, Sofa, Material.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { description: 'Short tag, e.g. LIGHTING' } },
            { name: 'title', type: 'text', required: true },
          ],
        },
        { name: 'text', type: 'textarea' },
        vec3Field('position', 'Position'),
      ],
    },
  ],
}
