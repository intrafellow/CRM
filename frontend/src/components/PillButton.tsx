import React from 'react'
type Variant = 'primary' | 'ghost'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  subtle?: boolean
}
export default function PillButton({ variant='primary', subtle=false, className='', ...rest }: Props) {
  const base = 'pill px-4 py-2'
  const kind = variant === 'primary' ? 'btn' : `btn ghost${subtle ? ' subtle' : ''}`
  return <button {...rest} className={`${base} ${kind} ${className}`} />
}
