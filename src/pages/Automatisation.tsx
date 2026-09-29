export default function Automatisation() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Automatisation des entrepôts</h1>
          <p className="page-sub">Phase 2 — Prototype de schéma de fonctionnement et questionnaire de cadrage</p>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 0 }}>Logique de fonctionnement envisagée</div>
      <div className="flow">
        <div className="flow-box">
          <h4>Capteurs</h4>
          <p>Température / humidité — module IoT existant</p>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-box">
          <h4>Traitement / décision</h4>
          <p>Comparaison aux seuils pays, tolérance, hystérésis anti-oscillation</p>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-box">
          <h4>Actionneurs</h4>
          <div className="actuators">
            <div className="actuator-tag">Chauffage</div>
            <div className="actuator-tag">Humidification</div>
            <div className="actuator-tag">Aération</div>
          </div>
        </div>
      </div>

      <div className="safety-box">
        <h4>Sécurités transverses</h4>
        <ul>
          <li>Seuils absolus de coupure (au-delà des tolérances pays), arrêt forcé indépendant de la logique normale</li>
          <li>Bascule manuel / automatique prioritaire au manuel, accessible localement par le responsable d'entrepôt</li>
          <li>Arrêt d'urgence logique en cas de perte de connexion capteurs/MQTT (mode sûr par défaut)</li>
          <li>Journalisation de chaque commande (horodatage, déclencheur, valeur mesurée) pour audit</li>
        </ul>
      </div>

      <div className="section-label" style={{ marginTop: 0 }}>Cas nominal / cas dégradé</div>
      <div className="case-grid">
        <div className="case-card nominal">
          <h4>Cas nominal</h4>
          <p>La mesure reste dans la tolérance définie pour le pays. Aucune commande n'est envoyée aux actionneurs ; les relevés continuent d'alimenter l'historique et le dashboard.</p>
        </div>
        <div className="case-card degrade">
          <h4>Cas dégradé</h4>
          <p>La mesure dépasse la tolérance. Le système déclenche l'actionneur correspondant, attend une stabilisation avant nouvelle évaluation, et lève l'alerte existante (email au responsable d'exploitation) si la dérive persiste au-delà d'un délai défini.</p>
        </div>
      </div>

      <div className="integration-box">
        <h4>Point d'intégration avec la solution IoT existante</h4>
        <ul>
          <li>Réutilisation des capteurs et topics MQTT déjà en place pour les relevés température/humidité.</li>
          <li>Ajout d'un topic de commande dédié par entrepôt (ex. <code>pays/entrepot/actionneurs/commande</code>) consommé par les futurs équipements.</li>
          <li>Un orchestrateur (ex. Node-RED) s'abonne aux mesures, applique les règles de décision, et publie les commandes — sans modifier le backend pays existant.</li>
          <li>Les commandes envoyées sont historisées dans la même base SQL que les mesures, pour rester cohérent avec la traçabilité déjà exigée.</li>
        </ul>
      </div>

      <div className="section-label" style={{ marginTop: 0 }}>Questionnaire de cadrage — interview Phase 2</div>
      <p className="automatisation-intro">
        À utiliser lors de la prochaine interview avec FutureKawa pour préciser le périmètre de l'automatisation des entrepôts.
      </p>
      <div className="quest-grid">
        {QUESTIONNAIRE.map(section => (
          <div key={section.titre} className="quest-card">
            <h5>{section.titre}</h5>
            <ol>
              {section.questions.map(q => <li key={q}>{q}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}

const QUESTIONNAIRE = [
  {
    titre: 'Objectifs métier de l\'automatisation',
    questions: [
      'Quel est le bénéfice attendu en priorité : réduction des pertes, baisse de la charge des équipes terrain, ou les deux ?',
      'L\'automatisation doit-elle couvrir tous les entrepôts dès le départ, ou un déploiement pilote sur un site est-il préférable ?',
      'Existe-t-il des objectifs chiffrés (ex. % de réduction des non-conformités) à atteindre pour valider la phase 2 ?',
    ],
  },
  {
    titre: 'Contraintes (sécurité, maintenance, coûts, responsabilités)',
    questions: [
      'Qui sera responsable de la maintenance des équipements (chauffage, humidification, aération) sur chaque site ?',
      'Quelles normes de sécurité électrique/incendie s\'appliquent aux entrepôts et doivent contraindre le choix des actionneurs ?',
      'Quel budget est envisagé par entrepôt pour l\'équipement et son raccordement électrique ?',
      'En cas de dysfonctionnement d\'un actionneur, qui est responsable contractuellement d\'une perte de lot ?',
    ],
  },
  {
    titre: 'Tolérances et modes manuel / automatique',
    questions: [
      'Les seuils de tolérance actuels (±3°C, ±2% humidité) doivent-ils être resserrés une fois l\'automatisation en place ?',
      'Le mode manuel doit-il rester accessible en permanence localement, ou seulement via une procédure d\'escalade ?',
      'Quelle durée de dérive tolérée avant déclenchement automatique d\'un actionneur ?',
    ],
  },
  {
    titre: 'Priorités de déploiement et indicateurs de réussite',
    questions: [
      'Quel pays/entrepôt doit servir de site pilote pour la première installation ?',
      'Quels indicateurs permettront de mesurer le succès du pilote avant généralisation (ex. nombre d\'alertes évitées) ?',
      'Quel calendrier est envisagé entre le pilote et le déploiement multi-pays ?',
    ],
  },
  {
    titre: 'Risques et scénarios d\'incident',
    questions: [
      'Que doit-il se passer en cas de coupure réseau/MQTT prolongée : arrêt des actionneurs ou maintien du dernier état ?',
      'Un actionneur qui s\'active en boucle sans effet sur la mesure doit-il déclencher une alerte spécifique ?',
      'Quelles modalités de test et de validation avant mise en production d\'un nouvel équipement automatisé ?',
    ],
  },
]
