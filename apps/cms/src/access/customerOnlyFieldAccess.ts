import type { FieldAccess } from 'payload'

import { checkRole } from './utilities'

export const customerOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole(['customer'], user as any)
  return false
}
