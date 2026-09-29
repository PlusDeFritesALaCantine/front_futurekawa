import { useEffect, useState } from 'react'
import api from '../api/client'
import type { Pays, ParametresPays } from '../types'

export type MesureType = 'temperature' | 'humidity'

interface Seuil { ideal: number; tolerance: number }

/**
 * Repli utilisé tant que l'API n'a pas répondu (premier rendu, siège
 * injoignable). Ce n'est plus la source de vérité : celle-ci est la table
 * `pays` de l'API pays, modifiable depuis la page Paramètres et lue ici via
 * GET /pays/{pays}/parametres. Avant, ces valeurs étaient dupliquées dans
 * trois fichiers qui se contredisaient.
 */
const DEFAUTS: Record<Pays, Record<MesureType, Seuil>> = {
  bresil:   { temperature: { ideal: 29, tolerance: 3 }, humidity: { ideal: 55, tolerance: 2 } },
  equateur: { temperature: { ideal: 31, tolerance: 3 }, humidity: { ideal: 60, tolerance: 2 } },
  colombie: { temperature: { ideal: 26, tolerance: 3 }, humidity: { ideal: 80, tolerance: 2 } },
}

const cache: Partial<Record<Pays, Record<MesureType, Seuil>>> = {}

export function appliquerParametres(p: ParametresPays): void {
  cache[p.slug] = {
    temperature: { ideal: p.temperature_ideale, tolerance: p.temperature_tolerance },
    humidity: { ideal: p.humidite_ideale, tolerance: p.humidite_tolerance },
  }
}

export function getSeuil(pays: Pays, type: MesureType) {
  const { ideal, tolerance } = cache[pays]?.[type] ?? DEFAUTS[pays][type]
  return { ideal, min: ideal - tolerance, max: ideal + tolerance }
}

export async function chargerSeuils(pays: Pays): Promise<void> {
  const { data } = await api.get<ParametresPays>(`/pays/${pays}/parametres`)
  appliquerParametres(data)
}

const TOUS: Pays[] = ['bresil', 'equateur', 'colombie']

/**
 * Hydrate le cache des seuils et re-rend le composant une fois l'API répondue.
 * Sans pays, charge les trois (page Dashboard).
 */
export function useSeuils(pays?: Pays): void {
  const [, setVersion] = useState(0)

  useEffect(() => {
    let vivant = true
    const cibles = pays ? [pays] : TOUS
    Promise.allSettled(cibles.map(chargerSeuils)).then(() => {
      if (vivant) setVersion(v => v + 1)
    })
    return () => { vivant = false }
  }, [pays])
}
