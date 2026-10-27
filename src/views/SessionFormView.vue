<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListInput from '@/components/ui/ListInput.vue'
import TagPicker from '@/components/tags/TagPicker.vue'
import { useCoupleStore } from '@/stores/couple'
import { useSessionsStore } from '@/stores/sessions'
import type { SessionContent, SessionType } from '@/types/session'

const route = useRoute()
const router = useRouter()
const couple = useCoupleStore()
const sessions = useSessionsStore()

const sessionId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const isEdit = computed(() => !!sessionId.value)

const type = ref<SessionType>(route.query.type === 'duo' ? 'duo' : 'solo')
const canDuo = computed(() => !!couple.partner && !!couple.coupleId)

const subtitle = computed(() =>
  type.value === 'duo'
    ? `Elle sera visible par toi et ${couple.partner?.display_name ?? 'ton ou ta partenaire'}, et modifiable par vous deux.`
    : 'Elle sera enregistrée en brouillon. Tu choisiras ensuite si tu la publies et si tu la partages.',
)

function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const form = reactive<SessionContent>({
  title: '',
  session_date: today(),
  summary: '',
  feelings: '',
  topics: [],
  quotes: [],
  open_questions: [],
  next_steps: [],
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  if (!sessionId.value) return
  loading.value = true
  try {
    const session = await sessions.fetchOne(sessionId.value)
    if (!session) {
      error.value = 'Cette séance est introuvable.'
      return
    }
    type.value = session.type
    Object.assign(form, {
      title: session.title,
      session_date: session.session_date,
      summary: session.summary,
      feelings: session.feelings,
      topics: [...session.topics],
      quotes: [...session.quotes],
      open_questions: [...session.open_questions],
      next_steps: [...session.next_steps],
    })
  } catch {
    error.value = 'La séance n’a pas pu être chargée.'
  } finally {
    loading.value = false
  }
})

function cleanList(list: string[]) {
  return list.map((item) => item.trim()).filter(Boolean)
}

async function submit() {
  error.value = ''
  if (!form.title.trim()) {
    error.value = 'Donne un titre à la séance.'
    return
  }
  if (!form.session_date) {
    error.value = 'Choisis une date.'
    return
  }
  if (!isEdit.value && type.value === 'duo' && !canDuo.value) {
    error.value = 'Invite ton ou ta partenaire dans les réglages pour faire une séance à deux.'
    return
  }

  const content: SessionContent = {
    title: form.title.trim(),
    session_date: form.session_date,
    summary: form.summary.trim(),
    feelings: form.feelings.trim(),
    topics: form.topics,
    quotes: cleanList(form.quotes),
    open_questions: cleanList(form.open_questions),
    next_steps: cleanList(form.next_steps),
  }

  saving.value = true
  try {
    const saved = sessionId.value
      ? await sessions.update(sessionId.value, content)
      : await sessions.create(content, type.value, couple.coupleId)
    await router.push({ name: 'session', params: { id: saved.id } })
  } catch {
    error.value = 'La séance n’a pas pu être enregistrée. Réessaie dans un instant.'
  } finally {
    saving.value = false
  }
}

function cancel() {
  if (sessionId.value) void router.push({ name: 'session', params: { id: sessionId.value } })
  else void router.push({ name: 'therapy' })
}
</script>

<template>
  <div class="session-form">
    <RouterLink :to="{ name: 'therapy' }" class="back-link">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Thérapie
    </RouterLink>

    <header class="page-header">
      <p class="eyebrow">{{ type === 'duo' ? 'Séance à deux' : 'Séance perso' }}</p>
      <h1 class="title">{{ isEdit ? 'Modifier la séance' : 'Nouvelle séance' }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </header>

    <div v-if="loading" class="card placeholder" />

    <form v-else class="form" novalidate @submit.prevent="submit">
      <div v-if="!isEdit" class="type-picker" role="radiogroup" aria-label="Type de séance">
        <button
          type="button"
          role="radio"
          class="type-option"
          :class="{ active: type === 'solo' }"
          :aria-checked="type === 'solo'"
          @click="type = 'solo'"
        >
          <span class="type-name">Perso</span>
          <span class="type-description">Toi seul·e, tu décides de la partager ou non</span>
        </button>
        <button
          type="button"
          role="radio"
          class="type-option"
          :class="{ active: type === 'duo', locked: !canDuo }"
          :aria-checked="type === 'duo'"
          @click="type = 'duo'"
        >
          <span class="type-name">À deux</span>
          <span class="type-description">
            {{ canDuo ? `Avec ${couple.partner?.display_name}, toujours visible par vous deux` : 'Invite d’abord ton ou ta partenaire' }}
          </span>
        </button>
      </div>

      <section class="card group">
        <div class="row">
          <label class="field grow">
            <span class="label">Titre</span>
            <input
              v-model="form.title"
              class="input"
              type="text"
              maxlength="200"
              placeholder="La charge mentale à la maison"
              @input="error = ''"
            />
          </label>
          <label class="field date">
            <span class="label">Date</span>
            <input v-model="form.session_date" class="input" type="date" />
          </label>
        </div>

        <div class="field">
          <span class="label">Tags</span>
          <TagPicker v-model="form.topics" />
        </div>
      </section>

      <section class="card group">
        <label class="field">
          <span class="label">Résumé</span>
          <span class="hint">Ce qui s'est dit, ce qui a été exploré.</span>
          <textarea
            v-model="form.summary"
            class="input"
            rows="8"
            placeholder="On a parlé de la façon dont les tâches se répartissent à la maison…"
          />
        </label>

        <label class="field">
          <span class="label">Ressentis et besoins</span>
          <span class="hint">Ce que tu as ressenti, ce dont tu as besoin.</span>
          <textarea
            v-model="form.feelings"
            class="input"
            rows="5"
            placeholder="J'ai eu l'impression de tout porter…"
          />
        </label>
      </section>

      <section class="card group">
        <div class="field">
          <span class="label">Citations clés</span>
          <span class="hint">Les phrases importantes, mot pour mot.</span>
          <ListInput v-model="form.quotes" add-label="Ajouter une citation" placeholder="« … »" />
        </div>

        <div class="field">
          <span class="label">Questions ouvertes</span>
          <span class="hint">Ce qui reste à creuser.</span>
          <ListInput
            v-model="form.open_questions"
            add-label="Ajouter une question"
            placeholder="Pourquoi est-ce que je n'arrive pas à demander de l'aide ?"
          />
        </div>

        <div class="field">
          <span class="label">Pistes</span>
          <span class="hint">Exercices, engagements, choses à essayer.</span>
          <ListInput
            v-model="form.next_steps"
            add-label="Ajouter une piste"
            placeholder="Faire un point organisation le dimanche soir"
          />
        </div>
      </section>

      <div class="actions">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="btn" type="button" @click="cancel">Annuler</button>
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.session-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 820px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  text-align: left;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.type-option:hover {
  border-color: var(--border-strong);
}

.type-option.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.type-option.locked .type-description {
  color: var(--text-faint);
}

.type-name {
  font-weight: 600;
}

.type-option.active .type-name {
  color: var(--accent);
}

.type-description {
  font-size: 13px;
  color: var(--text-muted);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: flex;
  gap: 14px;
}

.grow {
  flex: 1;
  min-width: 0;
}

.date {
  width: 180px;
}

.placeholder {
  height: 320px;
}

.actions {
  position: sticky;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.error {
  margin-right: auto;
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }

  .date {
    width: 100%;
  }

  .actions {
    bottom: 84px;
  }
}
</style>
