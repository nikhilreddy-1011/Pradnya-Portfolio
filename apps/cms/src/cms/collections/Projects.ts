import type { CollectionConfig } from 'payload'
import { publishedOrAuthenticated, authenticated } from '../access'
import { credibilityOptions, HEX, slugField } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'
import { notAPanorama, panorama2to1 } from '../validators'

// Public website (Vercel). The preview link starts a signed hand-off — see /api/preview-auth.
const webURL = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '')

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  admin: {
    group: 'Portfolio',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'credibility', 'featured', '_status', 'updatedAt'],
    description: 'Only publish what is true: every project shows its status (coursework, concept, professional…).',
    preview: (doc) => `${webURL}/api/preview?slug=${encodeURIComponent(String(doc?.slug ?? ''))}`,
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 30 },
  defaultSort: 'order',
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show under "Selected Spaces" on the homepage.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
      admin: { position: 'sidebar', description: 'Lower numbers appear first. Also sets the 01 / 02 numbering.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
                { name: 'credibility', label: 'Status', type: 'select', required: true, defaultValue: 'portfolio-coursework', options: credibilityOptions },
              ],
            },
            { name: 'typology', label: 'Project type', type: 'text', admin: { description: 'e.g. French-inspired commercial café' } },
            {
              type: 'row',
              fields: [
                { name: 'area', type: 'text', admin: { description: 'e.g. 1,350 sq.ft. Leave blank if unknown.' } },
                { name: 'year', type: 'text', admin: { description: 'Leave blank if unknown.' } },
                { name: 'location', type: 'text' },
              ],
            },
            { name: 'summary', label: 'Short description', type: 'textarea', required: true, maxLength: 280 },
            {
              name: 'tools',
              type: 'select',
              hasMany: true,
              options: ['AutoCAD', 'SketchUp', 'V-Ray', 'Revit', '3ds Max', 'Photoshop', 'Enscape', 'Lumion', 'D5 Render'].map((t) => ({ label: t, value: t })),
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              validate: notAPanorama,
              admin: { description: 'Hero render — an ordinary single-view render (never a 360° panorama), landscape, at least 2400 px wide.' },
            },
            { name: 'coverImageMobile', type: 'upload', relationTo: 'media', validate: notAPanorama, admin: { description: 'Optional portrait crop for phones.' } },
          ],
        },
        {
          label: 'Story',
          fields: [
            { name: 'conceptStatement', label: 'Concept — one line', type: 'text', admin: { description: 'Short editorial line shown large, e.g. "Cozy, minimal-French."' } },
            { name: 'concept', label: 'The concept', type: 'textarea' },
            { name: 'brief', label: 'The brief', type: 'textarea' },
            { name: 'programme', label: 'Programme / spaces planned', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
            { name: 'spacePlanning', label: 'Space planning', type: 'textarea' },
            {
              name: 'process',
              label: 'Design process (project-specific)',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            {
              name: 'designDetails',
              label: 'Design details',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
                { name: 'image', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: 'Plans, 360°, 3D & Video',
          fields: [
            { name: 'floorPlans', type: 'relationship', relationTo: 'floor-plans', hasMany: true },
            {
              // Stored as media references (ObjectIds in MongoDB) — never image data in the database.
              name: 'panorama360',
              label: '360° views',
              type: 'array',
              labels: { singular: '360° view', plural: '360° views' },
              admin: {
                description:
                  'Equirectangular 2:1 panoramas rendered with a spherical camera (V-Ray / Enscape / Twinmotion / D5), one per room. Only used in the 360° section — never as the cover.',
                initCollapsed: false,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Room', type: 'text', required: true, admin: { description: 'e.g. Kitchen' } },
                    {
                      name: 'initialYaw',
                      label: 'Starting direction (°)',
                      type: 'number',
                      min: 0,
                      max: 360,
                      defaultValue: 180,
                      admin: { description: '0 = left edge of the image, 180 = centre, 360 = right edge.' },
                    },
                    {
                      name: 'initialPitch',
                      label: 'Starting tilt (°)',
                      type: 'number',
                      min: -45,
                      max: 45,
                      defaultValue: 0,
                      admin: { description: '0 = eye level. Negative looks down.' },
                    },
                  ],
                },
                {
                  name: 'description',
                  label: 'Intro line (optional)',
                  type: 'text',
                  admin: { description: 'Shown under the section title, e.g. “Explore the TV wall, illuminated shelving and console.”' },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'image',
                      label: '360° image — master',
                      type: 'upload',
                      relationTo: 'media',
                      required: true,
                      // A panorama must be exactly 2:1 or it will look stretched.
                      validate: panorama2to1(true),
                      admin: { description: 'Full resolution: 8192 × 4096 recommended (4096 × 2048 minimum).' },
                    },
                    {
                      name: 'imageStandard',
                      label: '360° image — 4K (optional)',
                      type: 'upload',
                      relationTo: 'media',
                      validate: panorama2to1(false),
                      admin: { description: '4096 × 2048 version of the same render, used on phones and weaker GPUs.' },
                    },
                  ],
                },
              ],
            },
            { name: 'models', label: '3D models', type: 'relationship', relationTo: 'models', hasMany: true },
            { name: 'videos', label: 'Walkthrough / videos', type: 'relationship', relationTo: 'videos', hasMany: true },
          ],
        },
        {
          label: 'Materials',
          fields: [
            {
              name: 'materials',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'material', type: 'relationship', relationTo: 'materials', required: true },
                    { name: 'application', type: 'text', admin: { description: 'Optional, e.g. "Table tops"' } },
                    { name: 'room', type: 'text' },
                  ],
                },
              ],
            },
            {
              name: 'palette',
              label: 'Colour palette',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    {
                      name: 'hex',
                      type: 'text',
                      required: true,
                      validate: (v: unknown) => (typeof v === 'string' && HEX.test(v) ? true : 'Hex colour, e.g. #A65F45'),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Gallery',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'caption', type: 'text' },
                    { name: 'room', type: 'text' },
                    {
                      name: 'layout',
                      type: 'select',
                      defaultValue: 'half',
                      options: [
                        { label: 'Full width', value: 'full' },
                        { label: 'Half', value: 'half' },
                        { label: 'Tall', value: 'tall' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'beforeAfter',
              label: 'Before / after (real projects only)',
              type: 'array',
              admin: { description: 'Use only for real spaces with genuine "before" photographs.' },
              fields: [
                { type: 'row', fields: [{ name: 'before', type: 'upload', relationTo: 'media', required: true }, { name: 'after', type: 'upload', relationTo: 'media', required: true }] },
                { name: 'caption', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              fields: [
                { name: 'title', type: 'text', admin: { description: 'Defaults to the project title.' } },
                { name: 'description', type: 'textarea', maxLength: 170, admin: { description: 'Defaults to the short description.' } },
                { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Social share image. Defaults to the cover.' } },
                { name: 'noindex', type: 'checkbox', defaultValue: false, admin: { description: 'Unlisted: hide from search engines and the sitemap.' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
