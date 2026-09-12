'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** Payload's accessible locale popup positioned beside document actions. */
export default function DocumentLocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'es'

  function changeLocale(nextLocale: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('locale', nextLocale)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="document-locale-switcher">
      <label htmlFor="document-locale" className="document-locale-switcher__label">
        Idioma
      </label>
      <select
        id="document-locale"
        value={locale}
        onChange={(event) => changeLocale(event.target.value)}
        aria-label="Idioma del documento"
      >
        <option value="es">Español (ES)</option>
        <option value="en">English (EN)</option>
      </select>
    </div>
  )
}
