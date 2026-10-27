<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import TagSettings from '@/components/tags/TagSettings.vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import WishCard from '@/components/wishes/WishCard.vue'
import { formatSessionDate } from '@/lib/format'
import { TAG_COLOR_KEYS } from '@/lib/tagColors'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useTagsStore } from '@/stores/tags'
import { useWishesStore, WISH_LIST_TEMPLATES, type WishItem } from '@/stores/wishes'

const auth = useAuthStore()
const couple = useCoupleStore()
const wishes = useWishesStore()
const tags = useTagsStore()

const managingTags = ref(false)

const loadError = ref(false)
const search = ref('')
const tagFilter = ref<string | null>(null)
type WhoFilter = 'all' | 'both' | 'me' | 'partner'
const whoFilter = ref<WhoFilter>('all')

const whoOptions = computed<{ value: WhoFilter; label: string }[]>(() => [
  { value: 'all', label: 'Toutes' },
  { value: 'both', label: 'Nous deux' },
  { value: 'me', label: 'Moi' },
  ...(couple.partner ? [{ value: 'partner' as const, label: couple.partner.display_name }] : []),
])
const showDone = ref(false)
const addingList = ref(false)
const newTitle = ref('')
const error = ref('')

async function load() {
  loadError.value = false
  try {
    await wishes.fetch()
  } catch {
    loadError.value = true
  }
}

onMounted(load)
watch(() => couple.coupleId, load)

const sortedLists = computed(() => [...wishes.lists].sort((a, b) => a.position - b.position))

const usedTags = computed(() => new Set(wishes.items.map((i) => i.tag).filter(Boolean)))
const filterTags = computed(() => tags.wishTags.filter((t) => usedTags.value.has(t.name)).map((t) => t.name))

const suggestedTemplates = computed(() =>
  WISH_LIST_TEMPLATES.filter((t) => !wishes.lists.some((l) => l.title.toLowerCase() === t.toLowerCase())),
)

function matches(item: WishItem) {
  if (!showDone.value && item.done_at) return false
  if (tagFilter.value && item.tag !== tagFilter.value) return false
  if (whoFilter.value === 'both' && item.wanted_by) return false
  if (whoFilter.value === 'me' && item.wanted_by !== auth.user?.id) return false
  if (whoFilter.value === 'partner' && item.wanted_by !== couple.partner?.user_id) return false
  const q = search.value.trim().toLowerCase()
  if (q && !`${item.title} ${item.description} ${item.tag ?? ''}`.toLowerCase().includes(q)) return false
  return true
}

function itemsFor(listId: string) {
  return wishes.items.filter((i) => i.list_id === listId && matches(i))
}

const upcoming = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + 30)
  return wishes.items
    .filter((i) => !i.done_at && i.deadline)
    .filter((i) => {
      const [y, m, d] = i.deadline!.split('-').map(Number)
      return new Date(y!, m! - 1, d) <= limit
    })
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
    .slice(0, 6)
})

const doneCount = computed(() => wishes.items.filter((i) => i.done_at).length)

function listTitle(id: string) {
  return wishes.lists.find((l) => l.id === id)?.title ?? ''
}

async function createList(title: string) {
  const clean = title.trim()
  if (!clean) {
    error.value = 'Donne un titre à la carte.'
    return
  }
  error.value = ''
  try {
    await wishes.createList(clean, TAG_COLOR_KEYS[wishes.lists.length % TAG_COLOR_KEYS.length]!)
    newTitle.value = ''
    addingList.value = false
  } catch {
    error.value = 'La carte n’a pas pu être créée.'
  }
}
</script>

