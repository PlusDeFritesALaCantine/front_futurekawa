import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import StatutBadge from '../components/StatutBadge.jsx'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Impossible de contacter le backend siège.'))
  }, [])

  if (error) return (
    <div>
      <div className="page-header"><h2>Dashboard</h2></div>
      <div className="error-banner">{error}</div>
    </div>
  )

  if (!data) return <div className="loading">Chargement…</div>

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

      {/* Résumé global */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
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
                    <div className={`n ${p.nb_alertes > 0 ? 'danger' : ''}`}>{p.nb_alertes ?? '—'}</div>
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

function SumStat({ n, label, color }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 28px', minWidth: 100 }}>
      <span style={{ fontSize: '2rem', fontWeight: 800, color: color ?? 'var(--text)', lineHeight: 1 }}>{n}</span>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--muted)', marginTop: 4 }}>{label}</span>
    </div>
  )
}
