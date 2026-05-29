# front_futurekawa

Interface Web React pour le monitoring FutureKawa — dashboard consolidé, suivi des lots, graphiques IoT et alertes.

## Prérequis

- Node.js 20+

## Développement local

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8002
npm run dev
```

Ouvre `http://localhost:5173`.

## Production (Podman)

```bash
cp .env.example .env
podman compose up --build
```

Disponible sur `http://localhost`.

## Tests

```bash
npm test
```

## Pages

| Route                  | Description                                         |
|------------------------|-----------------------------------------------------|
| `/`                    | Dashboard — résumé de tous les pays                 |
| `/lots`                | Liste des lots FIFO avec statut coloré              |
| `/lots/:pays/:lotId`   | Détail d'un lot — graphiques température & humidité |
| `/alertes`             | Lots périmés et mesures hors seuil                  |

## Variables d'environnement

| Variable        | Description            | Défaut                   |
|-----------------|------------------------|--------------------------|
| `VITE_API_URL`  | URL du backend siège   | `http://localhost:8002`  |
