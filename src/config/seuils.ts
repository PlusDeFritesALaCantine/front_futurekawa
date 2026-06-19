import type { Pays } from '../types'

export type MesureType = 'temperature' | 'humidity'

interface Seuil { ideal: number; tolerance: number }

export const SEUILS: Record<Pays, Record<MesureType, Seuil>> = {
  bresil:   { temperature: { ideal: 29, tolerance: 3 }, humidity: { ideal: 55, tolerance: 2 } },
  equateur: { temperature: { ideal: 31, tolerance: 3 }, humidity: { ideal: 60, tolerance: 2 } },
  colombie: { temperature: { ideal: 26, tolerance: 3 }, humidity: { ideal: 80, tolerance: 2 } },
}

export function getSeuil(pays: Pays, type: MesureType) {
  const { ideal, tolerance } = SEUILS[pays][type]
  return { ideal, min: ideal - tolerance, max: ideal + tolerance }
}
