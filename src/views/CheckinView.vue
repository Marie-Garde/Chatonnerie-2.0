<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { formatSessionDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import {
  CHECKIN_QUESTIONS,
  WEATHERS,
  monthKey,
  shiftMonth,
  useCheckinsStore,
  type Checkin,
  type CheckinInput,
} from '@/stores/checkins'
import { useCoupleStore } from '@/stores/couple'

const auth = useAuthStore()
const couple = useCoupleStore()
const checkins = useCheckinsStore()

const currentMonth = monthKey()
const month = ref(currentMonth)
const error = ref('')
const saving = ref(false)
const savedAt = ref<string | null>(null)

const partnerName = computed(() => couple.partner?.display_name ?? 'ton ou ta partenaire')

const monthLabel = computed(() => formatSessionDate(month.value, { month: 'long', year: 'numeric' }))

function find(userId: string | undefined, m: string) {
  return checkins.checkins.find((c) => c.author_id === userId && c.month === m) ?? null
}

const mine = computed(() => find(auth.user?.id, month.value))
const theirs = computed(() => find(couple.partner?.user_id, month.value))

const previousGoals = computed(() => {
  const previous = shiftMonth(month.value, -1)
  return [
    { name: auth.displayName, goal: find(auth.user?.id, previous)?.next_goal ?? '' },
    { name: partnerName.value, goal: find(couple.partner?.user_id, previous)?.next_goal ?? '' },
  ].filter((g) => g.goal)
})

const pastMonths = computed(() =>
  [...new Set(checkins.checkins.map((c) => c.month))].filter((m) => m !== currentMonth).sort().reverse(),
)

function emptyForm(): CheckinInput {
  return { weather: null, weather_note: '', felt_loved: '', connection_need: '', unspoken: '', next_goal: '' }
}

const form = reactive<CheckinInput>(emptyForm())

function fill(checkin: Checkin | null) {
  const source = checkin ?? emptyForm()
  form.weather = source.weather
  form.weather_note = source.weather_note
  for (const q of CHECKIN_QUESTIONS) form[q.id] = source[q.id]
}

watch(mine, fill, { immediate: true })
watch(month, () => (savedAt.value = null))

const dirty = computed(() => {
  const source = mine.value ?? emptyForm()
  return (
    form.weather !== source.weather ||
    form.weather_note !== source.weather_note ||
    CHECKIN_QUESTIONS.some((q) => form[q.id] !== source[q.id])
  )
})

function weatherOf(id: string | null) {
  return WEATHERS.find((w) => w.id === id) ?? null
}

async function load() {
  error.value = ''
  try {
    await checkins.fetch()
  } catch {
    error.value = 'Les points mensuels n’ont pas pu être chargés. Recharge la page pour réessayer.'
  }
}

onMounted(load)
watch(() => couple.coupleId, load)

async function save() {
  saving.value = true
  error.value = ''
  try {
    await checkins.save(month.value, {
      weather: form.weather,
      weather_note: form.weather_note.trim(),
      felt_loved: form.felt_loved.trim(),
      connection_need: form.connection_need.trim(),
      unspoken: form.unspoken.trim(),
      next_goal: form.next_goal.trim(),
    })
    savedAt.value = new Date().toISOString()
  } catch {
    error.value = 'Ton point n’a pas pu être enregistré.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="checkin">
    <header class="page-header">
      <p class="eyebrow">Point mensuel</p>
      <h1 class="title">Comment on va, ce mois-ci ?</h1>
      <p class="subtitle">
        Chaque mois, chacun donne sa météo et répond aux mêmes questions. Ensuite, on en parle ensemble.
      </p>
    </header>

    <div class="month-bar">
      <button type="button" class="nav-btn" aria-label="Mois précédent" @click="month = shiftMonth(month, -1)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h2 class="month">{{ monthLabel }}</h2>
      <button
        type="button"
        class="nav-btn"
        aria-label="Mois suivant"
        :disabled="month >= currentMonth"
        @click="month = shiftMonth(month, 1)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button v-if="month !== currentMonth" type="button" class="today" @click="month = currentMonth">
        Revenir à ce mois-ci
      </button>
    </div>

    <p v-if="error" class="error card" role="alert">{{ error }}</p>

    <section v-if="previousGoals.length" class="card goals">
      <span class="chip chip-secondary">Les objectifs du mois dernier</span>
      <ul class="goal-list">
        <li v-for="g in previousGoals" :key="g.name">
          <span class="goal-name capitalize">{{ g.name }}</span>
          <span class="goal-text">{{ g.goal }}</span>
        </li>
      </ul>
      <p class="hint">Est-ce que vous les avez tenus ? C'est un bon point de départ.</p>
    </section>

    <div class="grid">
      <form class="card mine" novalidate @submit.prevent="save">
        <h2 class="section-title">Mon point</h2>

        <div class="field">
          <span class="label">Ma météo</span>
          <div class="weathers" role="radiogroup" aria-label="Ma météo">
            <button
              v-for="w in WEATHERS"
              :key="w.id"
              type="button"
              role="radio"
              class="weather"
              :aria-checked="form.weather === w.id"
              @click="form.weather = form.weather === w.id ? null : w.id"
            >
              <span class="weather-emoji" aria-hidden="true">{{ w.emoji }}</span>
              <span class="weather-label">{{ w.label }}</span>
            </button>
          </div>
          <input
            v-model="form.weather_note"
            class="input"
            type="text"
            maxlength="200"
            placeholder="En un mot, pourquoi ce temps-là ? (facultatif)"
          />
        </div>

        <label v-for="q in CHECKIN_QUESTIONS" :key="q.id" class="field">
          <span class="label">{{ q.label }}</span>
          <textarea v-model="form[q.id]" class="input" rows="3" :placeholder="q.placeholder" />
        </label>

        <div class="actions">
          <span v-if="savedAt && !dirty" class="saved">Enregistré</span>
          <button class="btn btn-primary" type="submit" :disabled="saving || !dirty">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </form>

      <section v-if="couple.partner" class="card theirs">
        <h2 class="section-title capitalize">Le point de {{ partnerName }}</h2>

        <div v-if="!checkins.loaded && !error" class="skeleton" />

        <p v-else-if="!theirs" class="muted">Pas encore rempli pour {{ monthLabel }}.</p>

        <template v-else>
          <div class="answer weather-answer">
            <span class="label">Sa météo</span>
            <p v-if="weatherOf(theirs.weather)" class="weather-value">
              <span aria-hidden="true">{{ weatherOf(theirs.weather)?.emoji }}</span>
              {{ weatherOf(theirs.weather)?.label }}
            </p>
            <p v-else class="empty-answer">—</p>
            <p v-if="theirs.weather_note" class="answer-text">{{ theirs.weather_note }}</p>
          </div>
          <div v-for="q in CHECKIN_QUESTIONS" :key="q.id" class="answer">
            <span class="label">{{ q.label }}</span>
            <p v-if="theirs[q.id]" class="answer-text">{{ theirs[q.id] }}</p>
            <p v-else class="empty-answer">—</p>
          </div>
        </template>
      </section>

      <section v-else-if="couple.loaded" class="card theirs">
        <h2 class="section-title">Le point de l'autre</h2>
        <p class="muted">Invite ton ou ta partenaire pour voir ses réponses à côté des tiennes.</p>
        <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small invite">
          Inviter mon ou ma partenaire
        </RouterLink>
      </section>
    </div>

    <section v-if="pastMonths.length" class="card history">
      <h2 class="section-title">Les mois précédents</h2>
      <div class="months">
        <button
          v-for="m in pastMonths"
          :key="m"
          type="button"
          class="month-chip"
          :aria-pressed="m === month"
          @click="month = m"
        >
          {{ formatSessionDate(m, { month: 'long', year: 'numeric' }) }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.checkin {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1080px;
}

.subtitle {
  max-width: 560px;
  margin-top: 10px;
  color: var(--text-muted);
}

.month-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.month {
  min-width: 170px;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  text-transform: capitalize;
}

.nav-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.today {
  padding: 4px 6px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.today:hover {
  color: var(--accent);
}

.goals {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background:
    radial-gradient(320px 160px at 100% 0%, var(--secondary-soft), transparent 70%),
    var(--surface);
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.goal-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.goal-name {
  font-weight: 600;
}

.goal-text {
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.mine,
.theirs {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mine {
  background:
    radial-gradient(320px 160px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.label {
  line-height: 1.4;
}

.weathers {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.weather {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text-muted);
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.weather:hover {
  border-color: var(--accent-line);
}

.weather[aria-checked='true'] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.weather-emoji {
  font-size: 24px;
  line-height: 1;
}

.weather-label {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.input {
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.saved {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.answer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.answer:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.weather-value {
  font-size: 18px;
  font-weight: 600;
}

.answer-text {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.empty-answer {
  color: var(--text-faint);
}

.skeleton {
  height: 240px;
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.invite {
  align-self: flex-start;
}

.months {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.month-chip {
  padding: 6px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.month-chip:hover {
  border-color: var(--accent-line);
  color: var(--text);
}

.month-chip[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.capitalize {
  text-transform: capitalize;
}

.hint {
  font-size: 13px;
  color: var(--text-muted);
}

.muted {
  font-size: 14px;
  color: var(--text-muted);
}

.error {
  font-size: 14px;
  color: var(--secondary);
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 420px) {
  .weather-label {
    font-size: 10px;
  }
}
</style>
