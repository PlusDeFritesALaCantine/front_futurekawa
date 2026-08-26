import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import MesureChart from '../components/MesureChart'
import type { Lot, Mesure, Pays } from '../types'
import { getSeuil } from '../config/seuils'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']
const PAGE_SIZE = 30

export default function Mesures() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pays = (searchParams.get('pays') || 'bresil') as Pays
  const lotFilter = searchParams.get('lot') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [lots, setLots] = useState<Lot[]>([])
  const [mesures, setMesures] = useState<Mesure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateDebut, setDateDebut] = useState<Dayjs | null>(null)
  const [dateFin, setDateFin] = useState<Dayjs | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setDateDebut(null)
    setDateFin(null)
    Promise.all([
      api.get<Lot[]>(`/pays/${pays}/lots`),
      api.get<Mesure[]>(`/pays/${pays}/mesures`),
    ])
      .then(([lotsRes, mesuresRes]) => {
        setLots(lotsRes.data)
        setMesures(mesuresRes.data.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ))
      })
      .catch(() => setError(`API ${pays} indisponible`))
      .finally(() => setLoading(false))
  }, [pays])

  const mesuresFiltrees = useMemo(() => {
    let result = mesures

    if (lotFilter) {
      result = result.filter(m => m.lot_id === lotFilter || m.entrepot_id === lotFilter)
    }

    if (dateDebut) {
      const debut = dateDebut.startOf('day').toDate().getTime()
      result = result.filter(m => new Date(m.timestamp).getTime() >= debut)
    }

    if (dateFin) {
      const fin = dateFin.endOf('day').toDate().getTime()
      result = result.filter(m => new Date(m.timestamp).getTime() <= fin)
    }

    return result
  }, [mesures, lotFilter, dateDebut, dateFin])

  const totalPages = Math.ceil(mesuresFiltrees.length / PAGE_SIZE)
  const mesuresPage = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return mesuresFiltrees.slice(start, start + PAGE_SIZE)
  }, [mesuresFiltrees, page])

  const seuilTemp = getSeuil(pays, 'temperature')
  const seuilHum = getSeuil(pays, 'humidity')
  const paysLabel = pays.charAt(0).toUpperCase() + pays.slice(1)

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key === 'pays') next.delete('lot')
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams)
    next.set('pays', pays)
    if (lotFilter) next.set('lot', lotFilter)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const mesuresSansFiltreDate = useMemo(() => {
    let result = mesures
    if (lotFilter) {
      result = result.filter(m => m.lot_id === lotFilter || m.entrepot_id === lotFilter)
    }
    return result
  }, [mesures, lotFilter])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Mesures</h1>
            <p className="page-sub">Historique des relevés de température et humidité</p>
          </div>
        </div>

        <div className="filter-row" style={{ flexWrap: 'wrap' }}>
          <span className="filter-label">Pays</span>
          <select value={pays} onChange={e => updateParam('pays', e.target.value)}>
            {PAYS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>

          <span className="filter-label" style={{ marginLeft: 12 }}>Lot</span>
          <select value={lotFilter} onChange={e => updateParam('lot', e.target.value)}>
            <option value="">Tous les lots</option>
            {lots.map(l => (
              <option key={l.id} value={l.id}>{l.id} — {l.exploitation}</option>
            ))}
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
              onClick={() => { setDateDebut(null); setDateFin(null); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }) }}
              style={{ marginLeft: 4 }}
            >
              Effacer dates
            </button>
          )}

          {!loading && !error && (
            <span className="count-pill">
              {mesuresFiltrees.length} mesure{mesuresFiltrees.length > 1 ? 's' : ''}
              {(dateDebut || dateFin) && mesuresFiltrees.length !== mesuresSansFiltreDate.length && (
                <> / {mesuresSansFiltreDate.length} au total</>
              )}
            </span>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading"><span className="spinner" />Chargement…</div>
        ) : mesuresFiltrees.length === 0 ? (
          <div className="empty">Aucune mesure disponible pour cette période.</div>
        ) : (
          <>
            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-title">Température (°C) — <b>seuils {paysLabel} : {seuilTemp.min}–{seuilTemp.max}°C / idéal {seuilTemp.ideal}°C</b></div>
                <div className="chart-canvas-wrap">
                  <MesureChart mesures={mesuresFiltrees} type="temperature" pays={pays} />
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
                  <MesureChart mesures={mesuresFiltrees} type="humidity" pays={pays} />
                </div>
                <div className="chart-legend">
                  <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--gold)' }} />Humidité</div>
                  <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Max</div>
                  <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--green)', opacity: .7 }} />Idéal</div>
                  <div className="leg-item"><span className="leg-swatch" style={{ background: 'var(--red)', opacity: .7 }} />Min</div>
                </div>
              </div>
            </div>

            <div className="table-wrap" style={{ marginTop: 24 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Température</th>
                    <th>Humidité</th>
                    <th>Lot</th>
                    <th>Entrepôt</th>
                  </tr>
                </thead>
                <tbody>
                  {mesuresPage.map(m => {
                    const horsSeuilT = m.temperature < seuilTemp.min || m.temperature > seuilTemp.max
                    const horsSeuilH = m.humidity < seuilHum.min || m.humidity > seuilHum.max
                    return (
                      <tr key={m.id}>
                        <td className="cell-mono">
                          {new Date(m.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className={horsSeuilT ? 'cell-alert' : ''}>
                          {m.temperature.toFixed(1)}°C
                        </td>
                        <td className={horsSeuilH ? 'cell-alert' : ''}>
                          {m.humidity.toFixed(1)}%
                        </td>
                        <td className="cell-mono">{m.lot_id || '—'}</td>
                        <td className="cell-muted">{m.entrepot_id}</td>
                      </tr>
                    )
                  })}
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
