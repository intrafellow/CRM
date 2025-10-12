/** LocalStorage for demo. */
export function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}
export function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  try { return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
