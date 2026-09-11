'use client'

import { TextInput, useDocumentInfo, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import type { ChangeEvent } from 'react'

const StableSKUField: TextFieldClientComponent = ({ path, field }) => {
  const { id } = useDocumentInfo()
  const { setValue, value } = useField<string>({ path })
  const hasSavedSKU = Boolean(id && typeof value === 'string' && value.trim())
  const onChange = (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)

  return (
    <TextInput
      path={path}
      label={field.label}
      required={field.required}
      description={field.admin?.description}
      value={typeof value === 'string' ? value : ''}
      readOnly={hasSavedSKU}
      onChange={onChange}
    />
  )
}

export default StableSKUField
