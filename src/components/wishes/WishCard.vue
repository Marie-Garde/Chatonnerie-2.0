<script setup lang="ts">
import { computed, ref } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import WishItemForm from '@/components/wishes/WishItemForm.vue'
import { formatSessionDate } from '@/lib/format'
import { TAG_COLORS, TAG_COLOR_KEYS } from '@/lib/tagColors'
import { useCoupleStore } from '@/stores/couple'
import { useWishesStore, type WishItem, type WishItemInput, type WishList } from '@/stores/wishes'

type SortKey = 'deadline' | 'recent' | 'title' | 'budget'

const props = defineProps<{
  list: WishList
  items: WishItem[]
  isFirst: boolean
  isLast: boolean
}>()

const emit = defineEmits<{ manageTags: [] }>()

const couple = useCoupleStore()
const wishes = useWishesStore()

const sort = ref<SortKey>('deadline')
const adding = ref(false)
const editingId = ref<string | null>(null)
const openId = ref<string | null>(null)
const highlightId = ref<string | null>(null)
const renaming = ref(false)
const titleDraft = ref('')
const menuOpen = ref(false)
const confirmingDelete = ref(false)
const error = ref('')

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'deadline', label: 'Date limite' },
  { value: 'recent', label: 'Plus récentes' },
  { value: 'title', label: 'Alphabétique' },
  { value: 'budget', label: 'Budget' },
]

const accent = computed(() => TAG_COLORS[props.list.color] ?? TAG_COLORS.lavande)

function compare(a: WishItem, b: WishItem) {
  switch (sort.value) {
    case 'deadline':
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return b.created_at.localeCompare(a.created_at)
    case 'recent':
      return b.created_at.localeCompare(a.created_at)
    case 'title':
      return a.title.localeCompare(b.title, 'fr')
    case 'budget':
      return (a.budget ?? 99) - (b.budget ?? 99)
  }
}

const sorted = computed(() => {
  const todo = props.items.filter((i) => !i.done_at).sort(compare)
  const done = props.items.filter((i) => i.done_at).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))
  return [...todo, ...done]
})

const todoCount = computed(() => props.items.filter((i) => !i.done_at).length)

