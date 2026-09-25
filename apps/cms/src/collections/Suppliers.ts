import type { CollectionConfig } from 'payload'

import { purchasingFinanceAccess } from '../access/purchasingFinanceAccess'
import { commercialTermsFields, validateSupplierCommercialTerms } from './commercialAgreements'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: {
    singular: { es: 'Proveedor', en: 'Supplier' },
    plural: { es: 'Proveedores', en: 'Suppliers' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'reference', 'country', 'updatedAt'],
    group: { es: 'Tienda', en: 'Shop' },
    description: {
      es: 'Datos privados de compras. Un proveedor no es una marca y su país no define el origen del producto.',
      en: 'Private purchasing data. A supplier is not a brand and its country does not define product origin.',
    },
  },
  access: {
    create: purchasingFinanceAccess,
    delete: purchasingFinanceAccess,
    read: purchasingFinanceAccess,
    update: purchasingFinanceAccess,
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: { es: 'Nombre', en: 'Name' } },
    {
      name: 'reference',
      type: 'text',
      unique: true,
      index: true,
      label: { es: 'Referencia interna', en: 'Internal reference' },
    },
    {
      name: 'country',
      type: 'text',
      label: { es: 'País del proveedor (ISO)', en: 'Supplier country (ISO)' },
      validate: (value: unknown) =>
        value == null || value === '' || (typeof value === 'string' && /^[A-Z]{2}$/.test(value))
          ? true
          : 'Usá un código ISO de dos letras mayúsculas, por ejemplo AR.',
    },
    { name: 'contactName', type: 'text', label: { es: 'Contacto', en: 'Contact' } },
    { name: 'contactEmail', type: 'email', label: { es: 'Correo', en: 'Email' } },
    { name: 'contactPhone', type: 'text', label: { es: 'Teléfono', en: 'Phone' } },
    {
      name: 'defaultTerms',
      type: 'group',
      label: { es: 'Acuerdo comercial predeterminado', en: 'Default commercial agreement' },
      hooks: { beforeValidate: [validateSupplierCommercialTerms] },
      fields: commercialTermsFields({ allowInherit: false }),
    },
    { name: 'notes', type: 'textarea', label: { es: 'Notas internas', en: 'Internal notes' } },
  ],
}
