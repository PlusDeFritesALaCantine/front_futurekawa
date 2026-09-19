import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import MesureChart from '../components/MesureChart'
import type { Lot, Mesure, Page, Pays } from '../types'
import { getSeuil, useSeuils } from '../config/seuils'

const POINTS_COURBE_MAX = 500

export default function LotDetail() {
  const { pays, lotId } = useParams<{ pays: string; lotId: string }>()
  const [lot, setLot] = useState<Lot | null>(null)
  const [mesures, setMesures] = useState<Mesure[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useSeuils(pays as Pays)

  useEffect(() => {
    let vivant = true

    api.get<Lot[]>(`/pays/${pays}/lots`)
      .then(async lotsRes => {
        const found = lotsRes.data.find(l => l.id === lotId)
        if (!found) { if (vivant) setError('Lot introuvable.'); return }
        if (vivant) setLot(found)

        // Le filtrage se fait côté serveur : inutile de rapatrier tout
        // l'historique du pays pour n'en garder qu'un entrepôt.
        const { data } = await api.get<Page<Mesure>>(`/pays/${pays}/mesures`, {
          params: {
            entrepot_id: found.entrepot_id,
            debut: new Date(found.date_stockage).toISOString(),
            limit: POINTS_COURBE_MAX,
          },
        })
        // L'API trie du plus récent au plus ancien ; les courbes se lisent à l'endroit.
        if (vivant) setMesures([...data.items].reverse())
      })
      .catch(() => { if (vivant) setError(`Impossible de charger les données pour ${pays}.`) })

    return () => { vivant = false }
  }, [pays, lotId])

  function handleDelete() {
    if (!window.confirm(`Supprimer le lot ${lotId} ? Cette action est irréversible.`)) return
    setDeleting(true)
    // Passe par le siège : le front ne s'adresse jamais directement à une API pays.
    api.delete(`/pays/${pays}/lots/${lotId}`)
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
