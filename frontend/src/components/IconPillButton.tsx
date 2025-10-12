import { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

type Variant = 'ghost' | 'primary' | 'danger' | 'muted'

export default function IconPillButton({
  className, variant = 'ghost', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'inline-flex items-center justify-center rounded-full border transition px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed'
  const palette: Record<Variant, string> = {
    ghost:   'bg-white/10 border-white/25 hover:bg-white/14',
    primary: 'bg-white/20 border-white/40 hover:bg-white/25',
    danger:  'bg-red-400/15 border-red-300/30 hover:bg-red-400/25',
    muted:   'bg-white/8 border-white/20 hover:bg-white/12',
  }
  return <button {...props} className={cn(base, palette[variant], className)} />
}
