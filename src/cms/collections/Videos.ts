import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { projectRelation } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    group: 'Library',
    useAsTitle: 'title',
    defaultColumns: ['title', 'provider', 'project', 'updatedAt'],
    description: 'Walkthroughs and flythroughs. Long videos go to Cloudinary (adaptive streaming); short clips can be uploaded as MP4.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    projectRelation(),
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'walkthrough',
      options: [
        { label: 'Walkthrough', value: 'walkthrough' },
        { label: 'Flythrough', value: 'flythrough' },
        { label: 'Rendered presentation', value: 'presentation' },
        { label: 'Before / after', value: 'before-after' },
      ],
    },
    {
      name: 'provider',
      type: 'radio',
      required: true,
      defaultValue: 'cloudinary',
      options: [
        { label: 'Cloudinary (recommended — adaptive streaming)', value: 'cloudinary' },
        { label: 'Uploaded MP4 (short clips under 40 MB)', value: 'file' },
      ],
    },
    {
      name: 'cloudinaryUploader',
      type: 'ui',
      admin: {
        condition: (data) => data?.provider === 'cloudinary',
        components: { Field: '@/components/admin/CloudinaryUploadField#CloudinaryUploadField' },
      },
    },
    {
      name: 'cloudinaryPublicId',
      label: 'Cloudinary public ID',
      type: 'text',
      admin: {
        condition: (data) => data?.provider === 'cloudinary',
        description: 'Filled automatically by the uploader above, or paste an existing public ID.',
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'documents',
      admin: { condition: (data) => data?.provider === 'file' },
    },
    { name: 'poster', type: 'upload', relationTo: 'media', required: true },
    { name: 'captions', type: 'upload', relationTo: 'documents', admin: { description: 'WebVTT captions (.vtt), optional.' } },
    {
      type: 'row',
      fields: [
        { name: 'duration', type: 'text', admin: { description: 'e.g. 1:42' } },
        {
          name: 'aspect',
          type: 'select',
          defaultValue: '16/9',
          options: ['16/9', '21/9', '4/3', '1/1', '4/5', '9/16'].map((v) => ({ label: v.replace('/', ':'), value: v })),
        },
      ],
    },
  ],
}
