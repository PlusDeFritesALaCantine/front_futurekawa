# front_futurekawa

Interface Web React pour le monitoring FutureKawa — dashboard consolidé, suivi des lots,
graphiques IoT, gestion des alertes et paramétrage métier.

Le front ne s'adresse **qu'au siège** (`VITE_API_URL`), en lecture comme en écriture.

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
npx tsc --noEmit     # typage
npx vitest run       # 17 tests unitaires (composants, pages)
```

End-to-end (6 parcours Playwright). ⚠️ `npm run preview` sert le `dist/` **déjà construit** et
Vite fige `VITE_API_URL` **à la construction** : il faut donc reconstruire avec la même URL que
celle bouchonnée par `e2e/fixtures.ts`, sinon l'interception ne correspond plus et les tests
interrogent la vraie API.

```bash
VITE_API_URL=http://127.0.0.1:8002 npm run build
npx playwright test
```

## Pages

| Route                  | Description                                         |
|------------------------|-----------------------------------------------------|
| `/`                    | Dashboard — résumé de tous les pays                 |
| `/lots`                | Liste des lots FIFO avec statut coloré              |
| `/lots/:pays/:lotId`   | Détail d'un lot — graphiques température & humidité |
| `/lots/ajout`          | Création d'un lot (relayée par le siège)            |
| `/mesures`             | Historique des relevés — **pagination côté serveur** |
| `/alertes`             | Lots périmés, mesures hors seuil, et **journal des alertes** : prise en charge et clôture |
| `/parametres`          | Seuils, péremption et destinataire des alertes, par pays |

## Variables d'environnement

| Variable        | Description            | Défaut                   |
|-----------------|------------------------|--------------------------|
| `VITE_API_URL`  | URL du backend siège   | `http://localhost:8002`  |

> `VITE_API_URL` est **figée à la construction**, pas lue au démarrage du conteneur. La passer
> en variable d'environnement d'un pod nginx n'a aucun effet : c'est un `build-arg` du
> `Dockerfile` (et de la CI). Le manifeste Kubernetes qui la déclare en `env` est trompeur.

## Source des seuils

`src/config/seuils.ts` ne contient plus qu'un **repli** documenté. Les valeurs réelles
viennent de l'API (`GET /pays/{pays}/parametres`, table `pays`) et sont hydratées par le hook
`useSeuils()`. Avant, ces valeurs étaient une troisième copie divergente du cahier des charges.
