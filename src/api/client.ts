import axios from 'axios'
import type { Page } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  timeout: 12000,
})

/**
 * Normalise la réponse de /pays/{pays}/mesures : le siège renvoie une enveloppe
 * paginée { items, total, limit, offset }, mais certaines API pays rendent encore
 * un tableau brut. On accepte les deux pour que les pages ne plantent pas.
 */
export function normaliserPage<T>(data: unknown, limit: number, offset: number): Page<T> {
  if (Array.isArray(data)) {
    const all = data as T[]
    return { items: all.slice(offset, offset + limit), total: all.length, limit, offset }
  }
  if (data && typeof data === 'object') {
    const d = data as Partial<Page<T>>
    if (Array.isArray(d.items)) {
      return { items: d.items, total: d.total ?? d.items.length, limit: d.limit ?? limit, offset: d.offset ?? offset }
    }
    const imbrique = (d as { data?: unknown }).data
    if (Array.isArray(imbrique)) {
      const all = imbrique as T[]
      return { items: all.slice(offset, offset + limit), total: all.length, limit, offset }
    }
  }
  return { items: [], total: 0, limit, offset }
}

export default api
