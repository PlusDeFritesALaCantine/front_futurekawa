export type Pays = 'bresil' | 'equateur' | 'colombie'

export type LotStatut = 'conforme' | 'en_alerte' | 'perime'

export type Statut = LotStatut | 'ok' | 'indisponible'

export interface Lot {
  id: string
  pays: string
  exploitation: string
  entrepot_id: string
  date_stockage: string
  statut: LotStatut
}

export interface Mesure {
  id: string
  entrepot_id: string
  lot_id?: string
  temperature: number
  humidity: number
  timestamp: string
}

export interface AlerteLot {
  lot: Lot
  raison: string
}

export interface AlerteMesure {
  mesure: Mesure
  raison: string
  severite: 'bas' | 'critique'
}

export interface AlertesResponse {
  lots_problematiques: AlerteLot[]
  mesures_hors_seuil: AlerteMesure[]
}

export interface PaysSummary {
  nom: string
  status: 'ok' | 'indisponible'
  nb_lots: number | null
  nb_alertes: number | null
  derniere_mesure: Mesure | null
}

export interface DashboardResponse {
  pays: PaysSummary[]
}

/** Enveloppe de pagination renvoyée par les endpoints bornés de l'API. */
export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface ParametresPays {
  slug: Pays
  nom: string
  temperature_ideale: number
  temperature_tolerance: number
  humidite_ideale: number
  humidite_tolerance: number
  peremption_jours: number
  email_responsable: string
  alertes_actives: boolean
}

export type AlerteType = 'temperature' | 'humidite' | 'peremption'
export type AlerteStatut = 'ouverte' | 'acquittee' | 'resolue'

/** Alerte persistée, avec son cycle de vie (cf. table `alertes` de l'API pays). */
export interface AlerteJournal {
  id: string
  pays: string
  entrepot_id: string
  lot_id: string | null
  mesure_id: string | null
  type: AlerteType
  severite: 'bas' | 'critique'
  message: string
  declenchee_le: string | null
  email_envoye_le: string | null
  acquittee_le: string | null
  acquittee_par: string | null
  resolue_le: string | null
}

export function statutAlerte(a: AlerteJournal): AlerteStatut {
  if (a.resolue_le) return 'resolue'
  return a.acquittee_le ? 'acquittee' : 'ouverte'
}
