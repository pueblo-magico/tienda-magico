'use client'

import { Button, useAuth, useConfig, useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useState } from 'react'

const copy = {
  es: {
    approve: 'Aprobar liquidación',
    approving: 'Aprobando…',
    success: 'Liquidación aprobada y pago preparado. Recargá para revisarlo.',
    profileRequired: 'Verificá un único perfil de pago antes de aprobar la liquidación.',
    approved: 'Esta liquidación ya fue aprobada o cerrada.',
    error: 'No se pudo aprobar. Revisá el importe y el estado antes de reintentar.',
  },
  en: {
    approve: 'Approve settlement',
    approving: 'Approving…',
    success: 'Settlement approved and payout prepared. Reload to review it.',
    profileRequired: 'Verify exactly one payment profile before approving the settlement.',
    approved: 'This settlement was already approved or closed.',
    error: 'Approval failed. Check the amount and status before retrying.',
  },
}

export default function ApproveSupplierSettlement() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [busy, setBusy] = useState(false)
  const [approved, setApproved] = useState(false)
  const [message, setMessage] = useState('')
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (data?.status !== 'draft' || approved) return <p role="status">{message || text.approved}</p>

  const approve = async () => {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/supplier-settlements/${encodeURIComponent(String(id))}/approve`,
        { method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(15_000) },
      )
      const result = (await response.json()) as { code?: string }
      if (!response.ok) {
        setMessage(result.code === 'payment_profile' ? text.profileRequired : text.error)
        return
      }
      setApproved(true)
      setMessage(text.success)
    } catch {
      setMessage(text.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Button type="button" disabled={busy} onClick={() => void approve()}>
        {busy ? text.approving : text.approve}
      </Button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
