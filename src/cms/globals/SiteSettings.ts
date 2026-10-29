import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Homepage',
          fields: [
            { name: 'heroEyebrow', type: 'text', defaultValue: 'Interior Design' },
            { name: 'heroHeadline', type: 'text', defaultValue: 'Spaces shaped around the way we live.' },
            { name: 'heroImage', type: 'upload', relationTo: 'media', admin: { description: 'Full-screen interior render (landscape, 2400px+).' } },
            { name: 'heroImageMobile', type: 'upload', relationTo: 'media', admin: { description: 'Optional portrait crop for phones.' } },
            { name: 'introText', type: 'textarea' },
            {
              name: 'processIntro',
              type: 'textarea',
              defaultValue: 'A working framework used across these portfolio projects — from the first conversation to the final presentation.',
            },
            {
              name: 'processSteps',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'title', type: 'text', required: true }, { name: 'caption', type: 'text' }] },
                { name: 'text', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'contactHeadline', type: 'text', defaultValue: 'Have a space in mind?' },
            { name: 'contactText', type: 'textarea' },
            { name: 'projectTypes', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text' },
            { name: 'seoDescription', type: 'textarea', maxLength: 170 },
            { name: 'ogImage', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
