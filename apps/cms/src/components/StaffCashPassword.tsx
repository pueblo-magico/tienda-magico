'use client'

import { Button, PasswordField, useTranslation } from '@payloadcms/ui'
import { Eye, EyeOff } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { TextFieldClientComponent } from 'payload'

export const StaffCashPassword: TextFieldClientComponent = (props) => {
  const { i18n } = useTranslation()
  const [visible, setVisible] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const label =
    i18n.language === 'en'
      ? visible
        ? 'Hide password'
        : 'Show password'
      : visible
        ? 'Ocultar contraseña'
        : 'Mostrar contraseña'

  useLayoutEffect(() => {
    const input = container.current?.querySelector('input')
    if (input) input.type = visible ? 'text' : 'password'
  }, [visible, props.path])

  return (
    <div
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false)
      }}
    >
      <PasswordField {...props} autoComplete="new-password" />
      <Button
        type="button"
        buttonStyle="secondary"
        size="small"
        disabled={props.readOnly || props.field.admin?.disabled}
        extraButtonProps={{
          'aria-pressed': visible,
          'aria-controls': `field-${props.path.replace(/\./g, '__')}`,
        }}
        icon={visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        onClick={() => setVisible((current) => !current)}
      >
        {label}
      </Button>
    </div>
  )
}
