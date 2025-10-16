import { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string; as?: keyof JSX.IntrinsicElements }
export default function LiquidCard({ children, className = '', as: Tag = 'div' }: Props) {
  // why: унифицируем контраст контейнера
  return (
    <Tag className={`glass p-5 rounded-2xl text-slate-900 ${className}`}>
      {children}
    </Tag>
  )
}
