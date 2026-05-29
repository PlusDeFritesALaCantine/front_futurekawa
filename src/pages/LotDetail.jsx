import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client.js'
import StatutBadge from '../components/StatutBadge.jsx'
import MesureChart from '../components/MesureChart.jsx'

export default function LotDetail() {
  const { pays, lotId } = useParams()
  const [lot, setLot] = useState(null)
  const [mesures, setMesures] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/pays/${pays}/lots`),
      api.get(`/pays/${pays}/mesures`),
    ])
      .then(([lotsRes, mesuresRes]) => {
        const found = lotsRes.data.find(l => l.id === lotId)
        if (!found) { setError('Lot introuvable.'); return }
        setLot(found)
        const filtrees = mesuresRes.data
          .filter(m => m.entrepot_id === found.entrepot_id)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        setMesures(filtrees)
      })
      .catch(() => setError(`Impossible de charger les données pour ${pays}.`))
  }, [pays, lotId])

  if (error) return (
    <div>
      <Link to="/lots" className="back-link">← Retour aux lots</Link>
      <div className="error-banner">{error}</div>
    </div>
  )

  if (!lot) return <div className="loading">Chargement…</div>

  return (
    <div>
      <Link to={`/lots?pays=${pays}`} className="back-link">← Retour aux lots</Link>

      <div className="page-header">
        <h2>{lot.id}</h2>
        <p>{lot.exploitation} — {pays.charAt(0).toUpperCase() + pays.slice(1)}</p>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <label>ID</label>
          <p style={{ fontFamily: 'monospace' }}>{lot.id}</p>
        </div>
        <div className="info-item">
          <label>Exploitation</label>
          <p>{lot.exploitation}</p>
        </div>
        <div className="info-item">
          <label>Entrepôt</label>
          <p>{lot.entrepot_id}</p>
        </div>
        <div className="info-item">
          <label>Date stockage</label>
          <p>{new Date(lot.date_stockage).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="info-item">
          <label>Statut</label>
          <p><StatutBadge statut={lot.statut} /></p>
        </div>
        <div className="info-item">
          <label>Mesures</label>
          <p>{mesures.length} relevés</p>
        </div>
      </div>

      {mesures.length === 0 ? (
        <div className="empty">Aucune mesure disponible pour cet entrepôt.</div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Température (°C) — seuils Brésil : 26–32°C / idéal 29°C</h3>
            <MesureChart mesures={mesures} type="temperature" />
          </div>
          <div className="chart-card">
            <h3>Humidité (%) — seuils Brésil : 53–57% / idéal 55%</h3>
            <MesureChart mesures={mesures} type="humidity" />
          </div>
        </div>
      )}
    </div>
  )
}
