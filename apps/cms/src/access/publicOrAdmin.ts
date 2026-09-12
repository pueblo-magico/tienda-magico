import type { Access } from 'payload'

import { checkRole } from './utilities'

export const publicVisibleOrAdmin =
  (field: 'isVisible' | 'isActive'): Access =>
  ({ req: { user } }) => {
    if (user && checkRole(['admin'], user)) return true

    return {
      [field]: {
        equals: true,
      },
    }
  }
