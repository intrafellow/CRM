import { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export default function GlassIconButton({
  className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn('icon-tile', className)}>
      {children}
    </button>
  )
}
