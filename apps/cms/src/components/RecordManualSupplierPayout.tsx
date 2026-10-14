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
import { useState } from 'react'

import { formatScaledNumberInput, parseScaledNumberInput } from '../utilities/scaledNumberInput'

const modalSlug = 'record-manual-supplier-payout'

const copy = {
  es: {
    title: 'Registrar pago manual',
    description:
      'Registrá un pago realizado fuera de Mercado Pago y conciliá el importe con esta liquidación.',
    warning:
      'Esta acción registra y concilia un pago que ya ocurrió. No realiza una transferencia de dinero.',
    amount: 'Importe pagado',
    amountDescription: 'Podés registrar el saldo total o un pago parcial.',
    fullBalance: 'Usar saldo total',
    remaining: 'Saldo pendiente después del pago',
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
    partialSuccess: 'El pago manual quedó registrado. Se preparó otro pago por el saldo pendiente.',
    unavailableState: 'Este pago ya fue enviado, conciliado o requiere otra acción.',
    errors: {
      confirmation_required: 'Completá el importe, la referencia y la fecha antes de continuar.',
      payout: 'El pago cambió de estado. Recargá el documento antes de continuar.',
      settlement: 'La liquidación ya no está aprobada para este pago.',
      profile: 'El destino verificado ya no coincide con el proveedor.',
      currency: 'La moneda no es compatible con el pago manual.',
      amount: 'El importe debe ser de al menos ARS 1,00 y no superar el saldo pendiente.',
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
    amount: 'Amount paid',
    amountDescription: 'You can record the full balance or a partial payment.',
    fullBalance: 'Use full balance',
    remaining: 'Outstanding balance after payment',
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
    partialSuccess: 'The manual payment was recorded. Another payout was prepared for the balance.',
    unavailableState: 'This payout was already submitted, reconciled, or requires another action.',
    errors: {
      confirmation_required: 'Complete the amount, reference, and date before continuing.',
      payout: 'The payout status changed. Reload the document before continuing.',
      settlement: 'The settlement is no longer approved for this payment.',
      profile: 'The verified destination no longer matches the supplier.',
      currency: 'The currency is not compatible with manual payment.',
      amount: 'The amount must be at least ARS 1.00 and cannot exceed the outstanding balance.',
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
  const locale = i18n.language === 'en' ? 'en-US' : 'es-AR'
  const [reference, setReference] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [amountInput, setAmountInput] = useState(() =>
    formatScaledNumberInput(amountMinor, { scale: 100 }),
  )
  const [recorded, setRecorded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const selectedAmountMinor = parseScaledNumberInput(amountInput, 100)
  const formatMoney = (minor: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
  const amount =
    selectedAmountMinor == null || selectedAmountMinor === undefined
      ? '—'
      : formatMoney(selectedAmountMinor)
  const remainingMinor =
    selectedAmountMinor == null || selectedAmountMinor === undefined
      ? null
      : amountMinor - selectedAmountMinor
  const canReview =
    !recorded &&
    !busy &&
    selectedAmountMinor !== null &&
    selectedAmountMinor !== undefined &&
    selectedAmountMinor >= 100 &&
    selectedAmountMinor <= amountMinor &&
    reference.trim().length >= 3 &&
    reference.trim().length <= 120 &&
    paidAt !== ''

  const record = async () => {
    if (!canReview || selectedAmountMinor == null) return
    setBusy(true)
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
            amountMinor: selectedAmountMinor,
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
        const outstandingMinor =
          'outstandingMinor' in result && typeof result.outstandingMinor === 'number'
            ? result.outstandingMinor
            : 0
        setMessage(outstandingMinor > 0 ? text.partialSuccess : text.success)
        return
      }
      const code =
        result && typeof result === 'object' && 'code' in result
          ? String(result.code)
          : 'unavailable'
      setMessage(text.errors[code as keyof typeof text.errors] ?? text.errors.unavailable)
    } catch {
      setMessage(text.errors.unavailable)
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset disabled={recorded || busy}>
      <legend>{text.title}</legend>
      <p>{text.description}</p>
      <p>
        <strong>{text.warning}</strong>
      </p>
      <div
        onBlurCapture={() => {
          const parsed = parseScaledNumberInput(amountInput, 100)
          if (parsed !== undefined) setAmountInput(formatScaledNumberInput(parsed, { scale: 100 }))
        }}
      >
        <TextInput
          hasMany={false}
          path="manual-payout-amount"
          label={text.amount}
          description={text.amountDescription}
          value={amountInput}
          onChange={(event) => setAmountInput(event.currentTarget.value)}
          readOnly={recorded || busy}
          required
        />
      </div>
      <Button
        type="button"
        buttonStyle="secondary"
        disabled={recorded || busy || selectedAmountMinor === amountMinor}
        onClick={() => setAmountInput(formatScaledNumberInput(amountMinor, { scale: 100 }))}
      >
        {text.fullBalance}
      </Button>
      {remainingMinor !== null && remainingMinor >= 0 ? (
        <dl>
          <dt>{text.remaining}</dt>
          <dd>{formatMoney(remainingMinor)}</dd>
        </dl>
      ) : null}
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
