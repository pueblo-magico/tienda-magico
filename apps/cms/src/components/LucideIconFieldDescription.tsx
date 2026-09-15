'use client'

import { useTranslation } from '@payloadcms/ui'

export default function LucideIconFieldDescription() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'

  return (
    <span>
      {isEnglish
        ? 'Optional. Used when no image is available. Names come from Lucide Icons. '
        : 'Opcional. Se usa cuando no hay imagen. Los nombres provienen de Lucide Icons. '}
      <a href="https://lucide.dev/icons/" rel="noreferrer" target="_blank">
        {isEnglish ? 'Browse available icons' : 'Ver iconos disponibles'}
      </a>
    </span>
  )
}
