import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import type { Pays } from '../types'

const PAYS_LIST: Pays[] = ['bresil', 'equateur', 'colombie']

interface FormData {
  id: string
  pays: string
  exploitation: string
  entrepot_id: string
  date_stockage: string
}

const initial: FormData = {
  id: '',
  pays: '',
  exploitation: '',
  entrepot_id: '',
  date_stockage: new Date().toISOString().slice(0, 10),
}

export default function LotAjout() {
  const [form, setForm] = useState<FormData>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    api.post('/lots', form)
      .then(() => navigate(`/lots?pays=${form.pays}`))
      .catch(() => setError("Échec de la création du lot. Vérifiez les champs et réessayez."))
      .finally(() => setSubmitting(false))
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ajouter un lot</h1>
          <p className="page-sub">Créer un nouveau lot de stockage</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="lot-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            ID du lot
            <input
              type="text"
              required
              value={form.id}
              onChange={e => set('id', e.target.value)}
            />
          </label>

          <label>
            Pays
            <select
              required
              value={form.pays}
              onChange={e => set('pays', e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {PAYS_LIST.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label>
            Exploitation
            <input
              type="text"
              required
              value={form.exploitation}
              onChange={e => set('exploitation', e.target.value)}
            />
          </label>

          <label>
            Entrepôt ID
            <input
              type="text"
              required
              value={form.entrepot_id}
              onChange={e => set('entrepot_id', e.target.value)}
            />
          </label>

          <label>
            Date de stockage
            <input
              type="date"
              required
              value={form.date_stockage}
              onChange={e => set('date_stockage', e.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(-1)}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn"
            disabled={submitting}
          >
            {submitting ? 'Création…' : 'Créer le lot'}
          </button>
        </div>
      </form>
    </div>
  )
}