function daysUntil(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y!, m! - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function deadlineState(item: WishItem) {
  if (!item.deadline || item.done_at) return ''
  const days = daysUntil(item.deadline)
  if (days < 0) return 'overdue'
  if (days <= 14) return 'soon'
  return ''
}

function deadlineLabel(date: string) {
  const days = daysUntil(date)
  if (days < 0) return `Dépassée depuis le ${formatSessionDate(date, { day: 'numeric', month: 'short' })}`
  if (days === 0) return "Aujourd'hui"
  if (days <= 14) return `Dans ${days} j`
  return `Avant le ${formatSessionDate(date, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function wantedLabel(id: string | null) {
  if (!id) return null
  return couple.nameOf(id)
}

async function run(action: () => Promise<unknown>) {
  error.value = ''
  try {
    await action()
  } catch {
    error.value = 'Ça n’a pas fonctionné. Réessaie dans un instant.'
  }
}

function add(values: WishItemInput) {
  void run(async () => {
    await wishes.createItem(props.list.id, values)
    adding.value = false
  })
}

function update(id: string, values: WishItemInput) {
  void run(async () => {
    await wishes.updateItem(id, values)
    editingId.value = null
  })
}

function pickRandom() {
  const candidates = props.items.filter((i) => !i.done_at)
  if (!candidates.length) return
  const pick = candidates[Math.floor(Math.random() * candidates.length)]!
  highlightId.value = pick.id
  openId.value = pick.id
  setTimeout(() => {
    if (highlightId.value === pick.id) highlightId.value = null
  }, 2400)
}

function startRename() {
  titleDraft.value = props.list.title
  renaming.value = true
  menuOpen.value = false
}

function saveRename() {
  const title = titleDraft.value.trim()
  if (!title || title === props.list.title) {
    renaming.value = false
    return
  }
  void run(async () => {
    await wishes.updateList(props.list.id, { title })
    renaming.value = false
  })
}
</script>

<template>
  <article class="card wish-card" :style="{ '--list': accent }">
    <header class="head">
      <span class="dot" />
      <form v-if="renaming" class="rename" @submit.prevent="saveRename">
        <input v-model="titleDraft" class="input" type="text" maxlength="60" @keydown.esc="renaming = false" />
        <button class="btn btn-small btn-primary" type="submit">OK</button>
      </form>
      <h3 v-else class="title">{{ list.title }}</h3>
      <span v-if="!renaming" class="count">{{ todoCount }}</span>
      <div class="menu">
        <button class="icon-btn" type="button" aria-label="Options de la carte" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        <div v-if="menuOpen" class="menu-panel">
          <button type="button" @click="startRename">Renommer</button>
          <div class="colors">
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ active: list.color === key }"
              :style="{ background: TAG_COLORS[key] }"
              :aria-label="`Couleur ${key}`"
              @click="run(() => wishes.updateList(list.id, { color: key }))"
            />
          </div>
          <button type="button" :disabled="isFirst" @click="run(() => wishes.moveList(list.id, -1))">Déplacer avant</button>
          <button type="button" :disabled="isLast" @click="run(() => wishes.moveList(list.id, 1))">Déplacer après</button>
          <template v-if="confirmingDelete">
            <p class="menu-warning">Supprimer la carte et ses {{ items.length }} envies ?</p>
            <div class="menu-confirm">
              <button type="button" @click="confirmingDelete = false">Non</button>
              <button type="button" class="danger" @click="run(() => wishes.removeList(list.id))">Supprimer</button>
            </div>
          </template>
          <button v-else type="button" class="danger" @click="confirmingDelete = true">Supprimer la carte</button>
        </div>
      </div>
    </header>

    <div class="toolbar">
      <label class="sort">
        <span class="sort-label">Trier par</span>
        <select v-model="sort" aria-label="Trier">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </label>
      <button v-if="todoCount > 1" class="random" type="button" @click="pickRandom">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
        Au hasard
      </button>
    </div>

    <ul v-if="sorted.length" class="items">
      <li
        v-for="item in sorted"
        :key="item.id"
        class="item"
        :class="{ done: !!item.done_at, highlight: highlightId === item.id }"
      >
        <WishItemForm
          v-if="editingId === item.id"
          :item="item"
          submit-label="Enregistrer"
          @submit="update(item.id, $event)"
          @cancel="editingId = null"
          @manage-tags="emit('manageTags')"
        />
        <template v-else>
          <div class="item-row">
            <button
              type="button"
              class="check"
              :class="{ checked: !!item.done_at }"
              :aria-label="item.done_at ? 'Marquer comme pas encore fait' : 'Marquer comme fait'"
              @click="run(() => wishes.toggleDone(item))"
            >
              <svg v-if="item.done_at" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </button>
            <button type="button" class="item-main" @click="openId = openId === item.id ? null : item.id">
              <span class="item-title">{{ item.title }}</span>
              <span class="meta">
                <TagChip v-if="item.tag" :name="item.tag" scope="envies" small />
                <span v-if="item.deadline && !item.done_at" class="deadline" :class="deadlineState(item)">
                  {{ deadlineLabel(item.deadline) }}
                </span>
                <span v-if="item.budget" class="budget">{{ '€'.repeat(item.budget) }}</span>
                <span v-if="wantedLabel(item.wanted_by)" class="wanted capitalize">♡ {{ wantedLabel(item.wanted_by) }}</span>
                <span v-if="item.done_at" class="done-label">
                  Fait le {{ new Date(item.done_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}
                </span>
              </span>
            </button>
          </div>
          <div v-if="openId === item.id" class="item-detail">
            <p v-if="item.description" class="description">{{ item.description }}</p>
            <div class="item-actions">
              <button class="link" type="button" @click="editingId = item.id">Modifier</button>
              <button class="link danger" type="button" @click="run(() => wishes.removeItem(item.id))">Supprimer</button>
            </div>
          </div>
        </template>
      </li>
    </ul>
    <p v-else-if="!adding" class="empty">Aucune envie ici pour l'instant.</p>

    <WishItemForm
      v-if="adding"
      submit-label="Ajouter"
      @submit="add"
      @cancel="adding = false"
      @manage-tags="emit('manageTags')"
    />
    <button v-else class="add" type="button" @click="adding = true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Ajouter une envie
    </button>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </article>
</template>

<style scoped>
.wish-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-top: 3px solid var(--list);
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--list);
}

.title {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 500;
}

.rename {
  display: flex;
  flex: 1;
  gap: 6px;
}

.rename .input {
  min-height: 34px;
}

.count {
  padding: 1px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--list) 15%, transparent);
  color: var(--list);
  font-size: 12px;
  font-weight: 700;
}

.menu {
  position: relative;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-faint);
}

.icon-btn:hover {
  background: var(--surface-raised);
  color: var(--text);
}

.menu-panel {
  position: absolute;
  top: 34px;
  right: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 200px;
  padding: 6px;
  border-radius: var(--radius);
  background: var(--surface-raised);
  border: 1px solid var(--border-strong);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.menu-panel > button,
.menu-confirm button {
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 13px;
  text-align: left;
}

.menu-panel > button:hover:not(:disabled),
.menu-confirm button:hover {
  background: var(--surface);
}

.menu-panel button:disabled {
  opacity: 0.4;
  cursor: default;
}

.danger {
  color: var(--secondary);
}

.colors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
}

.swatch {
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
}

.swatch.active {
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 4px var(--text-muted);
}

.menu-warning {
  padding: 6px 10px 0;
  font-size: 12px;
  color: var(--text-muted);
}

.menu-confirm {
  display: flex;
  gap: 4px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sort {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-faint);
}

.sort select {
  appearance: none;
  padding: 2px 16px 2px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sort select:hover,
.sort select:focus-visible {
  color: var(--list);
  outline: none;
}

.sort select option {
  background: var(--surface-raised);
  color: var(--text);
}

.sort svg {
  position: absolute;
  right: 0;
  pointer-events: none;
}

.random {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px dashed var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.random:hover {
  border-color: var(--list);
  color: var(--list);
}

.items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  list-style: none;
}

.item {
  border-radius: var(--radius-sm);
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
}

.item.highlight {
  background: color-mix(in srgb, var(--list) 14%, transparent);
  box-shadow: 0 0 0 2px var(--list);
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 6px;
}

.check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  padding: 0;
  border: 1.5px solid var(--border-strong);
  border-radius: 6px;
  background: transparent;
  color: var(--bg);
}

.check:hover {
  border-color: var(--list);
}

.check.checked {
  border-color: var(--list);
  background: var(--list);
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
}

.item-title {
  font-weight: 600;
  font-size: 14px;
}

.done .item-title {
  color: var(--text-faint);
  text-decoration: line-through;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-faint);
}

.deadline.soon {
  color: var(--secondary);
  font-weight: 600;
}

.deadline.overdue {
  color: var(--secondary);
  font-weight: 700;
}

.budget {
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.capitalize {
  text-transform: capitalize;
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 6px 10px 36px;
}

.description {
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-line;
}

.item-actions {
  display: flex;
  gap: 14px;
}

.link {
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.link:hover {
  color: var(--accent);
}

.link.danger:hover {
  color: var(--secondary);
}

.empty {
  padding: 12px 0;
  font-size: 13px;
  color: var(--text-faint);
}

.add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.add:hover {
  background: color-mix(in srgb, var(--list) 12%, transparent);
  color: var(--list);
}

.error {
  font-size: 13px;
  color: var(--secondary);
}
</style>
