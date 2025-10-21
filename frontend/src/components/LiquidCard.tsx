import { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string; as?: keyof JSX.IntrinsicElements; title?: string; actions?: ReactNode }
export default function LiquidCard({ children, className = '', as: Tag = 'div', title, actions }: Props) {
  // why: унифицируем контраст контейнера
  return (
    <Tag className={`glass p-5 rounded-2xl text-slate-900 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center gap-2 mb-3">
          {title && <div className="text-lg font-semibold">{title}</div>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}
