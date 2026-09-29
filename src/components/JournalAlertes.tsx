import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import type { AlerteJournal, AlerteStatut, Page, Pays } from '../types'
import { statutAlerte } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']
const PAGE_SIZE = 20

const LIBELLE_STATUT: Record<AlerteStatut, string> = {
  ouverte: 'Ouverte',
  acquittee: 'Prise en charge',
  resolue: 'Résolue',
}

function dateCourte(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Journal des alertes persistées : historique, prise en charge et clôture.
 *
 * Distinct de la vue du dessus, qui montre l'état courant recalculé. Ici chaque
 * alerte a une identité et un cycle de vie, donc une trace : qui l'a prise en
 * charge, quand, et si un e-mail est parti.
 */
export default function JournalAlertes({ paysFiltre }: { paysFiltre: string }) {
  const [statut, setStatut] = useState<AlerteStatut | 'tous'>('ouverte')
  const [page, setPage] = useState(0)
  const [donnees, setDonnees] = useState<AlerteJournal[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  const cibles = paysFiltre === 'tous' ? PAYS : [paysFiltre as Pays]

  const charger = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      if (statut !== 'tous') params.statut = statut

      const reponses = await Promise.all(
        cibles.map(p =>
          api.get<Page<AlerteJournal>>(`/pays/${p}/alertes/journal`, { params })
            .then(r => r.data)
            .catch(() => ({ items: [], total: 0, limit: PAGE_SIZE, offset: 0 }))
        )
      )
      const items = reponses.flatMap(r => r.items)
      items.sort((a, b) => (b.declenchee_le ?? '').localeCompare(a.declenchee_le ?? ''))
      setDonnees(items)
      setTotal(reponses.reduce((s, r) => s + r.total, 0))
    } catch {
      setError('Impossible de charger le journal des alertes.')
    } finally {
      setLoading(false)
    }
  }, [paysFiltre, statut, page])

  useEffect(() => { charger() }, [charger])
  useEffect(() => { setPage(0) }, [paysFiltre, statut])

  async function agir(alerte: AlerteJournal, action: 'acquitter' | 'resoudre') {
    setEnCours(alerte.id)
    setError(null)
    try {
      const corps = action === 'acquitter' ? { par: 'Interface siège' } : undefined
      await api.patch(`/pays/${alerte.pays}/alertes/${alerte.id}/${action}`, corps)
      await charger()
    } catch {
      setError(`Action « ${action} » impossible sur l’alerte ${alerte.id.slice(0, 8)}.`)
    } finally {
      setEnCours(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ marginTop: 32 }}>
      <div className="section-label">Journal des alertes ({total})</div>

      <div className="filter-row">
        <span className="filter-label">Statut</span>
        <select
          aria-label="Filtrer par statut"
          value={statut}
          onChange={e => setStatut(e.target.value as AlerteStatut | 'tous')}
        >
          <option value="ouverte">Ouvertes</option>
          <option value="acquittee">Prises en charge</option>
          <option value="resolue">Résolues</option>
          <option value="tous">Toutes</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" />Chargement…</div>
      ) : donnees.length === 0 ? (
        <div className="empty-note">Aucune alerte dans ce filtre.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Déclenchée</th>
                  <th>Pays</th>
                  <th>Type</th>
                  <th>Sévérité</th>
                  <th>Message</th>
                  <th>Statut</th>
                  <th>E-mail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donnees.map(a => {
                  const s = statutAlerte(a)
                  return (
                    <tr key={a.id}>
                      <td className="cell-mono">{dateCourte(a.declenchee_le)}</td>
                      <td className="cell-muted">{a.pays}</td>
                      <td>{a.type}</td>
                      <td className={a.severite === 'critique' ? 'cell-alert' : ''}>
                        {a.severite}
                      </td>
                      <td>{a.message}</td>
                      <td>
                        {LIBELLE_STATUT[s]}
                        {a.acquittee_par && <span className="cell-muted"> — {a.acquittee_par}</span>}
                      </td>
                      <td className="cell-muted">{a.email_envoye_le ? 'envoyé' : '—'}</td>
                      <td>
                        {s !== 'resolue' && (
                          <>
                            {s === 'ouverte' && (
                              <button
                                className="btn-ghost"
                                disabled={enCours === a.id}
                                onClick={() => agir(a, 'acquitter')}
                              >
                                Prendre en charge
                              </button>
                            )}
                            <button
                              className="btn-ghost"
                              disabled={enCours === a.id}
                              onClick={() => agir(a, 'resoudre')}
                            >
                              Clôturer
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn-ghost" disabled={page <= 0} onClick={() => setPage(p => p - 1)}>
                ← Précédent
              </button>
              <span className="pagination-info">Page {page + 1} / {totalPages}</span>
              <button
                className="btn-ghost"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      <div className="empty-note" style={{ marginTop: 12, textAlign: 'left' }}>
        Clôturer une alerte ne corrige pas la cause : si l’anomalie est toujours
        présente dans les relevés, le cycle de vérification suivant rouvrira une alerte.
      </div>
    </div>
  )
}
