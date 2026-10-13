'use client'

import {
  Button,
  ConfirmationModal,
  TextInput,
  useAuth,
  useConfig,
  useDocumentInfo,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useMemo, useState } from 'react'

const modalSlug = 'record-manual-supplier-payout'

const copy = {
  es: {
    title: 'Registrar pago manual',
    description:
      'Registrá un pago realizado fuera de Mercado Pago y conciliá el importe con esta liquidación.',
    warning:
      'Esta acción registra y concilia un pago que ya ocurrió. No realiza una transferencia de dinero.',
    amount: 'Importe que se conciliará',
    date: 'Fecha de pago',
    dateDescription: 'Usá la fecha que figura en el comprobante o movimiento bancario.',
    reference: 'Referencia externa',
    referencePlaceholder: 'Ej.: transferencia 004582 o comprobante TRX-9182',
    referenceDescription: 'Usala para identificar el movimiento en el banco o medio de pago.',
    review: 'Revisar pago',
    confirmTitle: 'Confirmar pago manual',
    confirmBody: 'Revisá los datos antes de conciliar este pago.',
    confirm: 'Confirmar pago',
    confirming: 'Registrando y conciliando…',
    edit: 'Volver y editar',
    success: 'El pago manual quedó registrado y la liquidación está completamente pagada.',
    unavailableState: 'Este pago ya fue enviado, conciliado o requiere otra acción.',
    errors: {
      confirmation_required: 'Completá la referencia y la fecha antes de continuar.',
      payout: 'El pago cambió de estado. Recargá el documento antes de continuar.',
      settlement: 'La liquidación ya no está aprobada para este pago.',
      profile: 'El destino verificado ya no coincide con el proveedor.',
      currency: 'La moneda no es compatible con el pago manual.',
      amount: 'El importe ya no coincide con el saldo pendiente.',
      reference: 'Ingresá una referencia externa válida.',
      duplicate_reference: 'Ya existe un pago con esta referencia. Revisalo antes de continuar.',
      paid_at: 'Ingresá una fecha de pago válida que no sea futura.',
      forbidden: 'Solo un administrador puede registrar el pago manual.',
      origin: 'Origen no autorizado.',
      unavailable:
        'No pudimos confirmar el resultado. No vuelvas a registrar el movimiento hasta revisar el estado.',
    },
  },
  en: {
    title: 'Record manual payment',
    description:
      'Record a payment made outside Mercado Pago and reconcile it with this settlement.',
    warning:
      'This action records and reconciles a payment that already occurred. It does not transfer money.',
    amount: 'Amount to reconcile',
    date: 'Payment date',
    dateDescription: 'Use the date shown on the receipt or bank transaction.',
    reference: 'External reference',
    referencePlaceholder: 'E.g. transfer 004582 or receipt TRX-9182',
    referenceDescription: 'Use it to identify the transaction at the bank or payment provider.',
    review: 'Review payment',
    confirmTitle: 'Confirm manual payment',
    confirmBody: 'Review the details before reconciling this payment.',
    confirm: 'Confirm payment',
    confirming: 'Recording and reconciling…',
    edit: 'Back and edit',
    success: 'The manual payment was recorded and the settlement is fully paid.',
    unavailableState: 'This payout was already submitted, reconciled, or requires another action.',
    errors: {
      confirmation_required: 'Complete the reference and date before continuing.',
      payout: 'The payout status changed. Reload the document before continuing.',
      settlement: 'The settlement is no longer approved for this payment.',
      profile: 'The verified destination no longer matches the supplier.',
      currency: 'The currency is not compatible with manual payment.',
      amount: 'The amount no longer matches the outstanding balance.',
      reference: 'Enter a valid external reference.',
      duplicate_reference:
        'A payment with this reference already exists. Review it before continuing.',
      paid_at: 'Enter a valid payment date that is not in the future.',
      forbidden: 'Only an administrator can record the manual payment.',
      origin: 'Unauthorized origin.',
      unavailable:
        'We could not confirm the result. Do not record the transaction again until its status is reviewed.',
    },
  },
}

