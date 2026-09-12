'use client'

import { FieldLabel, useField, useForm, useTranslation } from '@payloadcms/ui'
import type { CheckboxFieldClientComponent } from 'payload'
import { useState } from 'react'

import { CMS_VISIBILITY_ROLES, CMS_VISIBILITY_ROLE_LABELS } from '../utilities/cmsNavigation'

const CmsVisibilityRoleField: CheckboxFieldClientComponent = (props) => {
  const { i18n } = useTranslation()
  const { disabled, setValue, value } = useField<boolean>({ path: props.path })
  const { disabled: formDisabled, submit } = useForm()
  const [isSaving, setIsSaving] = useState(false)
  const isReadOnly = Boolean(
    disabled || formDisabled || isSaving || props.readOnly || props.field.admin?.readOnly,
  )
  const language = i18n.language === 'en' ? 'en' : 'es'
  const fieldLabel = typeof props.field.label === 'string' ? props.field.label : props.path

  const saveValue = async (nextValue: boolean) => {
    const previousValue = Boolean(value)
    setValue(nextValue)
    setIsSaving(true)

    try {
      await submit({
        disableFormWhileProcessing: true,
        disableSuccessStatus: true,
        overrides: { [props.path]: nextValue },
      })
    } catch {
      setValue(previousValue)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="cms-role-visibility-row">
      <FieldLabel label={props.field.label} path={props.path} required={props.field.required} />
      <div className="cms-role-visibility-columns">
        {CMS_VISIBILITY_ROLES.map((role) => {
          const isEnabled = role.enabled && !isReadOnly
          const isChecked = role.enabled ? Boolean(value) : false
          const label = CMS_VISIBILITY_ROLE_LABELS[role.key][language]

          return (
            <div className="cms-role-visibility-column" key={role.key}>
              <button
                aria-checked={isChecked}
                aria-busy={role.enabled && isSaving}
                aria-label={`${label}: ${fieldLabel}`}
                className="cms-role-visibility-switch"
                disabled={!isEnabled}
                onClick={() => void saveValue(!isChecked)}
                role="switch"
                type="button"
              >
                <span aria-hidden className="cms-role-visibility-switch__thumb" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CmsVisibilityRoleField
