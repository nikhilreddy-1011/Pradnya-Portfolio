import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { HEX } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'

export const Materials: CollectionConfig = {
  slug: 'materials',
  labels: { singular: 'Material', plural: 'Materials' },
  admin: {
    group: 'Library',
    useAsTitle: 'name',
    defaultColumns: ['name', 'tone', 'updatedAt'],
    description: 'Reusable material library. Projects reference materials and add their own application / room.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'texture', type: 'upload', relationTo: 'media', admin: { description: 'Photograph or scan of the material. Preferred over a tone.' } },
    {
      name: 'tone',
      type: 'text',
      admin: { description: 'Indicative colour (hex) shown when no texture image exists, e.g. #C9A57B. Labelled "indicative" on the site.' },
      validate: (v: unknown) => (!v || (typeof v === 'string' && HEX.test(v)) ? true : 'Use a hex colour like #C9A57B'),
    },
    { name: 'description', type: 'textarea' },
  ],
}
