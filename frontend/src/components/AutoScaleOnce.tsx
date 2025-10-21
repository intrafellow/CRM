import React, { useLayoutEffect, useRef, useState } from 'react'

/**
 * Масштабирует дочерний блок ОДИН раз на маунте так, чтобы он целиком помещался по ширине вьюпорта.
 * origin — left top. Не слушает ресайзы, чтобы не было «плавающего» эффекта.
 */
export default function AutoScaleOnce({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const target = wrap.querySelector('table') as HTMLElement | null
    if (!target) return
    // немного запасов на отступы контейнеров/скроллбар
    const container = document.documentElement
    const viewport = container.clientWidth
    const available = Math.max(0, viewport - 32)
    const needed = target.scrollWidth
    if (!available || !needed) { setScale(1); return }
    // небольшой «минус» чтобы исключить появление горизонтального скролла
    const raw = available / needed
    const k = Math.min(1, Math.max(0.1, raw - 0.02))
    setScale(k)
  }, [])

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <div style={{ transform:`scale(${scale})`, transformOrigin:'left top', width: scale<1 ? `${100/scale}%` : '100%' }}>
        {children}
      </div>
    </div>
  )
}


