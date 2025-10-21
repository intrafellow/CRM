import React from 'react'

/**
 * Растягивает содержимое на всю ширину вьюпорта и сдвигает влево так,
 * чтобы начиналось от самого края окна (мимо центрального контейнера).
 */
export default function FullBleed({ children }:{ children: React.ReactNode }) {
  return (
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      {children}
    </div>
  )
}







