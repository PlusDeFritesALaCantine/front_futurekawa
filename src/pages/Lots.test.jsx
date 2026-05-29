import { describe, it, expect } from 'vitest'

const LOTS = [
  { id: 'L3', date_stockage: '2025-06-01', statut: 'perime' },
  { id: 'L1', date_stockage: '2025-01-01', statut: 'perime' },
  { id: 'L2', date_stockage: '2025-03-15', statut: 'conforme' },
]

describe('Tri FIFO lots', () => {
  it('trie les lots par date_stockage ASC', () => {
    const tries = [...LOTS].sort((a, b) => new Date(a.date_stockage) - new Date(b.date_stockage))
    expect(tries.map(l => l.id)).toEqual(['L1', 'L2', 'L3'])
  })

  it('le premier élément est le plus ancien', () => {
    const tries = [...LOTS].sort((a, b) => new Date(a.date_stockage) - new Date(b.date_stockage))
    expect(tries[0].date_stockage < tries[1].date_stockage).toBe(true)
  })
})
