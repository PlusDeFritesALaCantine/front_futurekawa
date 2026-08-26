import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import MesureChart from '../components/MesureChart'
import type { Lot, Mesure, Pays } from '../types'
import { getSeuil } from '../config/seuils'

export default function LotDetail() {
  const { pays, lotId } = useParams<{ pays: string; lotId: string }>()
  const [lot, setLot] = useState<Lot | null>(null)
  const [mesures, setMesures] = useState<Mesure[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get<Lot[]>(`/pays/${pays}/lots`),
      api.get<Mesure[]>(`/pays/${pays}/mesures`),
    ])
      .then(([lotsRes, mesuresRes]) => {
        const found = lotsRes.data.find(l => l.id === lotId)
        if (!found) { setError('Lot introuvable.'); return }
        setLot(found)
        const filtrees = mesuresRes.data
          .filter(m => m.entrepot_id === found.entrepot_id && new Date(m.timestamp).getTime() >= new Date(found.date_stockage).getTime())
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        setMesures(filtrees)
      })
      .catch(() => setError(`Impossible de charger les données pour ${pays}.`))
  }, [pays, lotId])

  function handleDelete() {
    if (!window.confirm(`Supprimer le lot ${lotId} ? Cette action est irréversible.`)) return
    setDeleting(true)
    api.delete(`/lots/${lotId}`)
      .then(() => navigate(`/lots?pays=${pays}`))
      .catch(() => { setError('Impossible de supprimer le lot.'); setDeleting(false) })
  }

  if (error) return (
    <div>
      <Link to="/lots" className="btn-ghost" style={{ marginBottom: 16 }}>← Retour aux lots</Link>
      <div className="error-banner">{error}</div>
    </div>
  )

  if (!lot) return <div className="loading"><span className="spinner" />Chargement…</div>

  const paysLabel = pays ? pays.charAt(0).toUpperCase() + pays.slice(1) : ''
  const seuilTemp = getSeuil(pays as Pays, 'temperature')
  const seuilHum = getSeuil(pays as Pays, 'humidity')

  return (
    <div>
      <div className="detail-top">
        <Link to={`/lots?pays=${pays}`} className="btn-ghost">← Retour aux lots</Link>
        <button
          className="btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Suppression…' : 'Supprimer le lot'}
        </button>
      </div>

      <h1 className="detail-id">{lot.id}</h1>
      <p className="detail-sub">{lot.exploitation} — {paysLabel}</p>

      <div className="info-bar">
        <div className="info-cell">
          <div className="info-lbl">ID</div>
          <div className="info-val mono">{lot.id}</div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Exploitation</div>
          <div className="info-val">{lot.exploitation}</div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Entrepôt</div>
          <div className="info-val">{lot.entrepot_id}</div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Date stockage</div>
          <div className="info-val">{new Date(lot.date_stockage).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Statut</div>
          <div className="info-val"><StatutBadge statut={lot.statut} /></div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Mesures</div>
          <div className="info-val">{mesures.length} relevés</div>
        </div>
        <div className="info-cell">
          <div className="info-lbl">Dernière mesure</div>
          <div className="info-val mono">
            {mesures.length > 0
              ? new Date(mesures[mesures.length - 1].timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
              : '—'}
          </div>
        </div>
      </div>

      {mesures.length === 0 ? (
        <div className="empty">Aucune mesure disponible pour cet entrepôt.</div>
      ) : (
        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Température (°C) — <b>seuils {paysLabel} : {seuilTemp.min}–{seuilTemp.max}°C / idéal {seuilTemp.ideal}°C</b></div>
            <div className="chart-canvas-wrap">
              <MesureChart mesures={mesures} type="temperature" pays={pays as Pays} />
            </div>
            <div className="chart-legend">
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--blue)' }} />Température</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Max</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--green)', opacity: .7 }} />Idéal</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Min</div>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Humidité (%) — <b>seuils {paysLabel} : {seuilHum.min}–{seuilHum.max}% / idéal {seuilHum.ideal}%</b></div>
            <div className="chart-canvas-wrap">
              <MesureChart mesures={mesures} type="humidity" pays={pays as Pays} />
            </div>
            <div className="chart-legend">
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--gold)' }} />Humidité</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Max</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--green)', opacity: .7 }} />Idéal</div>
              <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Min</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
