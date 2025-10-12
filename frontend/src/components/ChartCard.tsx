import React from 'react'

export default function ChartCard({ title, children }:{
  title: string; children: React.ReactNode
}) {
  return (
    <div className="glass chart-card rounded-3xl p-4">
      <div className="text-sm opacity-80 mb-2">{title}</div>
      <div className="h-64">{children}</div>
    </div>
  )
}
