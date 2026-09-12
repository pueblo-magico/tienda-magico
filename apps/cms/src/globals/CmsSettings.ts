import type { CheckboxField, Field, GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { CMS_NAVIGATION_ITEMS } from '../utilities/cmsNavigation'

const groupLabels = {
  content: { es: 'Contenido', en: 'Content' },
  shop: { es: 'Tienda', en: 'Shop' },
  settings: { es: 'Configuración', en: 'Settings' },
} as const

function visibilityFields(group: keyof typeof groupLabels): Field[] {
  const switches: CheckboxField[] = CMS_NAVIGATION_ITEMS.filter((item) => item.group === group).map(
    (item) => ({
      name: item.key,
      type: 'checkbox',
      label: item.label,
      defaultValue: true,
      required: true,
      admin: {
        className: 'cms-visibility-switch',
        components: {
          Field: '@/components/CmsVisibilityRoleField',
        },
      },
    }),
  )

  return [
    {
      name: `${group}RoleHeader`,
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/CmsVisibilityRoleHeader',
        },
      },
    },
    ...switches,
  ]
}

export const CmsSettings: GlobalConfig = {
  slug: 'cms-settings',
  label: { es: 'Configuración del CMS', en: 'CMS settings' },
  admin: {
    group: { es: 'Configuración', en: 'Settings' },
    description: {
      es: 'Controla qué secciones aparecen en la navegación. No modifica permisos ni acceso directo.',
      en: 'Controls which sections appear in navigation. It does not change permissions or direct access.',
    },
  },
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  fields: (Object.keys(groupLabels) as (keyof typeof groupLabels)[]).map((group) => ({
    type: 'collapsible',
    label: groupLabels[group],
    fields: visibilityFields(group),
  })),
}
