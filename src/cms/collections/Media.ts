import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { projectRelation } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'
import { guardUpload } from './uploadGuards'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Media Library' },
  admin: {
    group: 'Library',
    description: 'Renders, 360° panoramas, photographs, plan exports, textures and the portrait. Alt text is required for accessibility.',
    defaultColumns: ['filename', 'alt', 'project', 'updatedAt'],
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    focalPoint: true,
    crop: true,
    // Responsive variants are generated on demand by next/image (AVIF/WebP),
    // so no server-side image sizes are needed (this also keeps direct client uploads fast).
  },
  hooks: {
    beforeValidate: [guardUpload({ extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'], maxBytes: 25e6, label: 'Image' })],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe what is visible, e.g. "Window seating along the café frontage, light oak tables".' },
    },
    { name: 'caption', type: 'textarea' },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'render',
      options: ['render', 'panorama', 'photograph', 'plan', 'texture', 'portrait', 'diagram', 'other'].map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
      admin: { position: 'sidebar' },
    },
    projectRelation(),
  ],
}
