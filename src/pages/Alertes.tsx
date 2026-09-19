import { useEffect, useState, useMemo } from 'react'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import JournalAlertes from '../components/JournalAlertes'
import type { AlerteLot, AlerteMesure, Pays } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']

interface AlerteLotPays extends AlerteLot { pays: Pays }
interface AlerteMesurePays extends AlerteMesure { pays: Pays }

export default function Alertes() {
  const [filtrePays, setFiltrePays] = useState<string>('tous')
  const [lots, setLots] = useState<AlerteLotPays[]>([])
  const [mesures, setMesures] = useState<AlerteMesurePays[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all(
      PAYS.map(p =>
        api.get<{ lots_problematiques: AlerteLot[]; mesures_hors_seuil: AlerteMesure[] }>(`/pays/${p}/alertes`)
          .then(r => ({
            pays: p,
            data: r.data,
          }))
      )
    )
      .then(results => {
        const allLots: AlerteLotPays[] = []
        const allMesures: AlerteMesurePays[] = []
        for (const { pays: p, data } of results) {
          for (const l of data.lots_problematiques) {
            allLots.push({ ...l, pays: p })
          }
          for (const m of data.mesures_hors_seuil) {
            allMesures.push({ ...m, pays: p })
          }
        }
        setLots(allLots)
        setMesures(allMesures)
      })
      .catch(() => setError('Impossible de charger les alertes.'))
      .finally(() => setLoading(false))
  }, [])

  const lotsFiltres = useMemo(() => {
    if (filtrePays === 'tous') return lots
    return lots.filter(l => l.pays === filtrePays)
  }, [lots, filtrePays])

  const mesuresFiltrees = useMemo(() => {
    if (filtrePays === 'tous') return mesures
    return mesures.filter(m => m.pays === filtrePays)
  }, [mesures, filtrePays])

  const total = lotsFiltres.length + mesuresFiltrees.length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            Alertes
            {total > 0 && <span style={{ color: 'var(--red)', fontSize: 16, verticalAlign: 'middle', marginLeft: 8 }}>●{total}</span>}
          </h1>
          <p className="page-sub">Lots périmés et mesures hors seuil</p>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Pays</span>
        <select
          aria-label="Filtrer par pays"
          value={filtrePays}
          onChange={e => setFiltrePays(e.target.value)}
        >
          <option value="tous">Tous</option>
          {PAYS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {!loading && (
          <span className="count-pill">{total} alerte{total > 1 ? 's' : ''}</span>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" />Chargement…</div>
      ) : (
        <>
          <div className="section-label">
            Lots problématiques ({lotsFiltres.length})
          </div>

          {lotsFiltres.length === 0 ? (
            <div className="empty-note">Aucun lot périmé.</div>
          ) : (
            lotsFiltres.map(({ lot, raison, pays: p }) => (
              <div key={`${p}-${lot.id}`} className="alert-card lot">
                <div className="alert-left">
                  <span className="alert-entrepot">{lot.id}</span>
                  <span className="alert-meta">
                    {lot.exploitation} — {p.charAt(0).toUpperCase() + p.slice(1)} — stocké le {new Date(lot.date_stockage).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="alert-right">
                  <StatutBadge statut={lot.statut} />
                  <span className="alert-raison">{raison}</span>
                </div>
              </div>
            ))
          )}

          <div className="section-label">
            Mesures hors seuil ({mesuresFiltrees.length})
          </div>

          {mesuresFiltrees.length === 0 ? (
            <div className="empty-note">Aucune mesure hors seuil.</div>
          ) : (
            mesuresFiltrees.map(({ mesure, raison, severite, pays: p }) => (
              <div key={`${p}-${mesure.id}`} className="alert-card mesure">
                <div>
                  <div className="alert-left">
                    <span className="alert-entrepot">{mesure.entrepot_id}</span>
                    <span className="alert-badge">{severite === 'critique' ? 'CRITIQUE' : 'ALERTE'}</span>
                  </div>
                  <div className="alert-time">
                    {p.charAt(0).toUpperCase() + p.slice(1)} —{' '}
                    {new Date(mesure.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    — {mesure.temperature?.toFixed(1)}°C / {mesure.humidity?.toFixed(1)}%
                  </div>
                </div>
                <span className="alert-detail">{raison}</span>
              </div>
            ))
          )}
        </>
      )}

      <JournalAlertes paysFiltre={filtrePays} />
    </div>
  )
}
