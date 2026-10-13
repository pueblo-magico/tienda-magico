'use client'

import { Button, useAuth, useConfig, useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useState } from 'react'

const copy = {
  es: {
    action: 'Consultar estado en Mercado Pago',
    working: 'Consultando…',
    success: 'Estado actualizado. Recargá para ver el resultado conciliado.',
    hidden: 'La conciliación estará disponible después de enviar el pago.',
    error: 'No se pudo confirmar el estado. No reenvíes el pago; revisá la conciliación.',
  },
  en: {
    action: 'Check status in Mercado Pago',
    working: 'Checking…',
    success: 'Status updated. Reload to view the reconciled result.',
    hidden: 'Reconciliation becomes available after the payout is submitted.',
    error: 'The status could not be confirmed. Do not resubmit; review reconciliation.',
  },
}

export default function ReconcileSupplierPayout() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (!['submitted', 'processing', 'reconciliation_required'].includes(String(data?.status)))
    return null

  const reconcile = async () => {
    if (busy || done) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/supplier-payouts/${encodeURIComponent(String(id))}/reconcile`,
        { method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(15_000) },
      )
      if (!response.ok) throw new Error()
      setDone(true)
      setMessage(text.success)
    } catch {
      setMessage(text.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Button type="button" disabled={busy || done} onClick={() => void reconcile()}>
        {busy ? text.working : text.action}
      </Button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
