import type { Access, FieldAccess } from 'payload'

import { checkRole } from './utilities'

const allowedRoles = ['admin', 'purchasing', 'finance'] as const

export const canManagePurchasing = (user: unknown): boolean =>
  checkRole([...allowedRoles], user as Parameters<typeof checkRole>[1])

export const purchasingFinanceAccess: Access = ({ req: { user } }) => canManagePurchasing(user)

export const purchasingFinanceFieldAccess: FieldAccess = ({ req: { user } }) =>
  canManagePurchasing(user)
