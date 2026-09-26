'use client'

import { FieldError, TextInput, useField } from '@payloadcms/ui'
import { useState, type ChangeEvent, type ComponentProps } from 'react'
import type { NumberFieldClientComponent } from 'payload'

import { formatScaledNumberInput, parseScaledNumberInput } from '../utilities/scaledNumberInput'

type Props = ComponentProps<NumberFieldClientComponent> & {
  scale: number
  suffix?: string
}

export function ScaledNumberInputField({ field, path, readOnly, scale, suffix }: Props) {
  const {
    customComponents: { Description } = {},
    disabled,
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<number | null>({ path })
  const [isEditing, setIsEditing] = useState(false)
  const [editingValue, setEditingValue] = useState('')
  const displayValue = isEditing
    ? editingValue
    : formatScaledNumberInput(value, { scale, suffix })

  return (
    <div
      onBlurCapture={() => {
        setIsEditing(false)
      }}
      onFocusCapture={() => {
        setEditingValue(formatScaledNumberInput(value, { scale }))
        setIsEditing(true)
      }}
    >
      <TextInput
        Description={Description}
        Error={<FieldError message={errorMessage} path={path} showError={showError} />}
        label={field.label}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const nextDisplay = event.currentTarget.value
          const nextValue = parseScaledNumberInput(nextDisplay, scale)
          if (nextValue === undefined) return
          setEditingValue(nextDisplay)
          setValue(nextValue)
        }}
        path={path}
        readOnly={Boolean(readOnly || disabled)}
        required={field.required}
        showError={showError}
        value={displayValue}
      />
    </div>
  )
}
