import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Pueblo Mágico Payload CMS backend',
  title: 'Pueblo Mágico CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
