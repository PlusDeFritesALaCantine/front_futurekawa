import type { Statut } from '../types'

const LABELS: Record<Statut, string> = {
  conforme: 'Conforme',
  en_alerte: 'Alerte',
  perime: 'Périmé',
  indisponible: 'Indisponible',
  ok: 'OK',
}

interface StatutBadgeProps {
  statut: Statut
}

export default function StatutBadge({ statut }: StatutBadgeProps) {
  return (
    <span className={`badge badge-${statut}`}>
      <span className="badge-dot" />
      {LABELS[statut] ?? statut}
    </span>
  )
}
