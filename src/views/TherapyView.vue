<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatSessionDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useSessionsStore } from '@/stores/sessions'

const auth = useAuthStore()
const couple = useCoupleStore()
const sessions = useSessionsStore()

const error = ref(false)

const countLabel = computed(() => {
  const count = sessions.sessions.length
  return `${count} séance${count > 1 ? 's' : ''}`
})

onMounted(async () => {
  try {
    await sessions.fetchAll()
  } catch {
    error.value = true
  }
})

const steps = [
  { title: 'Discutez avec Claude', text: 'Chacun dans son propre Claude, avec le connecteur Chatonnerie activé.' },
  { title: 'Enregistrez la séance', text: 'Claude rédige le compte-rendu et le dépose ici.' },
  { title: 'On avance ensemble', text: 'La séance suivante repart de tout ce qui a été dit.' },
]
</script>

<template>
  <div class="therapy">
    <header class="page-header">
      <p class="eyebrow">Thérapie</p>
      <h1 class="title">Un espace pour se comprendre</h1>
      <p class="subtitle">
        Vos séances, vos comptes-rendus et le dossier du couple, en attendant de pouvoir les apporter à un thérapeute.
      </p>
    </header>

    <section class="hero card">
      <div class="hero-text">
        <span class="chip">Comment ça marche</span>
        <ol class="steps">
          <li v-for="(step, index) in steps" :key="step.title" class="step">
            <span class="step-index">{{ index + 1 }}</span>
            <div>
              <p class="step-title">{{ step.title }}</p>
              <p class="step-text">{{ step.text }}</p>
            </div>
          </li>
        </ol>
      </div>
      <div class="hero-actions">
        <RouterLink :to="{ name: 'session-new' }" class="btn btn-primary">Nouvelle séance</RouterLink>
        <RouterLink v-if="couple.partner" :to="{ name: 'session-new', query: { type: 'duo' } }" class="btn">
          Séance à deux
        </RouterLink>
        <button class="btn" type="button">Voir le dossier</button>
      </div>
    </section>

    <div class="grid">
      <section class="card sessions">
        <div class="section-head">
          <h2 class="section-title">Dernières séances</h2>
          <span v-if="sessions.loaded" class="chip chip-secondary">{{ countLabel }}</span>
        </div>

        <div v-if="!sessions.loaded && !error" class="list">
          <div v-for="n in 3" :key="n" class="skeleton" />
        </div>

        <p v-else-if="error" class="muted">Les séances n'ont pas pu être chargées. Recharge la page pour réessayer.</p>

        <ul v-else-if="sessions.sessions.length" class="list">
          <li v-for="session in sessions.sessions" :key="session.id">
            <RouterLink :to="{ name: 'session', params: { id: session.id } }" class="session">
              <div class="session-date">
                <span class="day">{{ formatSessionDate(session.session_date, { day: 'numeric' }) }}</span>
                <span class="month">{{ formatSessionDate(session.session_date, { month: 'short' }) }}</span>
              </div>
              <div class="session-body">
                <div class="session-top">
                  <span class="session-title">{{ session.title }}</span>
                  <span v-if="session.status === 'draft'" class="chip chip-secondary">Brouillon</span>
                </div>
                <p v-if="session.summary" class="session-summary">{{ session.summary }}</p>
                <div class="session-meta">
                  <span>{{ session.type === 'duo' ? 'À deux' : 'Perso' }}</span>
                  <span v-if="session.author_id !== auth.user?.id">· {{ couple.nameOf(session.author_id) }}</span>
                  <span v-else-if="session.type === 'solo'" class="share-state">
                    · {{ session.shared ? 'Partagée' : 'Privée' }}
                  </span>
                  <span v-for="topic in session.topics.slice(0, 3)" :key="topic" class="topic">{{ topic }}</span>
                </div>
              </div>
            </RouterLink>
          </li>
        </ul>

        <div v-else class="empty">
          <div class="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
          </div>
          <p class="empty-title">Votre première séance vous attend</p>
          <p class="empty-text">Les comptes-rendus enregistrés par Claude apparaîtront ici, les vôtres comme ceux de l'autre.</p>
          <RouterLink :to="{ name: 'session-new' }" class="btn btn-small empty-cta">Écrire une séance</RouterLink>
        </div>
      </section>

      <aside class="side">
        <section class="card dossier">
          <h2 class="section-title">Dossier du couple</h2>
          <p class="muted">La synthèse que Claude met à jour après chaque séance : contexte, sujets en cours, déclics.</p>
          <div class="dossier-meta">
            <span>Dernière mise à jour</span>
            <span class="faint">Jamais</span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.therapy {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1080px;
}

.eyebrow {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.subtitle {
  max-width: 560px;
  margin-top: 10px;
  color: var(--text-muted);
}

.hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  overflow: hidden;
  background:
    radial-gradient(500px 220px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 18px;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  gap: 12px;
}

.step-index {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--secondary);
}

.step-title {
  font-weight: 600;
}

.step-text {
  margin-top: 2px;
  font-size: 14px;
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 20px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  margin-top: 20px;
  padding: 40px 24px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--bg);
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.empty-title {
  font-weight: 600;
}

.empty-text {
  max-width: 340px;
  font-size: 14px;
  color: var(--text-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
  padding: 0;
  list-style: none;
}

.skeleton {
  height: 84px;
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.session {
  display: flex;
  gap: 16px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
  transition:
    border-color 0.2s,
    transform 0.15s;
}

.session:hover {
  border-color: var(--accent-line);
  transform: translateX(2px);
}

.session-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
  line-height: 1.1;
}

.day {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
}

.month {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.session-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.session-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-summary {
  display: -webkit-box;
  overflow: hidden;
  font-size: 14px;
  color: var(--text-muted);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.session-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-faint);
}

.session-meta span:not(.topic) {
  text-transform: capitalize;
}

.topic {
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
}

.empty-cta {
  margin-top: 8px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.muted {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-muted);
}

.faint {
  color: var(--text-faint);
}

.dossier-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .steps {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: row;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
