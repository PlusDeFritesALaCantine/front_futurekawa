import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import type { Lot, Pays } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']

export default function Lots() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pays, setPays] = useState<string>(searchParams.get('pays') || 'bresil')
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get<Lot[]>(`/pays/${pays}/lots`)
      .then(r => setLots(r.data))
      .catch(() => setError(`API ${pays} indisponible`))
      .finally(() => setLoading(false))
  }, [pays])

  function handlePays(val: string) {
    setPays(val)
    setSearchParams({ pays: val })
  }

  return (
    <div>
      <div className="page-header">
        <h2>Lots de café</h2>
        <p>Triés par date de stockage (FIFO — plus anciens en premier)</p>
      </div>

      <div className="controls">
        <label>Pays</label>
        <select value={pays} onChange={e => handlePays(e.target.value)}>
          {PAYS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {!loading && !error && (
          <span className="controls-count">{lots.length} lot{lots.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" />Chargement…</div>
      ) : lots.length === 0 ? (
        <div className="empty">Aucun lot pour ce pays.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Exploitation</th>
                <th>Entrepôt</th>
                <th>Date stockage</th>
                <th>Ancienneté</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {lots.map(lot => (
                <tr
                  key={lot.id}
                  className={`row-${lot.statut} clickable`}
                  onClick={() => navigate(`/lots/${pays}/${lot.id}`)}
                >
                  <td className="cell-mono">{lot.id}</td>
                  <td>{lot.exploitation}</td>
                  <td className="cell-muted">{lot.entrepot_id}</td>
                  <td>{new Date(lot.date_stockage).toLocaleDateString('fr-FR')}</td>
                  <td className="cell-muted">{anciennete(lot.date_stockage)}</td>
                  <td><StatutBadge statut={lot.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function anciennete(dateStr: string): string {
  const j = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (j < 30) return `${j} j`
  if (j < 365) return `${Math.floor(j / 30)} mois`
  return `${Math.floor(j / 365)} an${j >= 730 ? 's' : ''}`
}
