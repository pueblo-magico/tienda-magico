import React from 'react'
import './styles.css'

export default function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <h1>Pueblo Mágico CMS</h1>
        <p>
          Payload Ecommerce backend for the storefront. Manage products, categories,
          media, and carts here.
        </p>
        <div className="links">
          <a className="admin" href="/admin">
            Open admin
          </a>
          <a className="docs" href="/api" rel="noreferrer">
            REST API
          </a>
        </div>
      </div>
    </div>
  )
}
