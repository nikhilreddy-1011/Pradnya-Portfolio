import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks'

const list = (name: string, label?: string) => ({
  name,
  label,
  type: 'array' as const,
  fields: [{ name: 'item', type: 'text' as const, required: true }],
})

export const Profile: GlobalConfig = {
  slug: 'profile',
  label: 'Profile',
  admin: { group: 'Settings', description: 'Everything about Pradnya shown across the site. Keep it factual.' },
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'name', type: 'text', required: true },
            { type: 'row', fields: [
              { name: 'role', type: 'text', required: true, admin: { description: 'Shown under the name, e.g. Interior Designer' } },
              { name: 'statusLine', type: 'text', admin: { description: 'e.g. Interior Design certification in progress' } },
            ] },
            { name: 'availability', type: 'text', admin: { description: 'e.g. Open to internship opportunities. Leave empty to hide.' } },
            {
              name: 'photo',
              label: 'Profile photo',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Real, approved portrait only. Set the focal point on her face so crops stay centred.' },
            },
            { type: 'row', fields: [
              { name: 'location', type: 'text' },
              { name: 'email', type: 'email' },
              { name: 'phone', type: 'text' },
            ] },
            { name: 'cv', label: 'Downloadable CV (PDF)', type: 'upload', relationTo: 'documents' },
            {
              name: 'socialLinks',
              type: 'array',
              admin: { description: 'Only add real profiles.' },
              fields: [
                { type: 'row', fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true }] },
              ],
            },
          ],
        },
        {
          label: 'About',
          fields: [
            { name: 'aboutHeadline', type: 'text' },
            { name: 'aboutIntro', type: 'textarea' },
            { name: 'aboutBody', type: 'textarea', admin: { description: 'Separate paragraphs with a blank line.' } },
            {
              name: 'transferable',
              label: 'Transferable strengths',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            list('strengths'),
            list('achievements'),
            list('languages'),
          ],
        },
        {
          label: 'Skills',
          fields: [
            {
              name: 'skillGroups',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'items', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
              ],
            },
          ],
        },
        {
          label: 'Education & Experience',
          fields: [
            {
              name: 'education',
              type: 'array',
              fields: [
                { type: 'row', fields: [
                  { name: 'title', type: 'text', required: true },
                  { name: 'institution', type: 'text' },
                  { name: 'year', type: 'text' },
                ] },
                { name: 'status', type: 'text', admin: { description: 'e.g. Pursuing — completion certificate awaited' } },
                { name: 'isDesign', type: 'checkbox', label: 'Design education' },
              ],
            },
            {
              name: 'experience',
              type: 'array',
              fields: [
                { type: 'row', fields: [
                  { name: 'role', type: 'text', required: true },
                  { name: 'organisation', type: 'text', required: true },
                ] },
                { type: 'row', fields: [
                  { name: 'start', type: 'text', required: true, admin: { description: 'e.g. Oct 2022' } },
                  { name: 'end', type: 'text', admin: { description: 'Leave blank for "Present"' } },
                ] },
                { name: 'summary', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Site visits',
          fields: [
            {
              name: 'siteVisits',
              type: 'group',
              fields: [
                { type: 'row', fields: [{ name: 'count', type: 'number' }, { name: 'title', type: 'text' }] },
                { name: 'text', type: 'textarea' },
                list('points', 'What they covered'),
                { name: 'images', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },
              ],
            },
          ],
        },
      ],
    },
  ],
}
