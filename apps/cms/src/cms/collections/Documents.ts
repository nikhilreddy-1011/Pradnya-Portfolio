import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { guardUpload } from './uploadGuards'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents' },
  admin: {
    group: 'Library',
    useAsTitle: 'title',
    description: 'CV / portfolio PDFs, video captions (.vtt) and short MP4 clips. Long walkthroughs belong in Videos (Cloudinary).',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  upload: { mimeTypes: ['application/pdf', 'text/vtt', 'video/mp4', 'video/webm'] },
  hooks: {
    beforeValidate: [guardUpload({ extensions: ['pdf', 'vtt', 'mp4', 'webm'], maxBytes: 40e6, label: 'Document' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'other',
      options: [
        { label: 'CV / Résumé', value: 'cv' },
        { label: 'Portfolio PDF', value: 'portfolio' },
        { label: 'Captions (.vtt)', value: 'captions' },
        { label: 'Short video clip', value: 'video' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
}
