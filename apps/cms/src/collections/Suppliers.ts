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
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { es: 'Nombre del proveedor', en: 'Supplier name' },
      admin: {
        description: {
          es: 'Nombre comercial o nombre con el que identificamos al proveedor.',
          en: 'Trading name or name used to identify the supplier.',
        },
      },
    },
    {
      name: 'reference',
      type: 'text',
      unique: true,
      index: true,
      label: { es: 'Referencia interna', en: 'Internal reference' },
      admin: {
        description: {
          es: 'Código corto y único para búsquedas y administración. Es opcional; si no usan códigos internos, dejalo vacío.',
          en: 'Short unique code for search and administration. Optional; leave it empty if you do not use internal codes.',
        },
      },
    },
    {
      name: 'country',
      type: 'text',
      label: { es: 'País del proveedor (ISO)', en: 'Supplier country (ISO)' },
      admin: {
        components: { Field: '@/components/IsoCountrySelectField' },
        description: {
          es: 'País donde está radicado el proveedor. No cambia el país de origen de los productos.',
          en: 'Country where the supplier is based. This does not change product country of origin.',
        },
      },
      validate: (value: unknown) =>
        value == null || value === '' || (typeof value === 'string' && /^[A-Z]{2}$/.test(value))
          ? true
          : 'Usá un código ISO de dos letras mayúsculas, por ejemplo AR.',
    },
    {
      name: 'contactName',
      type: 'text',
      label: { es: 'Persona de contacto', en: 'Contact person' },
      admin: {
        description: {
          es: 'Nombre de la persona con quien coordinamos pedidos, consultas o liquidaciones. Es opcional.',
          en: 'Person contacted for orders, questions, or settlements. Optional.',
        },
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: { es: 'Correo electrónico', en: 'Email address' },
      admin: {
        description: {
          es: 'Correo para pedidos, consultas o liquidaciones. Es opcional.',
          en: 'Email used for orders, questions, or settlements. Optional.',
        },
      },
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: { es: 'Teléfono / WhatsApp', en: 'Phone / WhatsApp' },
      admin: {
        description: {
          es: 'Incluí el código de país y de área. Es opcional.',
          en: 'Include country and area codes. Optional.',
        },
      },
    },
    {
      name: 'defaultTerms',
      type: 'group',
      label: { es: 'Acuerdo comercial predeterminado', en: 'Default commercial agreement' },
      hooks: { beforeValidate: [validateSupplierCommercialTerms] },
      admin: {
        description: {
          es: 'Define cómo trabajamos habitualmente con este proveedor. Después se puede reemplazar mediante un acuerdo vigente o una excepción específica del producto.',
          en: 'Defines how we usually work with this supplier. It can later be replaced by an active agreement or a product-specific exception.',
        },
      },
      fields: commercialTermsFields({ allowInherit: false, supplierModeLabel: true }),
    },
    {
      name: 'agreements',
      type: 'join',
      collection: 'supplier-agreements',
      on: 'supplier',
      label: { es: 'Revisiones contractuales', en: 'Agreement revisions' },
      admin: {
        allowCreate: true,
        defaultColumns: ['reference', 'product', 'variant', 'revision', 'status'],
        description: {
          es: 'Historial versionado de contratos. Creá una revisión cuando las condiciones necesiten aprobación, vigencia o trazabilidad formal.',
          en: 'Versioned contract history. Create a revision when terms need approval, effective dates, or formal traceability.',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { es: 'Notas internas', en: 'Internal notes' },
      admin: {
        description: {
          es: 'Información operativa privada para compras y finanzas. No se muestra en la tienda.',
          en: 'Private operational information for purchasing and finance. It is not shown in the storefront.',
        },
      },
    },
  ],
}
