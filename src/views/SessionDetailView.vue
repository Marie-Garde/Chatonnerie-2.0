<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TagChip from '@/components/tags/TagChip.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { formatSessionDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useSessionsStore } from '@/stores/sessions'
import { sessionVisibility, VISIBILITY_LABELS, type SessionPatch, type SessionVisibility } from '@/types/session'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const couple = useCoupleStore()
const sessions = useSessionsStore()

const sessionId = computed(() => route.params.id as string)
const session = computed(() => sessions.sessions.find((s) => s.id === sessionId.value) ?? null)

const loading = ref(true)
const notFound = ref(false)
const updating = ref(false)
const error = ref('')
const confirmingDelete = ref(false)

const isAuthor = computed(() => session.value?.author_id === auth.user?.id)
const authorName = computed(() => (session.value ? couple.nameOf(session.value.author_id) : ''))
const partnerName = computed(() => couple.partner?.display_name ?? 'ton ou ta partenaire')

const published = computed({
  get: () => session.value?.status === 'published',
  set: (value) => void patch({ status: value ? 'published' : 'draft' }),
})

const visibility = computed(() => (session.value ? sessionVisibility(session.value) : 'private'))

const visibilityOptions = computed(() => [
  {
    id: 'private' as const,
    label: VISIBILITY_LABELS.private,
    description: `${partnerName.value} ne la verra pas, ni sur le site ni dans son Claude. Claude ne s'en sert pas non plus en séance à deux.`,
  },
  {
    id: 'duo' as const,
    label: VISIBILITY_LABELS.duo,
    description: `${partnerName.value} ne peut pas la lire. En séance à deux, Claude s'en sert pour vous accompagner, sans la citer ni la dévoiler.`,
  },
  {
    id: 'shared' as const,
    label: VISIBILITY_LABELS.shared,
    description: `${partnerName.value} peut la lire, ainsi que son Claude.`,
  },
])

const visibilityDescription = computed(() => {
  if (!couple.partner) return 'Invite ton ou ta partenaire dans les réglages pour pouvoir partager.'
  const description = visibilityOptions.value.find((o) => o.id === visibility.value)?.description ?? ''
  if (visibility.value !== 'private' && !published.value) return `${description} Elle comptera dès que tu la publieras.`
  return description
})

function setVisibility(value: SessionVisibility) {
  if (value === visibility.value) return
  void patch({ shared: value === 'shared', duo_context: value === 'duo' })
}

