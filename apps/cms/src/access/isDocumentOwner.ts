import type { Access } from 'payload'

import { checkRole } from './utilities'

/**
 * Admins: full access.
 * Authenticated customers: only their own docs (customer field).
 * Guests: denied (guest carts use secret-based access separately).
 */
export const isDocumentOwner: Access = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user as any)) {
    return true
  }

  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  return false
}
