'use client'

import { TextField, useDocumentInfo } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

const StableSKUField: TextFieldClientComponent = (props) => {
  const { id, data } = useDocumentInfo()
  const hasSavedSKU = Boolean(id != null && typeof data?.sku === 'string' && data.sku.trim())

  return (
    <TextField
      {...props}
      readOnly={Boolean(props.readOnly || props.field.admin?.readOnly || hasSavedSKU)}
    />
  )
}

export default StableSKUField
