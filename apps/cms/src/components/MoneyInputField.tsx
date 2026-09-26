'use client'

import type { NumberFieldClientComponent } from 'payload'

import { ScaledNumberInputField } from './ScaledNumberInputField'

const MoneyInputField: NumberFieldClientComponent = (props) => (
  <ScaledNumberInputField {...props} scale={100} />
)

export default MoneyInputField
