import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { checkRole } from '../access/utilities'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'createdAt'],
  },
  auth: {
    useAPIKey: true,
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    // Allow first user bootstrap; afterwards admins only
    create: ({ req: { user } }) => {
      if (!user) return true
      return checkRole(['admin'], user as any)
    },
    delete: adminOnly,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (checkRole(['admin'], user as any)) return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (checkRole(['admin'], user as any)) return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['admin'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Customer', value: 'customer' },
      ],
      required: true,
      saveToJWT: true,
    },
    {
      name: 'name',
      type: 'text',
    },
  ],
}