export default function RecordManualSupplierPayout() {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()
  const { i18n } = useTranslation()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  if (!id || !Array.isArray(user?.roles) || !user.roles.includes('admin')) return null
  if (data?.status !== 'awaiting_approval') return <p role="status">{text.unavailableState}</p>
  return (
    <ManualPayoutForm
      key={String(id)}
      id={id}
      amountMinor={Number(data?.amountMinor)}
      currency={String(data?.currency ?? 'ARS')}
    />
  )
}

function ManualPayoutForm({
  id,
  amountMinor,
  currency,
}: {
  id: string | number
  amountMinor: number
  currency: string
}) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const { openModal } = useModal()
  const text = copy[i18n.language === 'en' ? 'en' : 'es']
  const [reference, setReference] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [recorded, setRecorded] = useState(false)
  const [message, setMessage] = useState('')
  const amount = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'es-AR', {
        style: 'currency',
        currency,
      }).format(Number.isSafeInteger(amountMinor) ? amountMinor / 100 : 0),
    [amountMinor, currency, i18n.language],
  )
  const canReview =
    !recorded && reference.trim().length >= 3 && reference.trim().length <= 120 && paidAt !== ''

  const record = async () => {
    setMessage('')
    try {
      const response = await fetch(
        `${config.routes.api}/supplier-payouts/${encodeURIComponent(String(id))}/record-manual`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acknowledged: true,
            reference: reference.trim(),
            paidAt: new Date(`${paidAt}T00:00:00`).toISOString(),
          }),
          signal: AbortSignal.timeout(15_000),
        },
      )
      const result: unknown = await response.json()
      if (
        response.ok &&
        result &&
        typeof result === 'object' &&
        'reconciled' in result &&
        result.reconciled === true
      ) {
        setRecorded(true)
        setMessage(text.success)
        return
      }
      const code =
        result && typeof result === 'object' && 'code' in result
          ? String(result.code)
          : 'unavailable'
      setMessage(text.errors[code as keyof typeof text.errors] ?? text.errors.unavailable)
    } catch {
      setMessage(text.errors.unavailable)
    }
  }

  return (
    <fieldset disabled={recorded}>
      <legend>{text.title}</legend>
      <p>{text.description}</p>
      <p>
        <strong>{text.warning}</strong>
      </p>
      <dl>
        <dt>{text.amount}</dt>
        <dd>{amount}</dd>
      </dl>
      <TextInput
        hasMany={false}
        path="manual-payout-date"
        label={text.date}
        description={text.dateDescription}
        placeholder="AAAA-MM-DD"
        value={paidAt}
        onChange={(event) => setPaidAt(event.target.value)}
        readOnly={recorded}
        required
      />
      <TextInput
        hasMany={false}
        path="manual-payout-reference"
        label={text.reference}
        description={text.referenceDescription}
        placeholder={text.referencePlaceholder}
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        readOnly={recorded}
        required
      />
      <Button type="button" disabled={!canReview} onClick={() => openModal(modalSlug)}>
        {text.review}
      </Button>
      <ConfirmationModal
        modalSlug={modalSlug}
        heading={text.confirmTitle}
        body={
          <div>
            <p>{text.confirmBody}</p>
            <dl>
              <dt>{text.amount}</dt>
              <dd>{amount}</dd>
              <dt>{text.date}</dt>
              <dd>{paidAt}</dd>
              <dt>{text.reference}</dt>
              <dd>{reference.trim()}</dd>
            </dl>
            <p>
              <strong>{text.warning}</strong>
            </p>
          </div>
        }
        cancelLabel={text.edit}
        confirmLabel={`${text.confirm}: ${amount}`}
        confirmingLabel={text.confirming}
        onConfirm={record}
      />
      <p role="status" aria-live="polite">
        {message}
      </p>
    </fieldset>
  )
}
