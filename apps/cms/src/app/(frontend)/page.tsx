import React from 'react'
import Link from 'next/link'
import './styles.css'

export default function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <h1>Pueblo Mágico CMS</h1>
        <p>
          Payload Ecommerce backend for the storefront. Manage products, categories, media, and
          carts here.
        </p>
        <div className="links">
          <Link className="admin" href="/admin">
            Open admin
          </Link>
          <Link className="docs" href="/api" prefetch={false}>
            REST API
          </Link>
        </div>
      </div>
    </div>
  )
}
