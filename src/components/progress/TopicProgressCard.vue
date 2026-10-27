<script setup lang="ts">
import { computed, ref } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import { formatSessionDate } from '@/lib/format'
import { useCoupleStore } from '@/stores/couple'
import { useProgressStore, type TagProgress } from '@/stores/progress'
import type { TherapySession } from '@/types/session'

const props = defineProps<{
  progress: TagProgress
  sessions: TherapySession[]
}>()

const couple = useCoupleStore()
const progressStore = useProgressStore()

const editing = ref(false)
const draft = ref('')
const saving = ref(false)
const error = ref('')
const confirmingUnfollow = ref(false)

const duoCount = computed(() => props.sessions.filter((s) => s.type === 'duo').length)
const soloCount = computed(() => props.sessions.length - duoCount.value)
const lastSession = computed(() => props.sessions[0] ?? null)
const firstSession = computed(() => props.sessions[props.sessions.length - 1] ?? null)

const daysSinceLast = computed(() => {
  if (!lastSession.value) return null
  const [y, m, d] = lastSession.value.session_date.split('-').map(Number)
  const last = new Date(y!, m! - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - last.getTime()) / 86_400_000)
})

const sinceLabel = computed(() => {
  const days = daysSinceLast.value
  if (days === null) return ''
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} jours`
  const months = Math.round(days / 30)
  return `il y a ${months} mois`
})

const recent = computed(() => props.sessions.slice(0, 3))
const openQuestions = computed(() => recent.value.flatMap((s) => s.open_questions).slice(0, 5))
const nextSteps = computed(() => recent.value.flatMap((s) => s.next_steps).slice(0, 5))

const summaryMeta = computed(() => {
  const p = props.progress
  if (!p.summary_updated_at) return ''
  const date = new Date(p.summary_updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const who = p.summary_source === 'claude' ? 'Claude' : couple.nameOf(p.summary_updated_by ?? '')
  return `Mis à jour le ${date}${who ? ` par ${who}` : ''}`
})

function startEdit() {
  draft.value = props.progress.summary
  error.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await progressStore.updateSummary(props.progress.tag, draft.value.trim())
    editing.value = false
  } catch {
    error.value = 'Le bilan n’a pas pu être enregistré.'
  } finally {
    saving.value = false
  }
}

async function unfollow() {
  try {
    await progressStore.unfollow(props.progress.tag)
  } catch {
    error.value = 'Le sujet n’a pas pu être retiré.'
    confirmingUnfollow.value = false
  }
}
</script>

<template>
  <article class="card topic">
    <header class="topic-head">
      <TagChip :name="progress.tag" />
      <div class="head-actions">
        <template v-if="confirmingUnfollow">
          <span class="faint">Ne plus suivre ? Le bilan sera perdu.</span>
          <button class="btn btn-small" type="button" @click="confirmingUnfollow = false">Annuler</button>
          <button class="btn btn-small btn-danger" type="button" @click="unfollow">Retirer</button>
        </template>
        <button v-else class="link" type="button" @click="confirmingUnfollow = true">Ne plus suivre</button>
      </div>
    </header>

    <div class="stats">
      <div class="stat">
        <span class="stat-value">{{ sessions.length }}</span>
        <span class="stat-label">séance{{ sessions.length > 1 ? 's' : '' }}</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ duoCount }}</span>
        <span class="stat-label">à deux</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ soloCount }}</span>
        <span class="stat-label">perso partagée{{ soloCount > 1 ? 's' : '' }}</span>
      </div>
      <div class="stat wide">
        <span class="stat-value small">{{ lastSession ? sinceLabel : '—' }}</span>
        <span class="stat-label">
          {{ lastSession ? `dernière séance, le ${formatSessionDate(lastSession.session_date, { day: 'numeric', month: 'long' })}` : 'aucune séance pour l’instant' }}
        </span>
      </div>
    </div>

    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Bilan</h3>
        <button v-if="!editing" class="link" type="button" @click="startEdit">
          {{ progress.summary ? 'Modifier' : 'Écrire' }}
        </button>
      </div>

      <template v-if="editing">
        <textarea v-model="draft" class="input" rows="8" placeholder="Où en êtes-vous sur ce sujet ? Ce qui a bougé, ce qui reste difficile…" />
        <div class="edit-actions">
          <button class="btn btn-small" type="button" @click="editing = false">Annuler</button>
          <button class="btn btn-small btn-primary" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </template>
      <template v-else-if="progress.summary">
        <p class="summary">{{ progress.summary }}</p>
        <p class="faint">{{ summaryMeta }}</p>
      </template>
      <p v-else class="empty-summary">
        Pas encore de bilan. Demande à Claude :
        <em>« Fais le bilan de nos avancées sur {{ progress.tag }}. »</em>
      </p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <div v-if="openQuestions.length || nextSteps.length" class="lists">
      <section v-if="openQuestions.length" class="block">
        <h3 class="block-title">Questions ouvertes</h3>
        <ul class="items">
          <li v-for="(q, i) in openQuestions" :key="i">{{ q }}</li>
        </ul>
      </section>
      <section v-if="nextSteps.length" class="block">
        <h3 class="block-title">Pistes en cours</h3>
        <ul class="items steps">
          <li v-for="(s, i) in nextSteps" :key="i">{{ s }}</li>
        </ul>
      </section>
    </div>

    <section v-if="sessions.length" class="block">
      <h3 class="block-title">
        Séances
        <span v-if="firstSession" class="faint">
          · depuis le {{ formatSessionDate(firstSession.session_date, { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </span>
      </h3>
      <ul class="sessions">
        <li v-for="session in sessions.slice(0, 5)" :key="session.id">
          <RouterLink :to="{ name: 'session', params: { id: session.id } }" class="session-link">
            <span class="session-date">
              {{ formatSessionDate(session.session_date, { day: 'numeric', month: 'short' }) }}
            </span>
            <span class="session-title">{{ session.title }}</span>
            <span class="faint capitalize">{{ session.type === 'duo' ? 'À deux' : couple.nameOf(session.author_id) }}</span>
          </RouterLink>
        </li>
      </ul>
      <RouterLink
        v-if="sessions.length > 5"
        :to="{ name: 'therapy', query: { tags: progress.tag } }"
        class="link more"
      >
        Voir les {{ sessions.length }} séances
      </RouterLink>
    </section>
  </article>
</template>

<style scoped>
.topic {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.topic-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.topic-head :deep(.tag) {
  font-size: 15px;
  padding: 5px 14px;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.link {
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.link:hover {
  color: var(--accent);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.6fr);
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.1;
  color: var(--accent);
}

.stat-value.small {
  font-size: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.block-title .faint {
  letter-spacing: normal;
  text-transform: none;
}

.summary {
  white-space: pre-line;
  line-height: 1.75;
}

.empty-summary {
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-strong);
  font-size: 14px;
  color: var(--text-muted);
}

.empty-summary em {
  color: var(--text);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.lists {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 18px;
  font-size: 14px;
}

.items li::marker {
  color: var(--accent);
}

.steps li::marker {
  color: var(--secondary);
}

.sessions {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border);
}

.session-link {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  transition: background-color 0.2s;
}

.session-link:hover {
  background: var(--surface-raised);
}

.session-date {
  font-weight: 600;
  color: var(--accent);
}

.session-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.faint {
  font-size: 13px;
  color: var(--text-faint);
}

.capitalize {
  text-transform: capitalize;
}

.more {
  align-self: flex-start;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 760px) {
  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat.wide {
    grid-column: 1 / -1;
  }

  .lists {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
