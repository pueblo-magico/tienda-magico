'use client'

import { FieldError, FieldLabel, ReactSelect, useField, useTranslation } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'

type CodeOption = { label: string; value: string }

type Props = ComponentProps<TextFieldClientComponent> & {
  codes: readonly string[]
  displayType: 'currency' | 'region'
}

export function IsoCodeSelectField({ codes, displayType, field, path, readOnly }: Props) {
  const { i18n } = useTranslation()
  const {
    customComponents: { Description } = {},
    disabled,
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<string | null>({ path })
  const locale = i18n.language === 'en' ? 'en' : 'es-AR'
  const names = new Intl.DisplayNames([locale], { type: displayType })
  const options = codes.map<CodeOption>((code) => ({
    label: `${names.of(code) ?? code} (${code})`,
    value: code,
  }))
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
        disabled={Boolean(readOnly || disabled)}
        inputId={`field-${path}`}
        isClearable={!field.required}
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
