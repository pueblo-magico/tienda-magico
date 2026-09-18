'use client'

import { TextInput } from '@payloadcms/ui'
import { useEffect, useRef, type ComponentProps } from 'react'
import { formatArsInputElement } from '../utilities/arsInput'

type Props = Omit<ComponentProps<typeof TextInput>, 'hasMany' | 'onChange'> & {
  onValueChange: (value: string) => void
}

export function ArsAmountInput({ onValueChange, ...props }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const input = containerRef.current?.querySelector('input')
    if (input) input.inputMode = 'numeric'
  }, [])
  return (
    <div ref={containerRef}>
      <TextInput
        {...props}
        hasMany={false}
        onChange={(event) => {
          const native = event.nativeEvent as InputEvent
          if (!native.isComposing)
            formatArsInputElement(event.currentTarget, native.inputType ?? '', props.value ?? '')
          onValueChange(event.currentTarget.value)
        }}
      />
    </div>
  )
}
