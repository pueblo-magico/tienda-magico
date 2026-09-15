import { ValidationError } from 'payload'
import type { GlobalBeforeValidateHook } from 'payload'

type TransferSettingsData = {
  transferEnabled?: unknown
  transfer?: {
    accountHolder?: unknown
    alias?: unknown
    cvu?: unknown
  } | null
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export const validateTransferSettings: GlobalBeforeValidateHook = ({ data, req }) => {
  const settings = (data ?? {}) as TransferSettingsData
  if (settings.transferEnabled !== true) return data

  const errors: Array<{ path: string; message: string }> = []
  const isEnglish = req.locale === 'en'

  if (!hasText(settings.transfer?.accountHolder)) {
    errors.push({
      path: 'transfer.accountHolder',
      message: isEnglish
        ? 'Enter the account holder before enabling bank transfer.'
        : 'Ingresá el titular de la cuenta antes de habilitar la transferencia.',
    })
  }

  if (!hasText(settings.transfer?.alias) && !hasText(settings.transfer?.cvu)) {
    errors.push({
      path: 'transfer.alias',
      message: isEnglish
        ? 'Enter an alias or CVU before enabling bank transfer.'
        : 'Ingresá un alias o CVU antes de habilitar la transferencia.',
    })
  }

  if (errors.length > 0) throw new ValidationError({ errors })
  return data
}
