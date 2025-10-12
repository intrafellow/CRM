import React from 'react'
import type { ChangeEvent } from 'react'
import { importFromCSV, exportToCSV } from '../utils/csv'
import { importFromXLSX, exportToXLSX } from '../utils/xlsx'

type AnyRow = Record<string, unknown>

export default function UploadExport<T extends AnyRow>({
  rows,
  onImport,
  filename,
}: {
  rows: T[]
  onImport: (rows: T[]) => void
  filename: string
}) {
  const [meta, setMeta] = React.useState<{ count: number; file?: string }>({ count: rows.length })

  React.useEffect(() => {
    setMeta((m) => ({ ...m, count: rows.length }))
  }, [rows])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.toLowerCase()
    try {
      let parsed: T[] = []
      if (name.endsWith('.csv')) {
        parsed = (await importFromCSV<T>(file)) as T[]
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        parsed = (await importFromXLSX<T>(file)) as T[]
      } else {
        alert('Поддерживаются .csv, .xlsx, .xls')
      }
      if (parsed.length) {
        onImport(parsed)
        setMeta({ count: parsed.length, file: file.name })
      }
    } catch (err) {
      console.error(err)
      alert('Не удалось импортировать файл')
    } finally {
      // сброс input, чтобы повторный импорт того же файла сработал
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* фикс ширины, чтобы не прыгала вёрстка при длинных именах файлов */}
      <label className="glass px-3 py-2 rounded-2xl hover:bg-white/10 cursor-pointer min-w-[160px] text-center">
        Импорт CSV/XLSX
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
      </label>

      <button
        type="button"
        className="glass px-3 py-2 rounded-2xl hover:bg-white/10 min-w-[136px] text-center"
        onClick={() => exportToCSV(rows, filename)}
      >
        Экспорт CSV
      </button>

      <button
        type="button"
        className="glass px-3 py-2 rounded-2xl hover:bg-white/10 min-w-[144px] text-center"
        onClick={() => exportToXLSX(rows, filename)}
      >
        Экспорт XLSX
      </button>

      {/* компактная строка статуса, не расталкивает кнопки */}
      <span
        className="opacity-70 text-sm whitespace-nowrap"
        title={meta.file ? `строк: ${meta.count} • файл: ${meta.file}` : `строк: ${meta.count}`}
      >
        строк: <b>{meta.count}</b>{meta.file ? ` • файл: ${meta.file}` : ''}
      </span>
    </div>
  )
}
