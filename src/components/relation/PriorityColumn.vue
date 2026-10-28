<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRelationStore } from '@/stores/relation'

const props = defineProps<{
  target: string | null
  title: string
  accent: 'accent' | 'secondary' | 'both'
}>()

const relation = useRelationStore()

const draft = ref('')
const editingId = ref<string | null>(null)
const editDraft = ref('')
const error = ref('')

const items = computed(() => relation.prioritiesFor(props.target))
const active = computed(() => items.value.filter((i) => !i.done_at))
const done = computed(() => items.value.filter((i) => i.done_at))
const showDone = ref(false)

async function run(action: () => Promise<unknown>) {
  error.value = ''
  try {
    await action()
  } catch {
    error.value = 'Ça n’a pas fonctionné.'
  }
}

function add() {
  const text = draft.value.trim()
  if (!text) return
  void run(async () => {
    await relation.addPriority(props.target, text)
    draft.value = ''
  })
}

function startEdit(id: string, text: string) {
  editingId.value = id
  editDraft.value = text
}

function saveEdit(id: string) {
  const text = editDraft.value.trim()
  if (!text) return
  void run(async () => {
    await relation.updatePriority(id, { text })
    editingId.value = null
  })
}

function toggle(id: string, isDone: boolean) {
  void run(() => relation.updatePriority(id, { done_at: isDone ? null : new Date().toISOString() }))
}
</script>

<template>
  <section class="card column" :class="accent">
    <header class="head">
      <h3 class="title">{{ title }}</h3>
      <span class="count">{{ active.length }}</span>
    </header>

    <ol v-if="active.length" class="items">
      <li v-for="(item, index) in active" :key="item.id" class="item">
        <button class="check" type="button" aria-label="Marquer comme fait" @click="toggle(item.id, false)" />
        <span class="rank">{{ index + 1 }}</span>
        <form v-if="editingId === item.id" class="edit" @submit.prevent="saveEdit(item.id)">
          <input v-model="editDraft" class="input" type="text" maxlength="200" @keydown.esc="editingId = null" />
          <button class="btn btn-small btn-primary" type="submit">OK</button>
        </form>
        <button v-else class="text" type="button" @click="startEdit(item.id, item.text)">{{ item.text }}</button>
        <span v-if="editingId !== item.id" class="actions">
          <button type="button" :disabled="index === 0" aria-label="Monter" @click="run(() => relation.movePriority(item.id, -1))">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button type="button" :disabled="index === active.length - 1" aria-label="Descendre" @click="run(() => relation.movePriority(item.id, 1))">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button type="button" aria-label="Supprimer" @click="run(() => relation.removePriority(item.id))">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      </li>
    </ol>
    <p v-else class="empty">Rien à prioriser pour l'instant.</p>

    <form class="add" novalidate @submit.prevent="add">
      <input v-model="draft" class="input" type="text" maxlength="200" placeholder="Ajouter une priorité" />
      <button class="btn btn-small" type="submit" :disabled="!draft.trim()">Ajouter</button>
    </form>

    <div v-if="done.length" class="done">
      <button class="done-toggle" type="button" @click="showDone = !showDone">
        {{ showDone ? 'Masquer' : 'Voir' }} les {{ done.length }} réalisée{{ done.length > 1 ? 's' : '' }}
      </button>
      <ul v-if="showDone" class="done-list">
        <li v-for="item in done" :key="item.id">
          <button class="check checked" type="button" aria-label="Remettre en cours" @click="toggle(item.id, true)">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </button>
          <span class="done-text">{{ item.text }}</span>
        </li>
      </ul>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.column {
  --col: var(--accent);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 18px;
  border-top: 3px solid var(--col);
}

.column.secondary {
  --col: var(--secondary);
}

.column.both {
  background:
    radial-gradient(260px 120px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 500;
}

.title::first-letter {
  text-transform: uppercase;
}

.count {
  padding: 1px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--col) 15%, transparent);
  color: var(--col);
  font-size: 12px;
  font-weight: 700;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1.5px solid var(--border-strong);
  border-radius: 6px;
  background: transparent;
  color: var(--bg);
}

.check:hover {
  border-color: var(--col);
}

.check.checked {
  border-color: var(--col);
  background: var(--col);
}

.rank {
  flex-shrink: 0;
  width: 18px;
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--col);
  text-align: center;
}

.text {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  overflow-wrap: anywhere;
}

.edit {
  display: flex;
  flex: 1;
  gap: 6px;
  min-width: 0;
}

.edit .input {
  min-height: 34px;
}

.actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
}

.actions button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-faint);
}

.actions button:hover:not(:disabled) {
  background: var(--surface-raised);
  color: var(--text);
}

.actions button:disabled {
  opacity: 0.25;
  cursor: default;
}

.empty {
  font-size: 13px;
  color: var(--text-faint);
}

.add {
  display: flex;
  gap: 6px;
}

.add .input {
  min-height: 36px;
  font-size: 14px;
}

.done {
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.done-toggle {
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.done-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 0;
  list-style: none;
}

.done-list li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.done-text {
  font-size: 13px;
  color: var(--text-faint);
  text-decoration: line-through;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (pointer: coarse) {
  .actions button {
    width: 32px;
    height: 32px;
  }
}
</style>
