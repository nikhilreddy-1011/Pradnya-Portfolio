import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { projectRelation } from '../fields'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks'

const POINTS = /^\s*(\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*)(\s+\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*){2,}$/

export const FloorPlans: CollectionConfig = {
  slug: 'floor-plans',
  labels: { singular: 'Floor Plan', plural: 'Floor Plans' },
  admin: {
    group: 'Library',
    useAsTitle: 'title',
    description: 'AutoCAD plan exports (SVG preferred, or high-resolution PNG/WebP) with clickable rooms.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true, defaultValue: 'Floor plan' },
    projectRelation(),
    { name: 'image', label: 'Plan (unfurnished / base)', type: 'upload', relationTo: 'media', required: true },
    { name: 'furnishedImage', label: 'Plan (furnished) — optional', type: 'upload', relationTo: 'media' },
    { name: 'note', type: 'text', admin: { description: 'Optional, e.g. "Not to scale". Only add dimensions you have drawn.' } },
    {
      name: 'rooms',
      type: 'array',
      admin: {
        description:
          'Room outlines as percentages of the plan image: "x,y x,y x,y …" (0–100, from the top-left corner). Open the plan image, note the corner positions, and trace each room clockwise.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'key', type: 'text', admin: { description: 'Matches a 3D room view key, e.g. living-room' } },
          ],
        },
        {
          name: 'points',
          type: 'textarea',
          required: true,
          validate: (v: unknown) => (typeof v === 'string' && POINTS.test(v) ? true : 'At least 3 points: "x,y x,y x,y" with values 0–100.'),
        },
        { name: 'dimensions', type: 'text', admin: { description: 'Only if drawn on the plan, e.g. 4.2 m × 3.6 m' } },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
