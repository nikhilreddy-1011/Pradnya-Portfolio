import type { CollectionConfig } from 'payload'
import { authenticated, isService } from '../access'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Inquiry', plural: 'Inquiries' },
  admin: {
    group: 'Inbox',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'status', 'createdAt'],
    description: 'Messages sent through the contact form.',
  },
  access: {
    create: isService, // only the website's server (service API key) can submit contact-form inquiries
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'projectType', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'meta',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'page', type: 'text' },
        { name: 'userAgent', type: 'text' },
      ],
    },
  ],
}
