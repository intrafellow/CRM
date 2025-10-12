import { useMemo, useState } from 'react'
import LiquidCard from '../components/LiquidCard'
import ChartCard from '../components/ChartCard'
import DealsModal from '../components/DealsModal'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { KEYS, pickFirst, loadRows, STORE } from '../utils/dataset'

type DealRow = Record<string, unknown> & { id?: string }
type ContactRow = Record<string, unknown> & { id?: string }
type ModalState = { open: false } | { open: true; title: string; rows: DealRow[] }

const PALETTE = ['#93C5FD','#A78BFA','#60A5FA','#F472B6','#34D399','#FBBF24','#F87171','#22D3EE','#A7F3D0','#FDE68A']

function countBy<T extends Record<string, unknown>>(rows: T[], getter: (r: T)=>string) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const k = getter(r) || '—'
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}

function getUniqueContacts(contacts: ContactRow[], deals: DealRow[]) {
  const set = new Set<string>()
  const push = (v: unknown) => { const s = String(v ?? '').trim(); if (s) set.add(s) }
  for (const r of contacts) {
    if ('contact' in r) push((r as any).contact)
    push(pickFirst(r, KEYS.contactPersons))
    push((r as any)['Contacted person'])
  }
  if (set.size === 0) {
    for (const r of deals) {
      push(pickFirst(r, KEYS.contactPersons))
      push((r as any)['Contacted person'])
    }
  }
  return set
}

export default function Dashboard() {
  const allDeals = loadRows<DealRow>(STORE.deals, [])
  const allContacts = loadRows<ContactRow>(STORE.contacts, [])
  const [modal, setModal] = useState<ModalState>({ open: false })

  const contactsCount = useMemo(() => getUniqueContacts(allContacts, allDeals).size, [allContacts, allDeals])
  const dealsCount = allDeals.length

  const byResponsible = useMemo(() => countBy(allDeals, r => String(pickFirst(r, KEYS.responsible) ?? '')), [allDeals])
  const bySector      = useMemo(() => countBy(allDeals, r => String(pickFirst(r, KEYS.sector) ?? '')), [allDeals])
  const byStatus      = useMemo(() => countBy(allDeals, r => String(pickFirst(r, KEYS.status) ?? '')), [allDeals])
  const byType        = useMemo(() => countBy(allDeals, r => String(pickFirst(r, KEYS.type) ?? '')), [allDeals])

  function openFiltered(title: string, predicate: (r: DealRow)=>boolean) {
    const rows = allDeals.filter(predicate)
    setModal({ open: true, title: `${title} — ${rows.length}`, rows })
  }

  const tooltipStyles = {
    wrapperStyle: { outline: 'none' },
    contentStyle: {
      background: 'rgba(8,12,20,0.82)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: '#E6EDF6',
      borderRadius: '12px',
      backdropFilter: 'blur(12px) saturate(140%)',
      WebkitBackdropFilter: 'blur(12px) saturate(140%)'
    } as React.CSSProperties,
    labelStyle: { color: '#E6EDF6', opacity: 0.9 },
    itemStyle:  { color: '#E6EDF6' }
  }

  const axisTick = { fill: '#E6EDF6', opacity: 0.85, fontSize: 12 }
  const axisLine = { stroke: 'rgba(255,255,255,0.25)' }
  const gridLine = 'rgba(255,255,255,0.15)'

  const metrics = [
    { label: 'Контакты', value: contactsCount },
    { label: 'Сделки', value: dealsCount },
    { label: 'Ответственные (разные)', value: byResponsible.filter(x => x.name && x.name !== '—').length },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <LiquidCard key={i}>
            <div className="text-sm opacity-80">{m.label}</div>
            <div className="text-3xl font-semibold mt-1">{m.value}</div>
          </LiquidCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Ответственные: количество сделок">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byResponsible}>
              <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={axisTick} axisLine={axisLine} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={axisLine} />
              <Tooltip {...tooltipStyles} cursor={false} />
              <Bar dataKey="value">
                {byResponsible.map((entry, idx) => (
                  <Cell
                    key={`r-${entry.name}`}
                    fill={PALETTE[idx % PALETTE.length]}
                    onClick={() => openFiltered(
                      `Ответственный: ${entry.name}`,
                      (r) => String(pickFirst(r, KEYS.responsible) ?? '') === entry.name
                    )}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Сектора (клик — показать сделки)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={bySector} innerRadius={55} outerRadius={80}>
                {bySector.map((entry, idx)=>(
                  <Cell
                    key={`s-${entry.name}`}
                    fill={PALETTE[idx % PALETTE.length]}
                    onClick={()=> openFiltered(
                      `Сектор: ${entry.name}`,
                      (r)=> String(pickFirst(r, KEYS.sector) ?? '') === entry.name
                    )}
                    style={{ cursor:'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip {...tooltipStyles} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Статусы (кол-во)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={axisTick} axisLine={axisLine} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={axisLine} />
              <Tooltip {...tooltipStyles} cursor={false} />
              <Bar dataKey="value">
                {byStatus.map((entry, idx)=>(
                  <Cell
                    key={`st-${entry.name}`}
                    fill={PALETTE[idx % PALETTE.length]}
                    onClick={()=> openFiltered(
                      `Статус: ${entry.name}`,
                      (r)=> String(pickFirst(r, KEYS.status) ?? '') === entry.name
                    )}
                    style={{ cursor:'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Типы (кол-во)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={byType} innerRadius={55} outerRadius={80}>
                {byType.map((entry, idx)=>(
                  <Cell
                    key={`t-${entry.name}`}
                    fill={PALETTE[idx % PALETTE.length]}
                    onClick={()=> openFiltered(
                      `Тип: ${entry.name}`,
                      (r)=> String(pickFirst(r, KEYS.type) ?? '') === entry.name
                    )}
                    style={{ cursor:'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip {...tooltipStyles} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DealsModal
        open={modal.open}
        title={modal.open ? modal.title : ''}
        rows={modal.open ? modal.rows : []}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}
