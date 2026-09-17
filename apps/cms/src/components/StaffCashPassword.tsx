'use client'

import { PasswordField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const StaffCashPassword: TextFieldClientComponent = (props) => (
  <PasswordField {...props} autoComplete="new-password" />
)
