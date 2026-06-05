const BACKEND_URL = 'http://127.0.0.1:8002';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return response.json();
}

function renderHealth(data) {
  const status = data?.status === 'ok' ? 'OK' : 'Indisponible';
  document.getElementById('healthCard').innerHTML = `
    <strong>Backend:</strong> ${status}<br/>
    <span class="small">Source: ${BACKEND_URL}/health</span>
  `;
}

function renderPays(data) {
  const list = document.getElementById('paysList');
  list.innerHTML = '';
  data.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.nom}</strong> — ${item.url}`;
    list.appendChild(li);
  });
}

function renderDashboard(data) {
  const summary = document.getElementById('dashboardSummary');
  const cards = document.getElementById('dashboardCards');
  const items = Array.isArray(data?.pays) ? data.pays : [];

  summary.innerHTML = `
    <div class="summary-item">Pays analysés : <strong>${items.length}</strong></div>
    <div class="summary-item">Lots total : <strong>${items.reduce((sum, item) => sum + (item.nb_lots || 0), 0)}</strong></div>
    <div class="summary-item">Alertes total : <strong>${items.reduce((sum, item) => sum + (item.nb_alertes || 0), 0)}</strong></div>
  `;

  cards.innerHTML = items.map((item) => `
    <article class="card">
      <h3>${item.nom}</h3>
      <p class="badge">${item.status}</p>
      <p class="small">Lots : ${item.nb_lots ?? '—'}</p>
      <p class="small">Alertes : ${item.nb_alertes ?? '—'}</p>
      <p class="small">Dernière mesure : ${item.derniere_mesure ? JSON.stringify(item.derniere_mesure) : 'Aucune donnée'}</p>
    </article>
  `).join('');
}

async function loadDashboard() {
  try {
    const [health, pays, dashboard] = await Promise.all([
      fetchJson(`${BACKEND_URL}/health`),
      fetchJson(`${BACKEND_URL}/pays`),
      fetchJson(`${BACKEND_URL}/dashboard`),
    ]);

    renderHealth(health);
    renderPays(pays);
    renderDashboard(dashboard);
  } catch (error) {
    document.getElementById('healthCard').textContent = `Impossible de charger le dashboard : ${error.message}`;
    document.getElementById('dashboardSummary').textContent = 'Vérifiez que le backend est lancé.';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
  loadDashboard();
});
