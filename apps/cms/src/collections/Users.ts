import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { checkRole } from '../access/utilities'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { es: 'Usuario', en: 'User' }, plural: { es: 'Usuarios', en: 'Users' } },
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
      name: 'editorLanguage',
      type: 'select',
      label: { es: 'Idioma del editor', en: 'Editor language' },
      defaultValue: 'es',
      required: true,
      options: [
        { label: { es: 'Español', en: 'Spanish' }, value: 'es' },
        { label: { es: 'Inglés', en: 'English' }, value: 'en' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          es: 'Idioma preferido para la administración del CMS.',
          en: 'Preferred language for CMS administration.',
        },
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['admin'],
      options: [
        { label: { es: 'Administrador', en: 'Admin' }, value: 'admin' },
        { label: { es: 'Cliente', en: 'Customer' }, value: 'customer' },
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
