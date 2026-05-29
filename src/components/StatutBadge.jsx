const LABELS = {
  conforme: 'Conforme',
  en_alerte: 'Alerte',
  perime: 'Périmé',
  indisponible: 'Indisponible',
  ok: 'OK',
}

export default function StatutBadge({ statut }) {
  return (
    <span className={`badge badge-${statut}`}>
      {LABELS[statut] ?? statut}
    </span>
  )
}
