'use client'

import { useTranslation } from '@payloadcms/ui'

import { CMS_VISIBILITY_ROLES, CMS_VISIBILITY_ROLE_LABELS } from '../utilities/cmsNavigation'

export default function CmsVisibilityRoleHeader() {
  const { i18n } = useTranslation()
  const language = i18n.language === 'en' ? 'en' : 'es'

  return (
    <div className="cms-role-visibility-header" aria-hidden>
      <span />
      <div className="cms-role-visibility-columns">
        {CMS_VISIBILITY_ROLES.map((role) => (
          <span className="cms-role-visibility-column__label" key={role.key}>
            {CMS_VISIBILITY_ROLE_LABELS[role.key][language]}
          </span>
        ))}
      </div>
    </div>
  )
}
