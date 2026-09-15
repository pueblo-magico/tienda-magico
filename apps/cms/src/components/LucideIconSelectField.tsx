'use client'

import { FieldError, FieldLabel, ReactSelect, useField } from '@payloadcms/ui'
import { DynamicIcon } from 'lucide-react/dynamic.js'
import type { IconName } from 'lucide-react/dynamic.js'
import type { SelectFieldClientComponent } from 'payload'
import { components } from 'react-select'
import type { OptionProps, SingleValueProps } from 'react-select'

type IconOption = {
  label: string
  value: IconName
}

function IconOption({ children, data, ...props }: OptionProps<IconOption, false>) {
  return (
    <components.Option {...props} data={data}>
      <span style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
        <DynamicIcon aria-hidden name={data.value} size={18} />
        {children}
      </span>
    </components.Option>
  )
}

function IconSingleValue({ children, data, ...props }: SingleValueProps<IconOption, false>) {
  return (
    <components.SingleValue {...props} data={data}>
      <span style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
        <DynamicIcon aria-hidden name={data.value} size={18} />
        {children}
      </span>
    </components.SingleValue>
  )
}

const LucideIconSelectField: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const {
    customComponents: { Description } = {},
    disabled,
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<string | null>({ path })
  const options = field.options.flatMap<IconOption>((option) => {
    const value = typeof option === 'string' ? option : option.value
    return typeof value === 'string' ? [{ label: value, value: value as IconName }] : []
  })
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <div className="field-type select">
      <FieldLabel
        htmlFor={`field-${path}`}
        label={field.label}
        path={path}
        required={field.required}
      />
      <ReactSelect
        components={{ Option: IconOption, SingleValue: IconSingleValue }}
        disabled={Boolean(readOnly || disabled)}
        inputId={`field-${path}`}
        isClearable
        isSearchable
        onChange={(option) => {
          setValue(Array.isArray(option) ? null : ((option?.value as string | undefined) ?? null))
        }}
        options={options}
        value={selected ?? undefined}
      />
      <FieldError message={errorMessage} path={path} showError={showError} />
      {Description}
    </div>
  )
}

export default LucideIconSelectField
