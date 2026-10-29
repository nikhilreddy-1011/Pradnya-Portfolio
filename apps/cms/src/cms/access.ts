import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Roles
 *  - admin   : full control, including users
 *  - editor  : edits content
 *  - service : machine account used ONLY by the public website's server (API key). It may read
 *              drafts (preview) and create contact-form inquiries — nothing else.
 */
type Role = 'admin' | 'editor' | 'service'
const roleOf = (req: PayloadRequest): Role | undefined => (req.user as { role?: Role } | null)?.role

/** A signed-in human (admin or editor). Accounts created before roles existed count as staff. */
const isStaffReq = (req: PayloadRequest) => Boolean(req.user) && roleOf(req) !== 'service'

export const anyone: Access = () => true
export const authenticated: Access = ({ req }) => isStaffReq(req)
export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin'
export const isAdminField: FieldAccess = ({ req }) => roleOf(req) === 'admin'
export const isService: Access = ({ req }) => roleOf(req) === 'service'
export const isStaffOrService: Access = ({ req }) => Boolean(req.user)

/** Public visitors only ever see published documents; staff and the website's service account also see drafts. */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
