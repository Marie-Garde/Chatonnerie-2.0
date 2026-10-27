<script setup lang="ts">
import CopyField from '@/components/ui/CopyField.vue'

const connectorUrl = `${window.location.origin}/api/mcp`

const projectInstructions = `Ce projet est notre espace de thérapie de couple, relié à Chatonnerie.

- Au début de chaque conversation, appelle get_context avant de répondre.
- Si je t'annonce le sujet ("on va parler de…"), retrouve le tag correspondant et relis les séances passées sur ce sujet avant d'aller plus loin.
- Pose des questions ouvertes, reformule, aide-moi à mettre des mots sur ce que je ressens et sur ce dont j'ai besoin. Ne prends pas parti.
- Si on fait une séance à deux, rappelle-nous de commencer chaque message par notre prénom.
- Quand je te dis "enregistre la séance", rédige un compte-rendu détaillé avec save_session : résumé, ressentis et besoins, citations importantes mot pour mot, questions ouvertes et pistes.`

const permissions = [
  { group: 'Outils en lecture seule', advice: 'Toujours autoriser', why: 'Claude lit le contexte et les anciennes séances sans t’interrompre.' },
  { group: 'Enregistrer la séance', advice: 'Toujours autoriser', why: 'Tu le demandes toi-même, et ça arrive en brouillon.' },
  { group: 'Modifier une séance', advice: 'Nécessite une approbation', why: 'Tu vois ce qu’il change avant que ce soit écrit.' },
]
</script>

<template>
  <div class="tutorial">
    <RouterLink :to="{ name: 'therapy' }" class="back-link">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Thérapie
    </RouterLink>

    <header class="page-header">
      <p class="eyebrow">Tuto</p>
      <h1 class="title">Relier ton compte à Claude</h1>
      <p class="subtitle">
        Une fois relié, ton Claude peut lire vos séances et enregistrer ses comptes-rendus ici, sans copier-coller. Compte
        cinq minutes.
      </p>
    </header>

    <ol class="steps">
      <li class="card step">
        <span class="step-index">1</span>
        <div class="step-body">
          <h2 class="step-title">Ajoute le connecteur</h2>
          <p>
            Sur <strong>claude.ai</strong> ou dans l'application de bureau, ouvre <strong>Paramètres → Connecteurs</strong>
            puis <strong>Ajouter un connecteur personnalisé</strong>.
          </p>
          <div class="fields">
            <div class="field">
              <span class="label">Nom</span>
              <CopyField value="Chatonnerie" />
            </div>
            <div class="field">
              <span class="label">URL du serveur</span>
              <CopyField :value="connectorUrl" />
            </div>
          </div>
          <p class="hint">Laisse les paramètres avancés vides.</p>
        </div>
      </li>

      <li class="card step">
        <span class="step-index">2</span>
        <div class="step-body">
          <h2 class="step-title">Connecte-toi et autorise</h2>
          <p>
            Clique sur <strong>Se connecter</strong> à côté du connecteur. Tu arrives sur Chatonnerie : connecte-toi si besoin,
            vérifie que c'est bien ton compte, puis clique sur <strong>Autoriser</strong>.
          </p>
          <p class="note">
            Ton Claude n'a accès qu'à ce que tu vois sur le site : tes séances, les séances à deux et celles que l'autre a
            choisi de partager. Jamais ses séances privées.
          </p>
        </div>
      </li>

      <li class="card step">
        <span class="step-index">3</span>
        <div class="step-body">
          <h2 class="step-title">Règle les autorisations</h2>
          <p>Toujours dans Paramètres → Connecteurs → Chatonnerie, on te conseille :</p>
          <ul class="permissions">
            <li v-for="item in permissions" :key="item.group">
              <span class="permission-group">{{ item.group }}</span>
              <span class="chip" :class="{ 'chip-secondary': item.advice !== 'Toujours autoriser' }">{{ item.advice }}</span>
              <span class="permission-why">{{ item.why }}</span>
            </li>
          </ul>
        </div>
      </li>

      <li class="card step">
        <span class="step-index">4</span>
        <div class="step-body">
          <h2 class="step-title">Crée un projet « Thérapie »</h2>
          <p>
            Dans Claude, crée un projet et colle ces instructions. Fais ensuite toutes tes séances dans ce projet : Claude
            repartira toujours de ce qui a déjà été dit.
          </p>
          <CopyField :value="projectInstructions" multiline />
        </div>
      </li>

      <li class="card step">
        <span class="step-index">5</span>
        <div class="step-body">
          <h2 class="step-title">Fais ta première séance</h2>
          <ul class="tips">
            <li>
              Vérifie que le connecteur Chatonnerie est activé dans la conversation (menu des outils, à côté de la zone de
              saisie). Sur téléphone, c'est le même menu.
            </li>
            <li>Annonce le sujet si tu le connais : <em>« Aujourd'hui je voudrais parler de la belle-famille. »</em></li>
            <li>Parle librement. Il n'y a pas de bonne façon de faire.</li>
            <li>À la fin : <em>« Enregistre la séance. »</em></li>
            <li>
              Le compte-rendu apparaît ici en <strong>brouillon</strong>. Relis-le, corrige-le si besoin, puis publie-le. C'est
              toi qui choisis s'il est partagé.
            </li>
          </ul>
        </div>
      </li>

      <li class="card step">
        <span class="step-index">6</span>
        <div class="step-body">
          <h2 class="step-title">Pour une séance à deux</h2>
          <p>
            Asseyez-vous ensemble devant le Claude de l'un de vous et annoncez-le dès le début :
            <em>« On fait une séance à deux. On commencera chaque message par notre prénom. »</em> Claude laisse alors de côté
            les séances privées du compte utilisé, et le compte-rendu est visible et modifiable par vous deux.
          </p>
        </div>
      </li>
    </ol>

    <section class="card help">
      <h2 class="section-title">Retirer l'accès</h2>
      <p class="muted">
        Dans Claude, Paramètres → Connecteurs → Chatonnerie → <strong>Déconnecter</strong>. Tes séances restent sur le site.
      </p>
    </section>
  </div>
</template>

<style scoped>
.tutorial {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 820px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  gap: 18px;
}

.step-index {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 16px;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.step-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
}

.step-body p {
  color: var(--text-muted);
}

.step-body strong,
.step-body em {
  color: var(--text);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--secondary-soft);
  border: 1px solid rgba(var(--secondary-rgb), 0.25);
  font-size: 14px;
}

.permissions {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border);
}

.permissions li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.permission-group {
  font-weight: 600;
}

.permission-why {
  grid-column: 1 / -1;
  font-size: 13px;
  color: var(--text-muted);
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 18px;
  color: var(--text-muted);
}

.tips li::marker {
  color: var(--accent);
}

.help .muted {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.help strong {
  color: var(--text);
}

@media (max-width: 600px) {
  .step {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