onMounted(async () => {
  try {
    const found = await sessions.fetchOne(sessionId.value)
    notFound.value = !found
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function patch(values: SessionPatch) {
  if (!session.value) return
  error.value = ''
  updating.value = true
  try {
    await sessions.update(session.value.id, values)
  } catch {
    error.value = 'La modification n’a pas pu être enregistrée.'
  } finally {
    updating.value = false
  }
}

async function remove() {
  if (!session.value) return
  updating.value = true
  try {
    await sessions.remove(session.value.id)
    await router.push({ name: 'therapy' })
  } catch {
    error.value = 'La séance n’a pas pu être supprimée.'
    updating.value = false
  }
}
</script>

<template>
  <div class="session-detail">
    <RouterLink :to="{ name: 'therapy' }" class="back-link">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Thérapie
    </RouterLink>

    <div v-if="loading" class="card placeholder" />

    <div v-else-if="notFound || !session" class="card empty">
      <p class="empty-title">Séance introuvable</p>
      <p class="muted">Elle a peut-être été supprimée, ou elle n'est pas partagée avec toi.</p>
    </div>

    <template v-else>
      <header class="page-header">
        <div class="chips">
          <span class="chip">{{ session.type === 'duo' ? 'À deux' : 'Perso' }}</span>
          <span v-if="session.status === 'draft'" class="chip chip-secondary">Brouillon</span>
          <span v-if="session.source === 'claude'" class="chip chip-muted">Rédigée par Claude</span>
        </div>
        <h1 class="title">{{ session.title }}</h1>
        <p class="subtitle meta">
          <span class="capitalize">{{ formatSessionDate(session.session_date) }}</span>
          <span v-if="!isAuthor"> · par <span class="capitalize">{{ authorName }}</span></span>
        </p>
      </header>

      <div class="layout">
        <article class="content">
          <section v-if="session.topics.length" class="topics">
            <RouterLink
              v-for="topic in session.topics"
              :key="topic"
              :to="{ name: 'therapy', query: { tags: topic } }"
            >
              <TagChip :name="topic" />
            </RouterLink>
          </section>

          <section v-if="session.summary" class="card block">
            <h2 class="section-title">Résumé</h2>
            <p class="prose">{{ session.summary }}</p>
          </section>

          <section v-if="session.feelings" class="card block">
            <h2 class="section-title">Ressentis et besoins</h2>
            <p class="prose">{{ session.feelings }}</p>
          </section>

          <section v-if="session.quotes.length" class="card block">
            <h2 class="section-title">Citations clés</h2>
            <blockquote v-for="(quote, index) in session.quotes" :key="index" class="quote">
              {{ quote }}
            </blockquote>
          </section>

          <section v-if="session.open_questions.length" class="card block">
            <h2 class="section-title">Questions ouvertes</h2>
            <ul class="items">
              <li v-for="(question, index) in session.open_questions" :key="index">{{ question }}</li>
            </ul>
          </section>

          <section v-if="session.next_steps.length" class="card block">
            <h2 class="section-title">Pistes</h2>
            <ul class="items steps">
              <li v-for="(step, index) in session.next_steps" :key="index">{{ step }}</li>
            </ul>
          </section>
        </article>

        <aside v-if="isAuthor || session.type === 'duo'" class="side">
          <section class="card panel">
            <ToggleSwitch
              v-model="published"
              label="Publiée"
              :description="published ? 'La séance est finalisée.' : 'Encore en brouillon.'"
              :disabled="updating"
            />
            <template v-if="session.type === 'solo' && isAuthor">
              <hr class="divider" />
              <div class="visibility">
                <span class="visibility-label">Qui peut la voir</span>
                <div class="segmented" role="radiogroup" aria-label="Qui peut voir cette séance">
                  <button
                    v-for="option in visibilityOptions"
                    :key="option.id"
                    type="button"
                    role="radio"
                    :aria-checked="visibility === option.id"
                    :disabled="updating || !couple.partner"
                    @click="setVisibility(option.id)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <p class="muted small">{{ visibilityDescription }}</p>
              </div>
            </template>
            <template v-else-if="session.type === 'duo'">
              <hr class="divider" />
              <p class="muted small">Les séances à deux sont toujours visibles par vous deux.</p>
            </template>
          </section>

          <section class="card panel">
            <RouterLink :to="{ name: 'session-edit', params: { id: session.id } }" class="btn btn-full">
              Modifier
            </RouterLink>
            <template v-if="isAuthor">
              <div v-if="confirmingDelete" class="confirm">
                <p class="small">Supprimer définitivement cette séance ?</p>
                <div class="confirm-actions">
                  <button class="btn btn-small" type="button" @click="confirmingDelete = false">Annuler</button>
                  <button class="btn btn-small btn-danger" type="button" :disabled="updating" @click="remove">
                    Supprimer
                  </button>
                </div>
              </div>
              <button v-else class="btn btn-full btn-danger" type="button" @click="confirmingDelete = true">
                Supprimer
              </button>
            </template>
          </section>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.session-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1080px;
}

.placeholder {
  height: 320px;
}

.empty {
  text-align: center;
  padding: 48px 24px;
}

.empty-title {
  font-weight: 600;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.chip-muted {
  background: var(--surface-raised);
  color: var(--text-muted);
}

.chip-outline {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
}

.capitalize {
  display: inline-block;
}

.capitalize::first-letter {
  text-transform: uppercase;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: start;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prose {
  white-space: pre-line;
  line-height: 1.75;
}

.quote {
  padding: 4px 0 4px 16px;
  border-left: 3px solid var(--accent);
  font-family: var(--font-display);
  font-size: 17px;
  font-style: italic;
  color: var(--text);
}

.items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 20px;
}

.items li::marker {
  color: var(--accent);
}

.steps li::marker {
  color: var(--secondary);
}

.side {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.visibility {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visibility-label {
  font-size: 14px;
  font-weight: 600;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.segmented button {
  padding: 6px 4px;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.segmented button[aria-checked='true'] {
  background: var(--accent-soft);
  color: var(--accent);
}

.segmented button:disabled {
  cursor: progress;
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
}

.btn-full {
  justify-content: center;
  width: 100%;
}

.muted {
  color: var(--text-muted);
}

.small {
  font-size: 13px;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirm-actions {
  display: flex;
  gap: 8px;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    position: static;
    order: -1;
  }
}
</style>
