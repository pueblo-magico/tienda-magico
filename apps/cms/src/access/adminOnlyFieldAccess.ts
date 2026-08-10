import type { FieldAccess } from 'payload'

import { checkRole } from './utilities'

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user as any)
  return false
}
