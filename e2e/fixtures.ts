import type { Page } from '@playwright/test'

const API = 'http://127.0.0.1:8002'

export const LOTS_BRESIL = [
  { id: 'LOT-BR-002', pays: 'bresil', exploitation: 'Fazenda Rio Verde', entrepot_id: 'entrepot-bresil-1', date_stockage: '2025-05-01', statut: 'perime' },
  { id: 'LOT-BR-001', pays: 'bresil', exploitation: 'Fazenda Santa Clara', entrepot_id: 'entrepot-bresil-1', date_stockage: '2025-12-10', statut: 'conforme' },
]

export const MESURES_BRESIL = [
  { id: 'M-1', entrepot_id: 'entrepot-bresil-1', temperature: 29.0, humidity: 55.0, timestamp: '2025-12-11T08:00:00Z' },
  { id: 'M-2', entrepot_id: 'entrepot-bresil-1', temperature: 33.5, humidity: 55.0, timestamp: '2025-12-12T08:00:00Z' },
]

export const ALERTES_BRESIL = {
  lots_problematiques: [
    { lot: LOTS_BRESIL[0], raison: 'lot périmé (400 jours de stockage)' },
  ],
  mesures_hors_seuil: [
    { mesure: MESURES_BRESIL[1], raison: 'température 33.5°C hors seuil [26.0-32.0°C]' },
  ],
}

export const DASHBOARD_RESPONSE = {
  pays: [
    { nom: 'bresil', status: 'ok', nb_lots: 2, nb_alertes: 2, derniere_mesure: MESURES_BRESIL[1] },
    { nom: 'equateur', status: 'ok', nb_lots: 0, nb_alertes: 0, derniere_mesure: null },
    { nom: 'colombie', status: 'ok', nb_lots: 0, nb_alertes: 0, derniere_mesure: null },
  ],
}

export async function mockApi(page: Page) {
  await page.route(`${API}/dashboard`, route => route.fulfill({ json: DASHBOARD_RESPONSE }))

  await page.route(`${API}/pays/*/lots`, route => {
    const pays = new URL(route.request().url()).pathname.split('/')[2]
    route.fulfill({ json: pays === 'bresil' ? LOTS_BRESIL : [] })
  })

  await page.route(`${API}/pays/*/mesures*`, route => {
    const pays = new URL(route.request().url()).pathname.split('/')[2]
    route.fulfill({ json: pays === 'bresil' ? MESURES_BRESIL : [] })
  })

  await page.route(`${API}/pays/*/alertes`, route => {
    const pays = new URL(route.request().url()).pathname.split('/')[2]
    route.fulfill({ json: pays === 'bresil' ? ALERTES_BRESIL : { lots_problematiques: [], mesures_hors_seuil: [] } })
  })
}
