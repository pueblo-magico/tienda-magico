'use client'

import type { NumberFieldClientComponent } from 'payload'

import { ScaledNumberInputField } from './ScaledNumberInputField'

const PercentageInputField: NumberFieldClientComponent = (props) => (
  <ScaledNumberInputField {...props} scale={100} suffix="%" />
)

export default PercentageInputField
