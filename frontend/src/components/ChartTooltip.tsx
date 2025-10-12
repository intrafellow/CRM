import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

function parseColor(input?: string | number): {r: number; g: number; b: number; a: number} | null {
  if (!input) return null
  const s = String(input).trim()
  // #rgb / #rrggbb
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) {
    let hex = s.slice(1)
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    const n = parseInt(hex, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }
  // rgb/rgba
  const m = s.match(/^rgba?\(([^)]+)\)$/i)
  if (m) {
    const [r,g,b,a] = m[1].split(',').map(v => Number(v.trim()))
    return { r, g, b, a: Number.isFinite(a) ? a : 1 }
  }
  return null
}
function luminance({r,g,b}: {r:number; g:number; b:number}) {
  const srgb = [r,g,b].map(v => v/255).map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2] // 0..1
}

export default function ChartTooltip({
  active, payload, label
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null

  const color = payload[0]?.color as string | undefined
  const rgba = parseColor(color) ?? { r: 120, g: 180, b: 255, a: 1 }
  const lum = luminance(rgba)
  const isLightAnchor = lum > 0.65 && rgba.a > 0.3

  // choose theme by anchor color
  const styleBase: React.CSSProperties = {
    borderRadius: 16,
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.25,
    minWidth: 120,
    boxShadow: '0 8px 28px rgba(0,0,0,.35), inset 0 0 0.5px rgba(255,255,255,.25)',
    backdropFilter: 'blur(12px) saturate(170%)',
    WebkitBackdropFilter: 'blur(12px) saturate(170%)'
  }
  const themeLight: React.CSSProperties = { // on dark bg
    background: 'rgba(16,18,22,.92)',
    border: '1px solid rgba(255,255,255,.35)',
    color: '#e6edf6'
  }
  const themeDark: React.CSSProperties = { // on light bg
    background: 'rgba(246,248,252,.95)',
    border: '1px solid rgba(0,0,0,.20)',
    color: '#0b1220'
  }
  const style = { ...styleBase, ...(isLightAnchor ? themeDark : themeLight) }

  return (
    <div className="glass" style={style}>
      {label != null && (
        <div style={{ opacity: .9, marginBottom: 8, fontWeight: 600 }}>
          {String(label)}
        </div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: 999,
                background: (p.color as string) || '#7cc0ff', flex: '0 0 auto'
              }}
            />
            <span style={{ opacity: .9, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {String(p.name ?? '')}
            </span>
            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
              {String(p.value ?? '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
