'use client'

import { FieldError, TextInput, useField } from '@payloadcms/ui'
import { useCallback, useState, type ChangeEvent, type ComponentProps } from 'react'
import type { NumberFieldClientComponent, Validate } from 'payload'

import { formatScaledNumberInput, parseScaledNumberInput } from '../utilities/scaledNumberInput'

type Props = ComponentProps<NumberFieldClientComponent> & {
  scale: number
  suffix?: string
}

export function ScaledNumberInputField({
  field,
  path: pathFromProps,
  readOnly,
  scale,
  suffix,
  validate,
}: Props) {
  const { max = Infinity, min = -Infinity, required } = field
  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (!validate) return true
      const validationOptions = {
        ...options,
        ...field,
        max,
        min,
        required,
      } as Parameters<NonNullable<typeof validate>>[1]
      return validate(value, validationOptions)
    },
    [field, max, min, required, validate],
  )
  const {
    customComponents: { Description } = {},
    disabled,
    errorMessage,
    path,
    setValue,
    showError,
    value: fieldValue,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })
  const value = typeof fieldValue === 'number' ? fieldValue : null
  const [isEditing, setIsEditing] = useState(false)
  const [editingValue, setEditingValue] = useState('')
  const displayValue = isEditing ? editingValue : formatScaledNumberInput(value, { scale, suffix })

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
