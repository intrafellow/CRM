import { useMemo, useState, useEffect } from 'react'
import LiquidCard from '../components/LiquidCard'
import ChartCard from '../components/ChartCard'
import DealsModal from '../components/DealsModal'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { KEYS, pickFirst } from '../utils/dataset'
import * as API from '../api'

type DealRow = Record<string, unknown> & { id?: string; ownerId?: string }
type ContactRow = Record<string, unknown> & { id?: string; contact?: string }
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
  const [allDeals, setAllDeals] = useState<DealRow[]>([])
  const [allContacts, setAllContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({ open: false })

  // Загрузка данных из API
  const loadData = async () => {
    try {
      setLoading(true)
      const [contacts, deals] = await Promise.all([
        API.getContacts(),
        API.getDeals()
      ])
      
      // Преобразование контактов
      const contactRows: ContactRow[] = contacts.map(c => ({
        id: c.id,
        contact: c.contact,
        ownerId: c.owner_id
      }))
      
      // Преобразование сделок (добавляем все поля из data)
      const dealRows: DealRow[] = deals.map(d => ({
        id: d.id,
        ownerId: d.owner_id,
        ...d.data
      }))
      
      setAllContacts(contactRows)
      setAllDeals(dealRows)
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])

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

  // Callback функции для DealsModal
  const handleUpdateDeal = async (id: string, dealData: DealRow) => {
    const { id: _, ownerId, ...data } = dealData
    await API.updateDeal(id, { data })
    await loadData()
    setModal({ open: false })
  }

  const handleDeleteDeal = async (id: string) => {
    await API.deleteDeal(id)
    await loadData()
    setModal({ open: false })
  }

  const handleAddDeal = async (dealData: DealRow) => {
    const { id, ownerId, ...data } = dealData
    await API.createDeal({ data })
    await loadData()
    setModal({ open: false })
  }

  const tooltipStyles = {
    wrapperStyle: { outline: 'none' },
    contentStyle: {
      background: 'rgba(100,116,139,0.85)',
      border: '1px solid rgba(0,0,0,0.25)',
      color: '#ffffff',
      borderRadius: '12px',
      backdropFilter: 'blur(18px) saturate(160%)',
      WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      boxShadow: '0 10px 30px rgba(0,0,0,.2), inset 0 0 0.5px rgba(255,255,255,.4)'
    } as React.CSSProperties,
    labelStyle: { color: '#ffffff', opacity: 0.95 },
    itemStyle:  { color: '#ffffff' }
  }

  const axisTick = { fill: '#1f2937', opacity: 0.9, fontSize: 12 }
  const axisLine = { stroke: 'rgba(0,0,0,0.25)' }
  const gridLine = 'rgba(0,0,0,0.1)'

  const metrics = [
    { label: 'Контакты', value: contactsCount },
    { label: 'Сделки', value: dealsCount },
    { label: 'Ответственные (разные)', value: byResponsible.filter(x => x.name && x.name !== '—').length },
  ]

  if (loading) {
    return (
      <div className="p-4">
        <LiquidCard>Загрузка данных...</LiquidCard>
      </div>
    )
  }

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
        onUpdate={handleUpdateDeal}
        onDelete={handleDeleteDeal}
        onAdd={handleAddDeal}
      />
    </div>
  )
}
