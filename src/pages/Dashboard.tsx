import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import type { DashboardResponse, Pays } from '../types'
import { getSeuil } from '../config/seuils'

const PAYS_CLASS: Record<string, string> = {
  bresil: 'br',
  equateur: 'eq',
  colombie: 'co',
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<DashboardResponse>('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Impossible de contacter le backend siège.'))
  }, [])

  if (error) return (
    <div>
      <div className="page-head"><h1 className="page-title">Dashboard</h1></div>
      <div className="error-banner">{error}</div>
    </div>
  )

  if (!data) return <div className="loading"><span className="spinner" />Chargement…</div>

  const pays = data.pays ?? []
  const totalLots = pays.reduce((s, p) => s + (p.nb_lots ?? 0), 0)
  const totalAlertes = pays.reduce((s, p) => s + (p.nb_alertes ?? 0), 0)
  const paysOk = pays.filter(p => p.status === 'ok').length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Vue consolidée de tous les pays</p>
        </div>
        <button className="btn" onClick={() => navigate('/lots/ajout')}>
          + Ajouter un lot
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{pays.length}</div>
          <div className="stat-label">Pays</div>
        </div>
        <div className="stat-card">
          <div className="stat-num ok">{paysOk}</div>
          <div className="stat-label">En ligne</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalLots}</div>
          <div className="stat-label">Lots total</div>
        </div>
        <div className="stat-card">
          <div className="stat-num alert">{totalAlertes}</div>
          <div className="stat-label">Alertes</div>
        </div>
      </div>

      <div className="country-grid">
        {pays.map(p => {
          const paysKey = p.nom as Pays
          const cls = PAYS_CLASS[p.nom] || 'br'
          const seuilTemp = getSeuil(paysKey, 'temperature')
          const seuilHum = getSeuil(paysKey, 'humidity')
          const temp = p.derniere_mesure?.temperature
          const hum = p.derniere_mesure?.humidity

          function tempPos(v: number) {
            const range = 40 - 16
            return ((v - 16) / range) * 100
          }
          function humPos(v: number) {
            const range = 90 - 10
            return ((v - 10) / range) * 100
          }

          return (
            <div
              key={p.nom}
              className={`ccard ${p.status === 'indisponible' ? 'indisponible' : ''}`}
              onClick={() => p.status === 'ok' && navigate(`/lots?pays=${p.nom}`)}
            >
              <div className={`ccard-bar ${cls}`} />
              <div className="ccard-body">
                <div className="ccard-top">
                  <div className="ccard-name">{p.nom}</div>
                  <StatutBadge statut={p.status === 'ok' ? 'ok' : 'indisponible'} />
                </div>

                {p.status === 'ok' ? (
                  <>
                    <div className="ccard-metrics">
                      <div className="metric">
                        <div className="metric-num">{p.nb_lots ?? '—'}</div>
                        <div className="metric-lbl">Lots</div>
                      </div>
                      <div className="metric">
                        <div className={`metric-num ${(p.nb_alertes ?? 0) > 0 ? 'danger' : ''}`}>{p.nb_alertes ?? '—'}</div>
                        <div className="metric-lbl">Alertes</div>
                      </div>
                    </div>

                    {temp != null && (
                      <div className="range">
                        <div className="range-row">
                          <span>Température · cible {seuilTemp.ideal}°C ±{seuilTemp.max - seuilTemp.ideal}</span>
                          <span className="mono">{temp.toFixed(1)}°C</span>
                        </div>
                        <div className="range-track">
                          <div className={`range-band ${cls}`} style={{ left: `${tempPos(seuilTemp.min)}%`, width: `${tempPos(seuilTemp.max) - tempPos(seuilTemp.min)}%` }} />
                          <div className={`range-marker ${temp < seuilTemp.min || temp > seuilTemp.max ? 'warn' : ''}`} style={{ left: `${tempPos(temp)}%` }} />
                        </div>
                        <div className="range-row" style={{ marginTop: 10 }}>
                          <span>Humidité · cible {seuilHum.ideal}% ±{seuilHum.max - seuilHum.ideal}</span>
                          <span className="mono">{hum?.toFixed(1) ?? '—'}%</span>
                        </div>
                        {hum != null && (
                          <div className="range-track">
                            <div className={`range-band ${cls}`} style={{ left: `${humPos(seuilHum.min)}%`, width: `${humPos(seuilHum.max) - humPos(seuilHum.min)}%` }} />
                            <div className={`range-marker ${hum < seuilHum.min || hum > seuilHum.max ? 'warn' : ''}`} style={{ left: `${humPos(hum)}%` }} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="ccard-foot">
                      <span>Dernière mesure</span>
                      <span className="mono">
                        {p.derniere_mesure
                          ? new Date(p.derniere_mesure.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 8 }}>API indisponible</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
