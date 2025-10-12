import Papa from 'papaparse'

export function exportToCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  const csv = Papa.unparse(rows, { header: true })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export async function importFromCSV<T = unknown>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data as T[]),
      error: (err) => reject(err)
    })
  })
}