<template>
  <div class="board">
    <div v-if="couple.loaded && !couple.partner" class="card empty">
      <p class="empty-title">Les envies se partagent à deux</p>
      <p class="muted">Invite ton ou ta partenaire pour construire votre liste d'envies.</p>
      <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">Inviter</RouterLink>
    </div>

    <p v-else-if="loadError" class="card error">Les envies n'ont pas pu être chargées. Recharge la page pour réessayer.</p>

    <div v-else-if="!wishes.loaded" class="card skeleton" />

    <template v-else>
      <section v-if="upcoming.length" class="upcoming">
        <h3 class="upcoming-title">Dans les 30 prochains jours</h3>
        <ul class="upcoming-list">
          <li v-for="item in upcoming" :key="item.id" class="upcoming-item">
            <span class="upcoming-date">{{ formatSessionDate(item.deadline!, { day: 'numeric', month: 'short' }) }}</span>
            <span class="upcoming-name">{{ item.title }}</span>
            <span class="faint">{{ listTitle(item.list_id) }}</span>
          </li>
        </ul>
      </section>

      <div v-if="wishes.lists.length" class="filters">
        <input v-model="search" class="input search" type="search" placeholder="Chercher une envie…" />
        <div class="segmented" role="radiogroup" aria-label="Qui en a envie">
          <button
            v-for="option in whoOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="whoFilter === option.value"
            :class="{ active: whoFilter === option.value }"
            @click="whoFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="btn btn-small tags-btn" type="button" @click="managingTags = true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
            <path d="M7.5 7.5h.01" />
          </svg>
          Tags
        </button>
        <button
          type="button"
          class="done-toggle"
          :class="{ active: showDone }"
          :aria-pressed="showDone"
          @click="showDone = !showDone"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Réalisées · {{ doneCount }}
        </button>
      </div>

      <div v-if="filterTags.length" class="tags">
        <button
          v-for="tag in filterTags"
          :key="tag"
          type="button"
          class="tag-filter"
          :aria-pressed="tagFilter === tag"
          @click="tagFilter = tagFilter === tag ? null : tag"
        >
          <TagChip :name="tag" scope="envies" :active="tagFilter === tag" />
        </button>
      </div>

      <div class="cards">
        <WishCard
          v-for="(list, index) in sortedLists"
          :key="list.id"
          :list="list"
          :items="itemsFor(list.id)"
          :is-first="index === 0"
          :is-last="index === sortedLists.length - 1"
          @manage-tags="managingTags = true"
        />

        <div class="card new-card">
          <template v-if="addingList || !wishes.lists.length">
            <h3 class="new-title">{{ wishes.lists.length ? 'Nouvelle carte' : 'Créez votre première carte' }}</h3>
            <div v-if="suggestedTemplates.length" class="templates">
              <button v-for="template in suggestedTemplates" :key="template" type="button" class="template" @click="createList(template)">
                + {{ template }}
              </button>
            </div>
            <form class="custom" novalidate @submit.prevent="createList(newTitle)">
              <input v-model="newTitle" class="input" type="text" maxlength="60" placeholder="Ou un titre à vous…" @input="error = ''" />
              <button class="btn btn-small btn-primary" type="submit">Créer</button>
            </form>
            <p v-if="error" class="error-text" role="alert">{{ error }}</p>
            <button v-if="wishes.lists.length" class="link" type="button" @click="addingList = false">Annuler</button>
          </template>
          <button v-else class="new-trigger" type="button" @click="addingList = true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouvelle carte
          </button>
        </div>
      </div>
    </template>

    <ModalDialog v-if="managingTags" label="Tags des envies" @close="managingTags = false">
      <TagSettings scope="envies" />
    </ModalDialog>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 24px;
  text-align: center;
}

.empty-title {
  font-weight: 600;
}

.muted {
  font-size: 14px;
  color: var(--text-muted);
}

.faint {
  font-size: 12px;
  color: var(--text-faint);
}

.error {
  color: var(--secondary);
}

.skeleton {
  height: 260px;
  background: var(--surface-raised);
}

.upcoming {
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  background: var(--secondary-soft);
  border: 1px solid rgba(var(--secondary-rgb), 0.25);
}

.upcoming-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--secondary);
}

.upcoming-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 8px;
  padding: 0;
  list-style: none;
}

.upcoming-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
}

.upcoming-date {
  font-weight: 700;
  color: var(--secondary);
}

.upcoming-name {
  font-weight: 600;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.search {
  flex: 1;
  min-width: 200px;
  min-height: 40px;
}

.segmented {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.segmented button {
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.segmented button:hover {
  color: var(--text);
}

.segmented button.active {
  background: var(--accent-soft);
  color: var(--accent);
}

@media (max-width: 600px) {
  .search {
    flex-basis: 100%;
  }

  .segmented {
    flex-basis: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .segmented button {
    flex: 1;
  }

  .cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

.done-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.done-toggle svg {
  opacity: 0.4;
}

.done-toggle:hover {
  color: var(--text);
}

.done-toggle.active {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  color: var(--accent);
}

.done-toggle.active svg {
  opacity: 1;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-filter {
  padding: 0;
  border: none;
  background: none;
  border-radius: 999px;
}

.tags-btn {
  min-height: 36px;
  border-radius: 999px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-items: start;
}

.new-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-style: dashed;
  background: transparent;
}

.new-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.templates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.template {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.template:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.custom {
  display: flex;
  gap: 8px;
}

.custom .input {
  min-height: 38px;
}

.error-text {
  font-size: 13px;
  color: var(--secondary);
}

.link {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.new-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-weight: 600;
}

.new-trigger:hover {
  color: var(--accent);
}
</style>
