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
    title: 'Verificar transferencia recibida',
    reference: 'ID de la operación bancaria (no DNI ni referencia del pedido)',
    amount: 'Importe recibido en centavos ARS (ej.: $ 1.000 = 100000)',
    received: 'Verifiqué la recepción del importe exacto en la cuenta del comercio.',
    late: 'Si venció el plazo, autorizo la confirmación tardía, sujeta a stock.',
    submit: 'Confirmar transferencia',
    saving: 'Verificando…',
    success: 'Transferencia confirmada. Recargá el documento para ver el estado y la auditoría.',
    persisted:
      'Esta acción confirma el pedido guardado, no los cambios sin guardar. No marca la compra como entregada.',
    approved: 'Esta transferencia ya fue confirmada. La auditoría se conserva debajo.',
    errors: {
      invalid: 'Revisá la referencia, el importe y la aceptación.',
      catalog:
        'El catálogo cambió o tiene un borrador pendiente. No se confirmó el pedido. Revisá los productos y sus borradores sin modificar el historial del pedido.',
      amount: 'El importe debe coincidir exactamente con el pedido en ARS.',
      state: 'El estado actual no permite confirmar este pago.',
      late: 'El plazo venció. Aceptá explícitamente la confirmación tardía.',
      stock:
        'Stock insuficiente o artículo no disponible. No se confirmó el pedido; revisá reposición o devolución del dinero.',
      duplicate:
        'La operación bancaria o el carrito ya tienen un pago confirmado. Revisá antes de continuar.',
      localSale: 'La venta local vinculada requiere revisión.',
      forbidden: 'Solo un administrador puede confirmar pagos.',
      origin: 'Origen no autorizado. Revisá la URL pública del CMS.',
      unavailable: 'No se pudo confirmar. Consultá el estado antes de reintentar.',
    },
  },
  en: {
    title: 'Verify received transfer',
    reference: 'Bank transaction ID (not national ID or order reference)',
    amount: 'Received amount in ARS minor units (e.g. $1,000 = 100000)',
    received: 'I verified receipt of the exact amount in the merchant account.',
    late: 'If expired, I authorize late confirmation, subject to available stock.',
    submit: 'Confirm transfer',
    saving: 'Verifying…',
    success: 'Transfer confirmed. Reload the document to view the status and audit.',
    persisted:
      'This action confirms the saved order, not unsaved changes. It does not mark the purchase as delivered.',
    approved: 'This transfer has already been confirmed. The audit is preserved below.',
    errors: {
      invalid: 'Check the reference, amount and acknowledgement.',
      catalog:
        'The catalog changed or has a pending draft. The order was not confirmed. Review products and their drafts without changing the order history.',
      amount: 'The received amount must match the order exactly in ARS.',
      state: 'The current state does not allow payment confirmation.',
      late: 'The deadline expired. Explicitly accept late confirmation.',
      stock:
        'Insufficient stock or unavailable item. The order was not confirmed; review restocking or refunding the payment.',
      duplicate:
        'This bank transaction or cart already has a confirmed payment. Review before continuing.',
      localSale: 'The linked local sale needs review.',
      forbidden: 'Only an administrator can confirm payments.',
      origin: 'Unauthorized origin. Check the CMS public URL.',
      unavailable: 'Confirmation failed. Check the order status before retrying.',
    },
  },
}

export default function ConfirmTransfer() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (data?.paymentStatus === 'approved') return <p role="status">{text.approved}</p>
  return <TransferConfirmationForm key={String(id)} id={id} />
}

function TransferConfirmationForm({ id }: { id: string | number }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [received, setReceived] = useState(false)
  const [acceptLate, setAcceptLate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')

  const confirm = async () => {
    if (busy || confirmed) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/orders/${encodeURIComponent(String(id))}/confirm-transfer`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, amount: Number(amount), received, acceptLate }),
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
        path="transfer-confirmation-reference"
        label={text.reference}
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        readOnly={busy || confirmed}
      />
      <TextInput
        hasMany={false}
        path="transfer-confirmation-amount"
        label={text.amount}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        readOnly={busy || confirmed}
      />
      <CheckboxInput
        id="transfer-confirmation-received"
        label={text.received}
        checked={received}
        onToggle={(event) => setReceived(event.target.checked)}
        readOnly={busy || confirmed}
      />
      <CheckboxInput
        id="transfer-confirmation-late"
        label={text.late}
        checked={acceptLate}
        onToggle={(event) => setAcceptLate(event.target.checked)}
        readOnly={busy || confirmed}
      />
      <Button
        type="button"
        disabled={
          busy ||
          confirmed ||
          !received ||
          !/^[a-zA-Z0-9_-]{3,100}$/.test(reference.trim()) ||
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
