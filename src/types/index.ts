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
