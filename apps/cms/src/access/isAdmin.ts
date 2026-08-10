import type { Access } from 'payload'

import { checkRole } from './utilities'

export const isAdmin: Access = ({ req }) => {
  if (req.user) {
    return checkRole(['admin'], req.user as any)
  }
  return false
}
