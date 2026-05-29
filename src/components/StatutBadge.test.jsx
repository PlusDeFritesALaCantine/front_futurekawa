import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatutBadge from './StatutBadge.jsx'

describe('StatutBadge', () => {
  it('affiche Conforme avec la bonne classe', () => {
    const { container } = render(<StatutBadge statut="conforme" />)
    expect(screen.getByText('Conforme')).toBeTruthy()
    expect(container.firstChild.className).toContain('badge-conforme')
  })

  it('affiche Périmé avec la bonne classe', () => {
    const { container } = render(<StatutBadge statut="perime" />)
    expect(screen.getByText('Périmé')).toBeTruthy()
    expect(container.firstChild.className).toContain('badge-perime')
  })

  it('affiche Alerte avec la bonne classe', () => {
    const { container } = render(<StatutBadge statut="en_alerte" />)
    expect(screen.getByText('Alerte')).toBeTruthy()
    expect(container.firstChild.className).toContain('badge-en_alerte')
  })

  it('affiche Indisponible', () => {
    render(<StatutBadge statut="indisponible" />)
    expect(screen.getByText('Indisponible')).toBeTruthy()
  })
})
