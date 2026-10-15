'use client'

import {
  Button,
  CheckboxInput,
  useAuth,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import { useState } from 'react'

const copy = {
  es: {
    title: 'Confirmar y enviar pago al proveedor',
    warning:
      'Esta acción envía el importe guardado al destino verificado. Un estado enviado no significa que el dinero esté acreditado.',
    acknowledged: 'Revisé proveedor, liquidación, importe, moneda y destino, y autorizo el envío.',
    submit: 'Confirmar y enviar',
    saving: 'Enviando…',
    success: 'El pago fue aceptado para procesamiento. Recargá para consultar su estado.',
    alreadySubmitted: 'Este pago ya fue confirmado o requiere conciliación.',
    errors: {
      confirmation_required: 'Confirmá la revisión antes de continuar.',
      settlement: 'La liquidación no está aprobada o el pago ya cambió de estado.',
      profile: 'El destino no está verificado o no pertenece al proveedor.',
      currency: 'La moneda del pago no coincide con la liquidación y el destino.',
      amount: 'El importe no es válido o supera el saldo pendiente.',
      configuration: 'Mercado Pago Payouts de prueba no está configurado.',
      reconciliation_required:
        'El resultado no es concluyente. No vuelvas a enviar: conciliá primero con Mercado Pago.',
      forbidden: 'Solo un administrador puede confirmar el pago.',
      origin: 'Origen no autorizado.',
      unavailable: 'No se pudo confirmar. Revisá el estado antes de intentar otra acción.',
    },
  },
  en: {
    title: 'Confirm and submit supplier payout',
    warning:
      'This action submits the saved amount to the verified destination. Submitted does not mean the money was credited.',
    acknowledged:
      'I reviewed the supplier, settlement, amount, currency, and destination and authorize submission.',
    submit: 'Confirm and submit',
    saving: 'Submitting…',
    success: 'The payout was accepted for processing. Reload to inspect its status.',
    alreadySubmitted: 'This payout was already confirmed or requires reconciliation.',
    errors: {
      confirmation_required: 'Confirm the review before continuing.',
      settlement: 'The settlement is not approved or the payout already changed state.',
      profile: 'The destination is not verified or does not belong to the supplier.',
      currency: 'The payout currency does not match the settlement and destination.',
      amount: 'The amount is invalid or exceeds the outstanding balance.',
      configuration: 'Mercado Pago test Payouts is not configured.',
      reconciliation_required:
        'The result is uncertain. Do not submit again; reconcile with Mercado Pago first.',
      forbidden: 'Only an administrator can confirm the payout.',
      origin: 'Unauthorized origin.',
      unavailable: 'Confirmation failed. Check the status before taking another action.',
    },
  },
}

export default function ConfirmSupplierPayout() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (data?.status !== 'awaiting_approval') return <p role="status">{text.alreadySubmitted}</p>
  return <ConfirmationForm key={String(id)} id={id} />
}

function ConfirmationForm({ id }: { id: string | number }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')

  const confirm = async () => {
    if (busy || submitted || !acknowledged) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/supplier-payouts/${encodeURIComponent(String(id))}/confirm`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acknowledged: true }),
          signal: AbortSignal.timeout(15_000),
        },
      )
      const result: unknown = await response.json()
      if (
        response.ok &&
        result &&
        typeof result === 'object' &&
        'submitted' in result &&
        result.submitted === true
      ) {
        setSubmitted(true)
        setMessage(text.success)
      } else {
        const code =
          result && typeof result === 'object' && 'code' in result
            ? String(result.code)
            : 'unavailable'
        setMessage(text.errors[code as keyof typeof text.errors] ?? text.errors.unavailable)
      }
    } catch {
      setMessage(text.errors.unavailable)
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset disabled={busy || submitted}>
      <legend>{text.title}</legend>
      <p>{text.warning}</p>
      <CheckboxInput
        id="supplier-payout-confirmation"
        label={text.acknowledged}
        checked={acknowledged}
        onToggle={(event) => setAcknowledged(event.target.checked)}
        readOnly={busy || submitted}
      />
      <Button
        type="button"
        buttonStyle="primary"
        disabled={busy || submitted || !acknowledged}
        onClick={() => void confirm()}
      >
        {busy ? text.saving : text.submit}
      </Button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </fieldset>
  )
}
