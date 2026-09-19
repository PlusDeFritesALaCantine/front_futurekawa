import { useEffect, useState } from 'react'
import api from '../api/client'
import type { Pays, ParametresPays } from '../types'
import { appliquerParametres } from '../config/seuils'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']

/** Champs numériques éditables, avec leur libellé et leur unité. */
const CHAMPS_NUM: { cle: keyof ParametresPays; label: string; unite: string; pas: number }[] = [
  { cle: 'temperature_ideale', label: 'Température idéale', unite: '°C', pas: 0.5 },
  { cle: 'temperature_tolerance', label: 'Tolérance température', unite: '± °C', pas: 0.5 },
  { cle: 'humidite_ideale', label: 'Humidité idéale', unite: '%', pas: 0.5 },
  { cle: 'humidite_tolerance', label: 'Tolérance humidité', unite: '± %', pas: 0.5 },
  { cle: 'peremption_jours', label: 'Péremption', unite: 'jours', pas: 1 },
]

export default function Parametres() {
  const [pays, setPays] = useState<Pays>('bresil')
  const [valeurs, setValeurs] = useState<ParametresPays | null>(null)
  const [brouillon, setBrouillon] = useState<Partial<ParametresPays>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  useEffect(() => {
    let vivant = true
    setLoading(true)
    setError(null)
    setSucces(null)
    setBrouillon({})
    api.get<ParametresPays>(`/pays/${pays}/parametres`)
      .then(r => {
        if (!vivant) return
        setValeurs(r.data)
        appliquerParametres(r.data)
      })
      .catch(() => { if (vivant) setError(`Paramètres ${pays} indisponibles.`) })
      .finally(() => { if (vivant) setLoading(false) })
    return () => { vivant = false }
  }, [pays])

  // Seuls les champs réellement modifiés partent dans le PATCH : l'API fusionne
  // (exclude_unset), donc envoyer l'objet complet écraserait inutilement le reste.
  function modifier<K extends keyof ParametresPays>(cle: K, valeur: ParametresPays[K]) {
    setSucces(null)
    setBrouillon(b => ({ ...b, [cle]: valeur }))
  }

  const modifie = Object.keys(brouillon).length > 0

  function enregistrer() {
    if (!modifie) return
    setSaving(true)
    setError(null)
    api.patch<ParametresPays>(`/pays/${pays}/parametres`, brouillon)
      .then(r => {
        setValeurs(r.data)
        appliquerParametres(r.data)
        setBrouillon({})
        setSucces('Paramètres enregistrés. Ils s’appliquent dès le prochain cycle d’évaluation.')
      })
      .catch(err => {
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Enregistrement impossible.')
      })
      .finally(() => setSaving(false))
  }

  function valeurCourante<K extends keyof ParametresPays>(cle: K): ParametresPays[K] | undefined {
    return (brouillon[cle] ?? valeurs?.[cle]) as ParametresPays[K] | undefined
  }

  const tempIdeale = Number(valeurCourante('temperature_ideale') ?? 0)
  const tempTol = Number(valeurCourante('temperature_tolerance') ?? 0)
  const humIdeale = Number(valeurCourante('humidite_ideale') ?? 0)
  const humTol = Number(valeurCourante('humidite_tolerance') ?? 0)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-sub">
            Seuils de conservation, péremption et destinataire des alertes, par pays
          </p>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Pays</span>
        <select value={pays} onChange={e => setPays(e.target.value as Pays)}>
          {PAYS.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {succes && <div className="empty" style={{ marginBottom: 16 }}>{succes}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" />Chargement…</div>
      ) : !valeurs ? (
        <div className="empty">Aucun paramétrage disponible.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Paramètre</th><th>Valeur</th><th>Unité</th></tr>
              </thead>
              <tbody>
                {CHAMPS_NUM.map(({ cle, label, unite, pas }) => (
                  <tr key={String(cle)}>
                    <td>{label}</td>
                    <td>
                      <input
                        type="number"
                        step={pas}
                        min={0}
                        aria-label={label}
                        value={String(valeurCourante(cle) ?? '')}
                        onChange={e => modifier(cle, Number(e.target.value) as never)}
                        style={{ width: 110 }}
                      />
                    </td>
                    <td className="cell-muted">{unite}</td>
                  </tr>
                ))}
                <tr>
                  <td>Destinataire des alertes</td>
                  <td>
                    <input
                      type="email"
                      aria-label="Destinataire des alertes"
                      value={String(valeurCourante('email_responsable') ?? '')}
                      onChange={e => modifier('email_responsable', e.target.value)}
                      style={{ width: 280 }}
                    />
                  </td>
                  <td className="cell-muted">e-mail</td>
                </tr>
                <tr>
                  <td>Envoi des e-mails d’alerte</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label="Envoi des e-mails d’alerte"
                      checked={Boolean(valeurCourante('alertes_actives'))}
                      onChange={e => modifier('alertes_actives', e.target.checked)}
                    />
                  </td>
                  <td className="cell-muted">
                    {valeurCourante('alertes_actives') ? 'actif' : 'suspendu'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="empty" style={{ marginTop: 16, textAlign: 'left' }}>
            Plage tolérée après enregistrement :{' '}
            <b>{(tempIdeale - tempTol).toFixed(1)}–{(tempIdeale + tempTol).toFixed(1)}°C</b>
            {' · '}
            <b>{(humIdeale - humTol).toFixed(1)}–{(humIdeale + humTol).toFixed(1)}%</b>
            . Au-delà du double de la tolérance, l’alerte passe en <b>critique</b>.
          </div>

          <div className="pagination" style={{ justifyContent: 'flex-start', gap: 12 }}>
            <button className="btn-primary" disabled={!modifie || saving} onClick={enregistrer}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              className="btn-ghost"
              disabled={!modifie || saving}
              onClick={() => { setBrouillon({}); setSucces(null) }}
            >
              Annuler
            </button>
            {modifie && (
              <span className="cell-muted">
                {Object.keys(brouillon).length} champ(s) modifié(s), non enregistré(s)
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
