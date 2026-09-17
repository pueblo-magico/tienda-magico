import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Window } from 'happy-dom'

let language = 'es'
mock.module('@payloadcms/ui', {
  exports: {
    PasswordField: ({ path }) =>
      React.createElement('input', {
        type: 'password',
        name: path,
        id: `field-${path}`,
        defaultValue: 'test-only-password',
        autoComplete: 'new-password',
      }),
    Button: ({
      children,
      extraButtonProps,
      buttonStyle: _buttonStyle,
      size: _size,
      icon: _icon,
      ...props
    }) => React.createElement('button', { ...props, ...extraButtonProps }, children),
    useTranslation: () => ({ i18n: { language } }),
  },
})

const { StaffCashPassword } = await import('../src/components/StaffCashPassword.tsx')

for (const locale of ['es', 'en']) {
  test(`contraseña de caja ${locale}: permite mostrar y ocultar sin guardar ni cambiar el valor`, async () => {
    language = locale
    const window = new Window()
    globalThis.window = window
    globalThis.document = window.document
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    let submitted = 0
    try {
      await act(async () =>
        root.render(
          React.createElement(
            'form',
            {
              onSubmit: (event) => {
                event.preventDefault()
                submitted++
              },
            },
            React.createElement(StaffCashPassword, {
              path: 'cashStaffPassword',
              field: { name: 'cashStaffPassword', type: 'text' },
            }),
          ),
        ),
      )
      const input = container.querySelector('input')
      const button = container.querySelector('button')
      assert.ok(button, 'Debe existir un botón para mostrar la contraseña')
      assert.equal(button.type, 'button')
      assert.equal(input.type, 'password')
      assert.equal(button.textContent, locale === 'es' ? 'Mostrar contraseña' : 'Show password')
      await act(async () => button.click())
      assert.equal(input.type, 'text')
      assert.equal(button.getAttribute('aria-pressed'), 'true')
      assert.equal(button.textContent, locale === 'es' ? 'Ocultar contraseña' : 'Hide password')
      assert.equal(input.value, 'test-only-password')
      await act(async () => button.click())
      assert.equal(input.type, 'password')
      assert.equal(button.getAttribute('aria-pressed'), 'false')
      assert.equal(input.value, 'test-only-password')
      assert.equal(submitted, 0)
      await act(async () => button.click())
      await act(async () =>
        button.dispatchEvent(
          new window.FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
        ),
      )
      assert.equal(input.type, 'password', 'Oculta la contraseña al salir del campo')
    } finally {
      await act(async () => root.unmount())
      window.happyDOM.abort()
      delete globalThis.window
      delete globalThis.document
      delete globalThis.IS_REACT_ACT_ENVIRONMENT
    }
  })
}
