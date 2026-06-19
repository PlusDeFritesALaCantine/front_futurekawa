import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import type { DashboardResponse } from '../types'

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
      <div className="page-header"><h2>Dashboard</h2></div>
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
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Vue consolidée de tous les pays</p>
      </div>

      <div className="summary-row">
        <SumStat n={pays.length} label="Pays" />
        <SumStat n={paysOk} label="En ligne" color="var(--conforme)" />
        <SumStat n={totalLots} label="Lots total" />
        <SumStat n={totalAlertes} label="Alertes" color={totalAlertes > 0 ? 'var(--perime)' : undefined} />
      </div>

      <div className="cards-grid">
        {pays.map(p => (
          <div
            key={p.nom}
            className={`card country-card ${p.status === 'indisponible' ? 'indisponible' : ''}`}
            onClick={() => p.status === 'ok' && navigate(`/lots?pays=${p.nom}`)}
          >
            <div className="country-header">
              <span className="country-name">{p.nom}</span>
              <StatutBadge statut={p.status === 'ok' ? 'ok' : 'indisponible'} />
            </div>

            {p.status === 'ok' ? (
              <>
                <div className="country-stats">
                  <div className="stat">
                    <div className="n">{p.nb_lots ?? '—'}</div>
                    <div className="l">Lots</div>
                  </div>
                  <div className="stat">
                    <div className={`n ${(p.nb_alertes ?? 0) > 0 ? 'danger' : ''}`}>{p.nb_alertes ?? '—'}</div>
                    <div className="l">Alertes</div>
                  </div>
                </div>

                {p.derniere_mesure && (
                  <div className="mesure-strip">
                    <div className="mv">
                      <span className="val">{p.derniere_mesure.temperature?.toFixed(1)}°C</span>
                      <span className="lbl">Température</span>
                    </div>
                    <div className="mv">
                      <span className="val">{p.derniere_mesure.humidity?.toFixed(1)}%</span>
                      <span className="lbl">Humidité</span>
                    </div>
                    <div className="mv" style={{ marginLeft: 'auto' }}>
                      <span className="lbl" style={{ textAlign: 'right' }}>
                        {new Date(p.derniere_mesure.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 8 }}>API indisponible</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface SumStatProps {
  n: number
  label: string
  color?: string
}

function SumStat({ n, label, color }: SumStatProps) {
  return (
    <div className="card sum-stat">
      <span className="sum-stat-n" style={{ color: color ?? 'var(--text)' }}>{n}</span>
      <span className="sum-stat-l">{label}</span>
    </div>
  )
}
