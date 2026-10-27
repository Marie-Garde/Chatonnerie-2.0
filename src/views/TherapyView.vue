<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TagChip from '@/components/tags/TagChip.vue'
import { formatSessionDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useSessionsStore } from '@/stores/sessions'

const auth = useAuthStore()
const couple = useCoupleStore()
const sessions = useSessionsStore()
const route = useRoute()
const router = useRouter()

const error = ref(false)

const selectedTags = computed(() => {
  const raw = route.query.tags
  const value = Array.isArray(raw) ? raw.join(',') : (raw ?? '')
  return value.split(',').filter(Boolean)
})

const usedTags = computed(() => {
  const counts = new Map<string, number>()
  for (const session of sessions.sessions) {
    for (const topic of session.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
})

const filteredSessions = computed(() => {
  if (!selectedTags.value.length) return sessions.sessions
  return sessions.sessions.filter((s) => selectedTags.value.some((tag) => s.topics.includes(tag)))
})

const countLabel = computed(() => {
  const count = filteredSessions.value.length
  return `${count} séance${count > 1 ? 's' : ''}`
})

function setTags(tags: string[]) {
  void router.replace({ query: { ...route.query, tags: tags.length ? tags.join(',') : undefined } })
}

function toggleTag(name: string) {
  setTags(
    selectedTags.value.includes(name)
      ? selectedTags.value.filter((t) => t !== name)
      : [...selectedTags.value, name],
  )
}

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
        Vos séances et vos comptes-rendus, en attendant de pouvoir les apporter à un thérapeute.
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
      </div>
    </section>

    <div class="grid">
      <section class="card sessions">
        <div class="section-head">
          <h2 class="section-title">Séances</h2>
          <span v-if="sessions.loaded" class="chip chip-secondary">{{ countLabel }}</span>
        </div>
  
        <div v-if="usedTags.length" class="filters">
          <button
            v-for="tag in usedTags"
            :key="tag.name"
            type="button"
            class="filter"
            :aria-pressed="selectedTags.includes(tag.name)"
            @click="toggleTag(tag.name)"
          >
            <TagChip :name="tag.name" :active="selectedTags.includes(tag.name)">
              <span class="filter-count">{{ tag.count }}</span>
            </TagChip>
          </button>
          <button v-if="selectedTags.length" type="button" class="clear" @click="setTags([])">Tout afficher</button>
          <RouterLink :to="{ name: 'settings', query: { onglet: 'therapie' } }" class="manage">Gérer les tags</RouterLink>
        </div>
  
        <div v-if="!sessions.loaded && !error" class="list">
          <div v-for="n in 3" :key="n" class="skeleton" />
        </div>
  
        <p v-else-if="error" class="muted">Les séances n'ont pas pu être chargées. Recharge la page pour réessayer.</p>
  
        <p v-else-if="sessions.sessions.length && !filteredSessions.length" class="muted">
          Aucune séance avec ces tags.
        </p>
  
        <ul v-else-if="filteredSessions.length" class="list">
          <li v-for="session in filteredSessions" :key="session.id">
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
                  <TagChip v-for="topic in session.topics.slice(0, 4)" :key="topic" :name="topic" small />
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
        <RouterLink :to="{ name: 'progress' }" class="card tuto progress-card">
          <span class="chip chip-secondary">Avancées en duo</span>
          <h2 class="section-title">Où vous en êtes</h2>
          <p class="tuto-text">
            Suivez les sujets qui comptent pour vous : le bilan du travail fait, la dernière séance, les pistes en cours.
          </p>
          <span class="tuto-link">
            Voir nos avancées
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </RouterLink>

        <RouterLink :to="{ name: 'tutorial' }" class="card tuto">
          <span class="chip">Tuto</span>
          <h2 class="section-title">Relier ton compte à Claude</h2>
          <p class="tuto-text">
            Ajoute le connecteur Chatonnerie à ton Claude pour qu'il lise vos séances et enregistre ses comptes-rendus ici.
          </p>
          <span class="tuto-link">
            Suivre le tuto
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </RouterLink>
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

.session-meta > span:not(.tag) {
  text-transform: capitalize;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.filter {
  padding: 0;
  border: none;
  background: none;
  border-radius: 999px;
}

.filter:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.filter-count {
  font-size: 11px;
  opacity: 0.7;
}

.clear,
.manage {
  padding: 4px 6px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.clear:hover,
.manage:hover {
  color: var(--accent);
}

.manage {
  margin-left: auto;
}

.empty-cta {
  margin-top: 8px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tuto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  background:
    radial-gradient(320px 160px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
  transition:
    border-color 0.2s,
    transform 0.15s;
}

.tuto:hover {
  border-color: var(--accent-line);
  transform: translateY(-2px);
}

.progress-card {
  background:
    radial-gradient(320px 160px at 100% 0%, var(--secondary-soft), transparent 70%),
    var(--surface);
}

.progress-card .tuto-link {
  color: var(--secondary);
}

.progress-card:hover {
  border-color: rgba(var(--secondary-rgb), 0.35);
}

.tuto-text {
  font-size: 14px;
  color: var(--text-muted);
}

.tuto-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}

.muted {
  margin-top: 16px;
  font-size: 14px;
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
