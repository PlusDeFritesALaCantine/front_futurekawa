import { useEffect, useState } from 'react'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import type { AlertesResponse, Pays } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']

export default function Alertes() {
  const [pays, setPays] = useState<string>('bresil')
  const [data, setData] = useState<AlertesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)
    api.get<AlertesResponse>(`/pays/${pays}/alertes`)
      .then(r => setData(r.data))
      .catch(() => setError(`API ${pays} indisponible`))
      .finally(() => setLoading(false))
  }, [pays])

  const nbLots = data?.lots_problematiques?.length ?? 0
  const nbMesures = data?.mesures_hors_seuil?.length ?? 0
  const total = nbLots + nbMesures

  return (
    <div>
      <div className="page-header">
        <h2>
          Alertes
          {total > 0 && <span className="count-badge">{total}</span>}
        </h2>
        <p>Lots périmés et mesures hors seuil</p>
      </div>

      <div className="controls">
        <label>Pays</label>
        <select value={pays} onChange={e => setPays(e.target.value)}>
          {PAYS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" />Chargement…</div>
      ) : !data ? null : (
        <>
          <div className="section-header">
            Lots problématiques ({nbLots})
          </div>

          {nbLots === 0 ? (
            <div className="empty empty-inline">Aucun lot périmé.</div>
          ) : (
            data.lots_problematiques.map(({ lot, raison }) => (
              <div key={lot.id} className="alert-item lot">
                <div className="alert-left">
                  <span className="alert-id">{lot.id}</span>
                  <span className="alert-meta">
                    {lot.exploitation} — stocké le {new Date(lot.date_stockage).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="alert-right">
                  <StatutBadge statut={lot.statut} />
                  <span className="alert-raison">{raison}</span>
                </div>
              </div>
            ))
          )}

          <div className="section-header section-header-spaced">
            Mesures hors seuil ({nbMesures})
          </div>

          {nbMesures === 0 ? (
            <div className="empty empty-inline">Aucune mesure hors seuil.</div>
          ) : (
            data.mesures_hors_seuil.map(({ mesure, raison, severite }) => (
              <div key={mesure.id} className="alert-item mesure">
                <div className="alert-left">
                  <span className="alert-id">
                    {mesure.entrepot_id}
                    <span className={`severite-badge severite-${severite}`}>
                      {severite}
                    </span>
                  </span>
                  <span className="alert-meta">
                    {new Date(mesure.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    {' — '}{mesure.temperature?.toFixed(1)}°C / {mesure.humidity?.toFixed(1)}%
                  </span>
                </div>
                <span className="alert-raison">{raison}</span>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
