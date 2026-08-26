import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import StatutBadge from '../components/StatutBadge'
import type { Lot, Mesure, Pays } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']
const PAGE_SIZE = 20

export default function Lots() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pays = searchParams.get('pays') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const [lots, setLots] = useState<Lot[]>([])
  const [dernieresMesures, setDernieresMesures] = useState<Map<string, Mesure>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null)
  const [dateFin, setDateFin] = useState<Dayjs | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError(null)
    setDateDebut(null)
    setDateFin(null)
    const paysList = pays ? [pays] : PAYS
    Promise.all(
      paysList.map(p => Promise.all([
        api.get<Lot[]>(`/pays/${p}/lots`),
        api.get<Mesure[]>(`/pays/${p}/mesures`),
      ]))
    )
      .then(results => {
        const allLots: Lot[] = []
        const dernieres = new Map<string, Mesure>()
        for (const [lotsRes, mesuresRes] of results) {
          allLots.push(...lotsRes.data)
          for (const m of mesuresRes.data) {
            const key = m.lot_id || m.entrepot_id
            const cur = dernieres.get(key)
            if (!cur || new Date(m.timestamp) > new Date(cur.timestamp)) {
              dernieres.set(key, m)
            }
          }
        }
        allLots.sort((a, b) => new Date(a.date_stockage).getTime() - new Date(b.date_stockage).getTime())
        setLots(allLots)
        setDernieresMesures(dernieres)
      })
      .catch(() => setError('API indisponible'))
      .finally(() => setLoading(false))
  }, [pays])

  const lotsFiltres = useMemo(() => {
    let result = lots
    if (dateDebut) {
      const debut = dateDebut.startOf('day').toDate().getTime()
      result = result.filter(l => new Date(l.date_stockage).getTime() >= debut)
    }
    if (dateFin) {
      const fin = dateFin.endOf('day').toDate().getTime()
      result = result.filter(l => new Date(l.date_stockage).getTime() <= fin)
    }
    return result
  }, [lots, dateDebut, dateFin])

  const totalPages = Math.ceil(lotsFiltres.length / PAGE_SIZE)
  const lotsPage = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return lotsFiltres.slice(start, start + PAGE_SIZE)
  }, [lotsFiltres, page])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams)
    if (pays) next.set('pays', pays)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const lotsSansFiltreDate = useMemo(() => lots, [lots])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Lots de café</h1>
            <p className="page-sub">Triés par date de stockage (FIFO — plus anciens en premier)</p>
          </div>
        </div>

        <div className="filter-row" style={{ flexWrap: 'wrap' }}>
          <span className="filter-label">Pays</span>
          <select value={pays} onChange={e => updateParam('pays', e.target.value)}>
            <option value="">Tous</option>
            {PAYS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>

          <DatePicker
            label="Date début"
            value={dateDebut}
            onChange={v => { setDateDebut(v); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }) }}
            maxDate={dateFin ?? undefined}
            slotProps={{
              textField: {
                size: 'small',
                style: { width: 160 },
                slotProps: {
                  input: { style: { color: '#f1e9dc', fontSize: 13 } },
                  inputLabel: { style: { color: '#a89881', fontSize: 13 } },
                },
              },
            }}
          />

          <DatePicker
            label="Date fin"
            value={dateFin}
            onChange={v => { setDateFin(v); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }) }}
            minDate={dateDebut ?? undefined}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                size: 'small',
                style: { width: 160 },
                slotProps: {
                  input: { style: { color: '#f1e9dc', fontSize: 13 } },
                  inputLabel: { style: { color: '#a89881', fontSize: 13 } },
                },
              },
            }}
          />

          {(dateDebut || dateFin) && (
            <button
              className="btn-ghost"
              onClick={() => { setDateDebut(null); setDateFin(null); setSearchParams(pays ? { pays } : {}) }}
              style={{ marginLeft: 4 }}
            >
              Effacer dates
            </button>
          )}

          {!loading && !error && (
            <span className="count-pill">
              {lotsFiltres.length} lot{lotsFiltres.length > 1 ? 's' : ''}
              {(dateDebut || dateFin) && lotsFiltres.length !== lotsSansFiltreDate.length && (
                <> / {lotsSansFiltreDate.length} au total</>
              )}
            </span>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading"><span className="spinner" />Chargement…</div>
        ) : lotsFiltres.length === 0 ? (
          <div className="empty">Aucun lot disponible.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Exploitation</th>
                    <th>Entrepôt</th>
                    <th>Date stockage</th>
                    <th>Ancienneté</th>
                    <th>Dernière mesure</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lotsPage.map(lot => (
                    <tr
                      key={lot.id}
                      className={`row-${lot.statut} clickable`}
                      onClick={() => navigate(`/lots/${lot.pays || 'bresil'}/${lot.id}`)}
                    >
                      <td className="lot-id">{lot.id}</td>
                      <td>{lot.exploitation}</td>
                      <td className="cell-muted">{lot.entrepot_id}</td>
                      <td className="mono">{new Date(lot.date_stockage).toLocaleDateString('fr-FR')}</td>
                      <td className="cell-muted">{anciennete(lot.date_stockage)}</td>
                      <td className="cell-mono">
                        {formatDerniereMesure(dernieresMesures.get(lot.id) || dernieresMesures.get(lot.entrepot_id))}
                      </td>
                      <td><StatutBadge statut={lot.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-ghost"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  ← Précédent
                </button>
                <span className="pagination-info">
                  Page {page} / {totalPages}
                </span>
                <button
                  className="btn-ghost"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </LocalizationProvider>
  )
}

function anciennete(dateStr: string): string {
  const j = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (j < 30) return `${j} j`
  if (j < 365) return `${Math.floor(j / 30)} mois`
  return `${Math.floor(j / 365)} an${j >= 730 ? 's' : ''}`
}

function formatDerniereMesure(m: Mesure | undefined): string {
  if (!m) return '—'
  const date = new Date(m.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  return `${m.temperature.toFixed(0)}°C · ${m.humidity.toFixed(0)}% — ${date}`
}
