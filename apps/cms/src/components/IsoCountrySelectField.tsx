'use client'

import type { TextFieldClientComponent } from 'payload'

import { ISO_COUNTRY_CODES } from '../utilities/isoOptions'
import { IsoCodeSelectField } from './IsoCodeSelectField'

const IsoCountrySelectField: TextFieldClientComponent = (props) => (
  <IsoCodeSelectField {...props} codes={ISO_COUNTRY_CODES} displayType="region" />
)

export default IsoCountrySelectField
