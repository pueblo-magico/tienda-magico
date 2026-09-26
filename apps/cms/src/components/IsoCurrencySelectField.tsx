'use client'

import type { TextFieldClientComponent } from 'payload'

import { getIsoCurrencyCodes } from '../utilities/isoOptions'
import { IsoCodeSelectField } from './IsoCodeSelectField'

const IsoCurrencySelectField: TextFieldClientComponent = (props) => (
  <IsoCodeSelectField {...props} codes={getIsoCurrencyCodes()} displayType="currency" />
)

export default IsoCurrencySelectField
