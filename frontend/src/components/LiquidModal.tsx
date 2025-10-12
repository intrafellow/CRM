import { useEffect } from 'react'

export default function LiquidModal({
  open, title, onClose, children, maxWidth = 'max-w-5xl'
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`glass w-full ${maxWidth} rounded-3xl shadow-2xl border border-white/25`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="text-lg font-semibold">{title}</div>
            <button onClick={onClose} className="px-3 py-1 rounded-xl hover:bg-white/10">✕</button>
          </div>
          <div className="p-4 overflow-auto max-h-[70vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
