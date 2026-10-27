<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatSessionDate } from '@/lib/format'
import { useNonMonoStore } from '@/stores/nonmono'

const nm = useNonMonoStore()

const pauseWord = ref('')
const editingWord = ref(false)
const error = ref('')

watch(
  () => nm.agreements?.pause_word,
  (value) => (pauseWord.value = value ?? ''),
  { immediate: true },
)

function today() {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}

function daysUntil(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y!, m! - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

const checkinLabel = computed(() => {
  const date = nm.agreements?.next_checkin
  if (!date) return null
  const days = daysUntil(date)
  if (days < 0) return { text: `En retard de ${-days} jour${days < -1 ? 's' : ''}`, late: true }
  if (days === 0) return { text: "C'est aujourd'hui", late: true }
  return { text: `Dans ${days} jour${days > 1 ? 's' : ''}`, late: false }
})

async function run(action: () => Promise<unknown>) {
  error.value = ''
  try {
    await action()
  } catch {
    error.value = 'Ça n’a pas pu être enregistré.'
  }
}

function saveWord() {
  void run(async () => {
    await nm.saveAgreements({ pause_word: pauseWord.value.trim() })
    editingWord.value = false
  })
}

function setCheckin(event: Event) {
  const value = (event.target as HTMLInputElement).value
  void run(() => nm.saveAgreements({ next_checkin: value || null }))
}

function markReviewed() {
  void run(() => nm.saveAgreements({ last_review: today() }))
}
</script>

<template>
  <section class="card agreements">
    <div class="block">
      <p class="label">Notre mot de pause</p>
      <form v-if="editingWord" class="inline" @submit.prevent="saveWord">
        <input v-model="pauseWord" class="input" type="text" maxlength="40" placeholder="Pastèque" />
        <button class="btn btn-small btn-primary" type="submit">OK</button>
      </form>
      <button v-else class="word" type="button" @click="editingWord = true">
        <span v-if="nm.agreements?.pause_word" class="word-value">« {{ nm.agreements.pause_word }} »</span>
        <span v-else class="placeholder">Choisir un mot</span>
      </button>
      <p class="hint">Quand l'un de vous le dit, on s'arrête et on en reparle à froid, sans se justifier.</p>
    </div>

    <div class="block">
      <p class="label">Prochain point sur nos règles</p>
      <input class="input date" type="date" :value="nm.agreements?.next_checkin ?? ''" @change="setCheckin" />
      <p v-if="checkinLabel" class="status" :class="{ late: checkinLabel.late }">{{ checkinLabel.text }}</p>
    </div>

    <div class="block">
      <p class="label">Dernière révision</p>
      <p class="value">
        {{
          nm.agreements?.last_review
            ? formatSessionDate(nm.agreements.last_review, { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Jamais'
        }}
      </p>
      <button class="btn btn-small" type="button" @click="markReviewed">On en a reparlé aujourd'hui</button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.agreements {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  background:
    radial-gradient(420px 180px at 0% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.word {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
}

.word-value {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--accent);
}

.placeholder {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: underline dotted;
}

.inline {
  display: flex;
  gap: 6px;
  width: 100%;
}

.inline .input {
  min-height: 38px;
}

.date {
  min-height: 38px;
  max-width: 200px;
}

.status {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.status.late {
  color: var(--secondary);
}

.value {
  font-weight: 600;
}

.hint {
  font-size: 12px;
  color: var(--text-faint);
}

.error {
  grid-column: 1 / -1;
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 760px) {
  .agreements {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
