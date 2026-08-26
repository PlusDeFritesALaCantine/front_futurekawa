import { describe, it, expect } from 'vitest'
import type { Lot, Mesure } from '../types'

const LOTS: Lot[] = [
  { id: 'L3', pays: 'bresil', exploitation: 'Exploit C', entrepot_id: 'ent-bresil-1', date_stockage: '2025-06-01', statut: 'perime' },
  { id: 'L1', pays: 'bresil', exploitation: 'Exploit A', entrepot_id: 'ent-bresil-1', date_stockage: '2025-01-01', statut: 'perime' },
  { id: 'L2', pays: 'equateur', exploitation: 'Exploit B', entrepot_id: 'ent-equateur-1', date_stockage: '2025-03-15', statut: 'conforme' },
]

describe('Tri FIFO lots', () => {
  it('trie les lots par date_stockage ASC', () => {
    const tries = [...LOTS].sort((a, b) => new Date(a.date_stockage).getTime() - new Date(b.date_stockage).getTime())
    expect(tries.map(l => l.id)).toEqual(['L1', 'L2', 'L3'])
  })

  it('le premier élément est le plus ancien', () => {
    const tries = [...LOTS].sort((a, b) => new Date(a.date_stockage).getTime() - new Date(b.date_stockage).getTime())
    expect(tries[0].date_stockage < tries[1].date_stockage).toBe(true)
  })
})

describe('Filtrage par date', () => {
  const dateDebut = new Date('2025-03-01').getTime()
  const dateFin = new Date('2025-06-30').getTime()

  it('filtre les lots par date de stockage', () => {
    const result = LOTS.filter(l => new Date(l.date_stockage).getTime() >= dateDebut)
      .filter(l => new Date(l.date_stockage).getTime() <= dateFin)
    expect(result.map(l => l.id)).toEqual(['L3', 'L2'])
  })

  it('retourne tout si pas de filtre', () => {
    const result = LOTS.filter(() => true)
    expect(result).toHaveLength(3)
  })
})

describe('Filtrage par pays', () => {
  it('filtre les lots par pays', () => {
    const result = LOTS.filter(l => l.pays === 'bresil')
    expect(result.map(l => l.id)).toEqual(['L3', 'L1'])
  })

  it('retourne vide si le pays ne correspond pas', () => {
    const result = LOTS.filter(l => l.pays === 'colombie')
    expect(result).toHaveLength(0)
  })
})

describe('anciennete', () => {
  function anciennete(dateStr: string): string {
    const j = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (j < 30) return `${j} j`
    if (j < 365) return `${Math.floor(j / 30)} mois`
    return `${Math.floor(j / 365)} an${j >= 730 ? 's' : ''}`
  }

  it('affiche en jours si < 30 jours', () => {
    const recent = new Date(Date.now() - 5 * 86400000).toISOString()
    expect(anciennete(recent)).toBe('5 j')
  })

  it('affiche en mois si < 365 jours', () => {
    const mois = new Date(Date.now() - 90 * 86400000).toISOString()
    expect(anciennete(mois)).toBe('3 mois')
  })

  it('affiche en an(s) si >= 365 jours', () => {
    const an = new Date(Date.now() - 400 * 86400000).toISOString()
    expect(anciennete(an)).toBe('1 an')
  })

  it('affiche "ans" pluriel si >= 730 jours', () => {
    const ans = new Date(Date.now() - 800 * 86400000).toISOString()
    expect(anciennete(ans)).toBe('2 ans')
  })
})

describe('formatDerniereMesure', () => {
  function formatDerniereMesure(m: Mesure | undefined): string {
    if (!m) return '—'
    const date = new Date(m.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    return `${m.temperature.toFixed(0)}°C · ${m.humidity.toFixed(0)}% — ${date}`
  }

  it('retourne — si undefined', () => {
    expect(formatDerniereMesure(undefined)).toBe('—')
  })

  it('formate correctement une mesure', () => {
    const m: Mesure = { id: 'M1', entrepot_id: 'ent-1', temperature: 29.5, humidity: 55.2, timestamp: '2025-12-11T08:00:00Z' }
    const result = formatDerniereMesure(m)
    expect(result).toContain('30°C')
    expect(result).toContain('55%')
  })
})
