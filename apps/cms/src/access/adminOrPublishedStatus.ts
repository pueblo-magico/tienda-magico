import type { Access } from 'payload'

import { checkRole } from './utilities'

/** Admins see all; public/API only sees published docs. */
export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user as any)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
