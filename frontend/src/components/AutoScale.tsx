import React, { useLayoutEffect, useRef, useState } from 'react'

/**
 * Обёртка, которая масштабирует дочерний блок так, чтобы он полностью помещался по ширине контейнера.
 * Работает через CSS transform: scale, origin — left top. Масштаб пересчитывается при ресайзе окна.
 */
export default function AutoScale({ children, deps = [] as unknown[], onScale, minScale = 0.35, lock = false }: { children: React.ReactNode; deps?: unknown[]; onScale?: (k:number)=>void; minScale?: number; lock?: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    if (lock) return; // не пересчитываем масштаб, когда заблокировано (например, во время редактирования)
    const calc = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const target = wrap.querySelector('table') as HTMLElement | null
      if (!target) return
      const available = wrap.clientWidth || wrap.getBoundingClientRect().width
      const needed = target.scrollWidth
      if (!available || !needed) { setScale(1); return }
      // Чуть ограничим минимальный масштаб, чтобы колонки оставались читаемыми
      const raw = available / needed
      const k = Math.min(1, Math.max(minScale, raw - 0.02)) // не меньше minScale, слегка меньше raw, чтобы не появлялся горизонтальный скролл
      setScale(k)
      onScale?.(k)
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(document.documentElement)
    const id = window.setInterval(calc, 300) // на случай динамики колонок
    return () => { ro.disconnect(); window.clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock, ...deps])

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <div style={{ transform:`scale(${scale})`, transformOrigin:'left top', width: scale<1 ? `${100/scale}%` : '100%' }}>
        {children}
      </div>
    </div>
  )
}


