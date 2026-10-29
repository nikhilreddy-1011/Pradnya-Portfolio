import type { Field, TextField } from 'payload'
import { slugify } from './hooks'

/** URL slug, generated from another field unless edited by hand. */
export const slugField = (from = 'title'): TextField => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Used in the URL, e.g. /work/cafe-lumiere. Generated from the title if left empty.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[from]
        return typeof source === 'string' ? slugify(source) : value
      },
    ],
  },
})

const VEC3 = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/
export const vec3Field = (name: string, label: string, description?: string): TextField => ({
  name,
  label,
  type: 'text',
  admin: { description: description ?? 'x, y, z in metres, e.g. 1.2, 0.9, -2.5' },
  validate: (value: unknown) =>
    !value || (typeof value === 'string' && VEC3.test(value)) ? true : 'Use the format x, y, z (numbers).',
})

export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Credibility / status of a project — shown on every card and case study. */
export const credibilityOptions = [
  { label: 'Portfolio Project / Coursework', value: 'portfolio-coursework' },
  { label: 'Portfolio Project', value: 'portfolio' },
  { label: 'Coursework', value: 'coursework' },
  { label: 'Concept', value: 'concept' },
  { label: 'Site Study', value: 'site-study' },
  { label: 'Professional Project', value: 'professional' },
  { label: 'Design Study', value: 'design-study' },
  { label: 'Portfolio Concept', value: 'portfolio-concept' },
  { label: 'Concept Render', value: 'concept-render' },
]

export const projectRelation = (required = false): Field => ({
  name: 'project',
  type: 'relationship',
  relationTo: 'projects',
  required,
  admin: { position: 'sidebar' },
})
