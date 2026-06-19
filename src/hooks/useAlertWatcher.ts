import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import type { AlertesResponse, DashboardResponse, Pays } from '../types'

const PAYS: Pays[] = ['bresil', 'equateur', 'colombie']
const POLL_INTERVAL_MS = 15000
const STALE_THRESHOLD_MS = 5 * 60 * 1000

type PaysHealth = 'ok' | 'indisponible' | 'stale'

export interface AlertToast {
  id: string
  kind: 'lot' | 'mesure' | 'indisponible' | 'stale'
  pays: Pays
  title: string
  message: string
}

export function useAlertWatcher() {
  const [toasts, setToasts] = useState<AlertToast[]>([])
  const knownKeys = useRef<Set<string> | null>(null)
  const paysHealth = useRef<Map<Pays, PaysHealth>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function pollAlertes() {
      const isFirstRun = knownKeys.current === null
      const seen = knownKeys.current ?? new Set<string>()
      const fresh: AlertToast[] = []

      await Promise.allSettled(
        PAYS.map(async pays => {
          const { data } = await api.get<AlertesResponse>(`/pays/${pays}/alertes`)

          for (const { lot, raison } of data.lots_problematiques ?? []) {
            const key = `lot-${pays}-${lot.id}`
            if (!seen.has(key)) {
              seen.add(key)
              if (!isFirstRun) {
                fresh.push({
                  id: key,
                  kind: 'lot',
                  pays,
                  title: `Lot ${lot.id} en alerte`,
                  message: raison,
                })
              }
            }
          }

          for (const { mesure, raison } of data.mesures_hors_seuil ?? []) {
            const key = `mesure-${pays}-${mesure.id}`
            if (!seen.has(key)) {
              seen.add(key)
              if (!isFirstRun) {
                fresh.push({
                  id: key,
                  kind: 'mesure',
                  pays,
                  title: `Mesure hors seuil — ${mesure.entrepot_id}`,
                  message: raison,
                })
              }
            }
          }
        })
      )

      if (cancelled) return
      knownKeys.current = seen
      if (fresh.length > 0) {
        setToasts(prev => [...prev, ...fresh])
      }
    }

    async function pollSante() {
      let dashboard: DashboardResponse
      try {
        const { data } = await api.get<DashboardResponse>('/dashboard')
        dashboard = data
      } catch {
        return
      }
      if (cancelled) return

      const fresh: AlertToast[] = []

      for (const p of dashboard.pays ?? []) {
        const pays = p.nom as Pays
        const previous = paysHealth.current.get(pays)

        let health: PaysHealth
        if (p.status === 'indisponible') {
          health = 'indisponible'
        } else if (
          !p.derniere_mesure ||
          Date.now() - new Date(p.derniere_mesure.timestamp).getTime() > STALE_THRESHOLD_MS
        ) {
          health = 'stale'
        } else {
          health = 'ok'
        }

        if (health !== previous) {
          paysHealth.current.set(pays, health)
          if (health === 'indisponible') {
            fresh.push({
              id: `health-${pays}-${Date.now()}`,
              kind: 'indisponible',
              pays,
              title: `API ${pays} indisponible`,
              message: 'Impossible de joindre le backend pays — données non remontées au siège.',
            })
          } else if (health === 'stale') {
            fresh.push({
              id: `health-${pays}-${Date.now()}`,
              kind: 'stale',
              pays,
              title: `Aucune donnée récente — ${pays}`,
              message: p.derniere_mesure
                ? 'Le capteur ne remonte plus de mesure depuis plus de 5 minutes.'
                : 'Aucune mesure n\'a encore été reçue pour ce pays.',
            })
          }
        }
      }

      if (fresh.length > 0) {
        setToasts(prev => [...prev, ...fresh])
      }
    }

    async function poll() {
      // séquentiel plutôt qu'en parallèle : évite de cumuler les appels
      // vers les pays simulés injoignables, qui ralentissent le backend
      await pollAlertes()
      await pollSante()
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, dismiss }
}
