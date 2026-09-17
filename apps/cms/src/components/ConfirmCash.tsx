'use client'

import {
  Button,
  CheckboxInput,
  TextInput,
  useAuth,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import { useState } from 'react'

const copy = {
  es: {
    title: 'Confirmar efectivo recibido',
    amount: 'Importe recibido en centavos ARS (ej.: $ 1.000 = 100000)',
    received: 'Recibí y conté el importe exacto en efectivo.',
    note: 'Nota interna opcional',
    submit: 'Confirmar efectivo',
    saving: 'Confirmando…',
    success: 'Pago confirmado. Recargá el documento para ver el estado y la auditoría.',
    persisted:
      'Esta acción confirma el pedido guardado y descuenta stock una sola vez. No marca la compra como entregada.',
    approved: 'Este pago en efectivo ya fue confirmado.',
    errors: {
      invalid: 'Revisá el importe y la aceptación.',
      amount: 'El importe debe coincidir exactamente con el pedido en ARS.',
      state: 'El estado actual no permite confirmar este pago.',
      stock: 'Stock insuficiente o artículo no disponible.',
      catalog: 'El catálogo cambió. No se confirmó el pedido.',
      duplicate: 'Este carrito ya tiene un pago confirmado.',
      localSale: 'La venta local vinculada requiere revisión.',
      forbidden: 'Solo un administrador puede confirmar pagos.',
      origin: 'Origen no autorizado.',
      unavailable: 'No se pudo confirmar. Consultá el estado antes de reintentar.',
    },
  },
  en: {
    title: 'Confirm cash received',
    amount: 'Amount received in ARS minor units (e.g. $1,000 = 100000)',
    received: 'I received and counted the exact cash amount.',
    note: 'Optional internal note',
    submit: 'Confirm cash',
    saving: 'Confirming…',
    success: 'Payment confirmed. Reload the document to view status and audit.',
    persisted:
      'This action confirms the saved order and deducts stock exactly once. It does not mark the order as collected.',
    approved: 'This cash payment has already been confirmed.',
    errors: {
      invalid: 'Check the amount and acknowledgement.',
      amount: 'The amount must exactly match the order in ARS.',
      state: 'The current state does not allow this payment confirmation.',
      stock: 'Insufficient stock or unavailable item.',
      catalog: 'The catalog changed. The order was not confirmed.',
      duplicate: 'This cart already has a confirmed payment.',
      localSale: 'The linked local sale needs review.',
      forbidden: 'Only an administrator can confirm payments.',
      origin: 'Unauthorized origin.',
      unavailable: 'Confirmation failed. Check the order status before retrying.',
    },
  },
}

export default function ConfirmCash() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (data?.paymentStatus === 'approved') return <p role="status">{text.approved}</p>
  return <CashConfirmationForm key={String(id)} id={id} />
}

function CashConfirmationForm({ id }: { id: string | number }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [received, setReceived] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')

  const confirm = async () => {
    if (busy || confirmed) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/orders/${encodeURIComponent(String(id))}/confirm-cash`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), received, note }),
          signal: AbortSignal.timeout(15000),
        },
      )
      const result: unknown = await response.json()
      if (
        response.ok &&
        result &&
        typeof result === 'object' &&
        'confirmed' in result &&
        result.confirmed === true
      ) {
        setConfirmed(true)
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
    <fieldset disabled={busy || confirmed}>
      <legend>{text.title}</legend>
      <p>{text.persisted}</p>
      <TextInput
        hasMany={false}
        path="cash-confirmation-amount"
        label={text.amount}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        readOnly={busy || confirmed}
      />
      <TextInput
        hasMany={false}
        path="cash-confirmation-note"
        label={text.note}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        readOnly={busy || confirmed}
      />
      <CheckboxInput
        id="cash-confirmation-received"
        label={text.received}
        checked={received}
        onToggle={(event) => setReceived(event.target.checked)}
        readOnly={busy || confirmed}
      />
      <Button
        type="button"
        disabled={
          busy ||
          confirmed ||
          !received ||
          !/^\d+$/.test(amount) ||
          !Number.isSafeInteger(Number(amount)) ||
          Number(amount) <= 0
        }
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
