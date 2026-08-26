import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

// Couvre le parcours métier du cahier des charges (III.3) : sélection d'un pays,
// liste des lots triée FIFO, consultation d'un lot et de ses courbes, accès aux alertes.

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('dashboard affiche la vue consolidée des 3 pays', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.locator('.ccard .ccard-name')).toHaveText(['bresil', 'equateur', 'colombie'])
})

test('sélection d\'un pays depuis le dashboard mène à ses lots triés FIFO', async ({ page }) => {
  await page.goto('/')

  await page.locator('.ccard', { hasText: 'bresil' }).click()
  await expect(page).toHaveURL(/\/lots\?pays=bresil/)

  const rows = page.locator('table tbody tr')
  await expect(rows).toHaveCount(2)
  // FIFO : le lot le plus ancien (LOT-BR-002, 2025-05-01) doit apparaître avant LOT-BR-001 (2025-12-10).
  await expect(rows.nth(0)).toContainText('LOT-BR-002')
  await expect(rows.nth(1)).toContainText('LOT-BR-001')
  await expect(rows.nth(0)).toContainText('Périmé')
})

test('changer de pays sur la page Lots recharge la liste filtrée', async ({ page }) => {
  await page.goto('/lots')

  await page.getByRole('combobox').selectOption('equateur')
  await expect(page.getByText('Aucun lot disponible.')).toBeVisible()

  await page.getByRole('combobox').selectOption('bresil')
  await expect(page.locator('table tbody tr')).toHaveCount(2)
})

test('consultation d\'un lot affiche ses courbes température/humidité', async ({ page }) => {
  await page.goto('/lots?pays=bresil')

  await page.locator('table tbody tr', { hasText: 'LOT-BR-001' }).click()
  await expect(page).toHaveURL(/\/lots\/bresil\/LOT-BR-001/)

  await expect(page.getByRole('heading', { name: 'LOT-BR-001' })).toBeVisible()
  await expect(page.getByText(/Température.*seuils/)).toBeVisible()
  await expect(page.getByText(/Humidité.*seuils/)).toBeVisible()
  // Chart.js dessine sur un <canvas> par graphique.
  await expect(page.locator('.chart-card canvas')).toHaveCount(2)

  await page.getByText('← Retour aux lots').click()
  await expect(page).toHaveURL(/\/lots\?pays=bresil/)
})

test('page Alertes affiche les lots périmés et mesures hors seuil', async ({ page }) => {
  await page.goto('/alertes')

  await expect(page.getByText('Lots problématiques (1)')).toBeVisible()
  await expect(page.getByText('Mesures hors seuil (1)')).toBeVisible()
  await expect(page.getByText('lot périmé (400 jours de stockage)')).toBeVisible()
  await expect(page.getByText('température 33.5°C hors seuil [26.0-32.0°C]')).toBeVisible()

  await page.getByRole('combobox').selectOption('colombie')
  await expect(page.getByText('Aucun lot périmé.')).toBeVisible()
  await expect(page.getByText('Aucune mesure hors seuil.')).toBeVisible()
})

test('la navigation latérale couvre les 4 sections principales', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Lots' }).click()
  await expect(page).toHaveURL(/\/lots/)

  await page.getByRole('link', { name: 'Alertes' }).click()
  await expect(page).toHaveURL(/\/alertes/)

  await page.getByRole('link', { name: 'Automatisation' }).click()
  await expect(page).toHaveURL(/\/automatisation/)
  await expect(page.getByRole('heading', { name: 'Automatisation des entrepôts' })).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page).toHaveURL(/\/$/)
})
