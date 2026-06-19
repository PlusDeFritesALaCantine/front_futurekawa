import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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

  if (error) return (
    <div>
      <Link to="/lots" className="back-link">← Retour aux lots</Link>
      <div className="error-banner">{error}</div>
    </div>
  )

  if (!lot) return <div className="loading"><span className="spinner" />Chargement…</div>

  const paysLabel = pays ? pays.charAt(0).toUpperCase() + pays.slice(1) : ''
  const seuilTemp = getSeuil(pays as Pays, 'temperature')
  const seuilHum = getSeuil(pays as Pays, 'humidity')

  return (
    <div>
      <Link to={`/lots?pays=${pays}`} className="back-link">← Retour aux lots</Link>

      <div className="page-header">
        <h2>{lot.id}</h2>
        <p>{lot.exploitation} — {paysLabel}</p>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <label>ID</label>
          <p className="cell-mono">{lot.id}</p>
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
            <h3>Température (°C) — seuils {paysLabel} : {seuilTemp.min}–{seuilTemp.max}°C / idéal {seuilTemp.ideal}°C</h3>
            <MesureChart mesures={mesures} type="temperature" pays={pays as Pays} />
          </div>
          <div className="chart-card">
            <h3>Humidité (%) — seuils {paysLabel} : {seuilHum.min}–{seuilHum.max}% / idéal {seuilHum.ideal}%</h3>
            <MesureChart mesures={mesures} type="humidity" pays={pays as Pays} />
          </div>
        </div>
      )}
    </div>
  )
}
