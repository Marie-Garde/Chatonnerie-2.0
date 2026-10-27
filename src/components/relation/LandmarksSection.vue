<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { formatSessionDate } from '@/lib/format'
import { LANDMARK_KINDS, type LandmarkKind } from '@/lib/languages'
import { useCoupleStore } from '@/stores/couple'
import { useRelationStore, type Landmark } from '@/stores/relation'

const couple = useCoupleStore()
const relation = useRelationStore()

const addingKind = ref<LandmarkKind | null>(null)
const form = reactive({ title: '', detail: '', date: '' })
const busy = ref(false)
const error = ref('')
const confirmingId = ref<string | null>(null)

function nextOccurrence(date: string) {
  const [, m, d] = date.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let next = new Date(today.getFullYear(), m! - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m! - 1, d)
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

function anniversaryYears(date: string) {
  const [y] = date.split('-').map(Number)
  const next = new Date()
  next.setDate(next.getDate() + nextOccurrence(date))
  return next.getFullYear() - y!
}

function countdown(date: string) {
  const days = nextOccurrence(date)
  if (days === 0) return "C'est aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

const groups = computed(() =>
  LANDMARK_KINDS.map((kind) => {
    const items = relation.landmarks.filter((l) => l.kind === kind.id)
    if (kind.id === 'date') items.sort((a, b) => nextOccurrence(a.date ?? '') - nextOccurrence(b.date ?? ''))
    return { ...kind, items }
  }),
)

function startAdd(kind: LandmarkKind) {
  addingKind.value = kind
  form.title = ''
  form.detail = ''
  form.date = ''
  error.value = ''
}

async function add() {
  if (!addingKind.value) return
  if (!form.title.trim()) {
    error.value = 'Donne-lui un titre.'
    return
  }
  if (addingKind.value === 'date' && !form.date) {
    error.value = 'Choisis la date.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await relation.addLandmark({
      kind: addingKind.value,
      title: form.title.trim(),
      detail: form.detail.trim(),
      date: addingKind.value === 'date' ? form.date : null,
    })
    addingKind.value = null
  } catch {
    error.value = 'Ça n’a pas pu être ajouté.'
  } finally {
    busy.value = false
  }
}

async function remove(item: Landmark) {
  try {
    await relation.removeLandmark(item.id)
  } catch {
    error.value = 'Ça n’a pas pu être supprimé.'
  } finally {
    confirmingId.value = null
  }
}
</script>

<template>
  <section class="landmarks">
    <div>
      <h2 class="section-title">Nos repères</h2>
      <p class="intro">Les dates, les habitudes et les petites choses qui font votre histoire.</p>
    </div>

    <div v-if="!couple.partner" class="card empty">
      <p>Invite ton ou ta partenaire pour construire vos repères ensemble.</p>
      <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">Inviter</RouterLink>
    </div>

    <div v-else class="grid">
      <div v-for="group in groups" :key="group.id" class="card group">
        <div class="group-head">
          <h3 class="group-title">{{ group.label }}</h3>
          <button v-if="addingKind !== group.id" class="add" type="button" @click="startAdd(group.id)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter
          </button>
        </div>

        <form v-if="addingKind === group.id" class="form" novalidate @submit.prevent="add">
          <input v-model="form.title" class="input" type="text" maxlength="120" :placeholder="group.placeholder" @input="error = ''" />
          <input v-if="group.id === 'date'" v-model="form.date" class="input" type="date" @input="error = ''" />
          <textarea v-model="form.detail" class="input" rows="2" placeholder="Un détail, un souvenir… (facultatif)" />
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <div class="form-actions">
            <button class="btn btn-small" type="button" @click="addingKind = null">Annuler</button>
            <button class="btn btn-small btn-primary" type="submit" :disabled="busy">Ajouter</button>
          </div>
        </form>

        <ul v-if="group.items.length" class="items">
          <li v-for="item in group.items" :key="item.id" class="item">
            <div class="item-body">
              <p class="item-title">{{ item.title }}</p>
              <p v-if="item.date" class="item-date">
                {{ formatSessionDate(item.date, { day: 'numeric', month: 'long', year: 'numeric' }) }}
                <span v-if="nextOccurrence(item.date) < 60" class="countdown">
                  · {{ countdown(item.date) }}
                  <template v-if="anniversaryYears(item.date) > 0">({{ anniversaryYears(item.date) }} ans)</template>
                </span>
              </p>
              <p v-if="item.detail" class="item-detail">{{ item.detail }}</p>
            </div>
            <div class="item-actions">
              <template v-if="confirmingId === item.id">
                <button class="btn btn-small" type="button" @click="confirmingId = null">Non</button>
                <button class="btn btn-small btn-danger" type="button" @click="remove(item)">Supprimer</button>
              </template>
              <button v-else class="icon-btn" type="button" :aria-label="`Supprimer ${item.title}`" @click="confirmingId = item.id">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
        <p v-else-if="addingKind !== group.id" class="faint">Rien pour l'instant.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landmarks {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 24px;
  text-align: center;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.add:hover {
  background: var(--accent-soft);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.items {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--border);
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
}

.item-date {
  font-size: 13px;
  color: var(--text-muted);
}

.countdown {
  color: var(--secondary);
}

.item-detail {
  margin-top: 2px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-line;
}

.item-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-faint);
}

.icon-btn:hover {
  background: var(--surface-raised);
  color: var(--secondary);
}

.faint {
  font-size: 13px;
  color: var(--text-faint);
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
