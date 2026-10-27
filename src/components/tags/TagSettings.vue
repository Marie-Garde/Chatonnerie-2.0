<script setup lang="ts">
import { ref } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import { TAG_COLORS, TAG_COLOR_KEYS, type TagColor } from '@/lib/tagColors'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useTagsStore } from '@/stores/tags'

const auth = useAuthStore()
const couple = useCoupleStore()
const tags = useTagsStore()

const name = ref('')
const color = ref<TagColor>('lavande')
const busy = ref(false)
const error = ref('')
const confirmingId = ref<string | null>(null)

async function run(action: () => Promise<unknown>) {
  error.value = ''
  busy.value = true
  try {
    await action()
  } catch {
    error.value = 'L’opération n’a pas pu aboutir. Réessaie dans un instant.'
  } finally {
    busy.value = false
  }
}

function create() {
  if (!name.value.trim()) {
    error.value = 'Donne un nom au tag.'
    return
  }
  void run(async () => {
    await tags.create(name.value, color.value)
    name.value = ''
  })
}

function remove(id: string) {
  void run(async () => {
    await tags.remove(id)
    confirmingId.value = null
  })
}
</script>

<template>
  <section class="card">
    <h2 class="section-title">Tags</h2>
    <p class="muted">
      Les sujets que vous abordez. Ils sont partagés avec ton ou ta partenaire, servent à filtrer les séances, et Claude
      les utilise quand vous lui dites de quoi vous allez parler.
    </p>

    <ul v-if="tags.tags.length" class="list">
      <li v-for="tag in tags.tags" :key="tag.id" class="row">
        <TagChip :name="tag.name" />
        <span v-if="tag.created_by !== auth.user?.id" class="faint">créé par {{ couple.nameOf(tag.created_by) }}</span>
        <div v-else class="row-actions">
          <div class="swatches" role="radiogroup" :aria-label="`Couleur de ${tag.name}`">
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              role="radio"
              class="swatch"
              :class="{ active: tag.color === key }"
              :aria-checked="tag.color === key"
              :aria-label="key"
              :style="{ background: TAG_COLORS[key] }"
              @click="run(() => tags.updateColor(tag.id, key))"
            />
          </div>
          <template v-if="confirmingId === tag.id">
            <button class="btn btn-small" type="button" @click="confirmingId = null">Annuler</button>
            <button class="btn btn-small btn-danger" type="button" :disabled="busy" @click="remove(tag.id)">
              Supprimer
            </button>
          </template>
          <button
            v-else
            class="icon-btn"
            type="button"
            :aria-label="`Supprimer ${tag.name}`"
            @click="confirmingId = tag.id"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <form class="create" novalidate @submit.prevent="create">
      <input
        v-model="name"
        class="input"
        type="text"
        maxlength="40"
        placeholder="belle-famille, argent, intimité…"
        @input="error = ''"
      />
      <div class="swatches" role="radiogroup" aria-label="Couleur du nouveau tag">
        <button
          v-for="key in TAG_COLOR_KEYS"
          :key="key"
          type="button"
          role="radio"
          class="swatch"
          :class="{ active: color === key }"
          :aria-checked="color === key"
          :aria-label="key"
          :style="{ background: TAG_COLORS[key] }"
          @click="color = key"
        />
      </div>
      <button class="btn btn-primary" type="submit" :disabled="busy">Créer</button>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.faint {
  font-size: 13px;
  color: var(--text-faint);
}

.list {
  display: flex;
  flex-direction: column;
  margin-top: 18px;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.swatches {
  display: flex;
  gap: 6px;
}

.swatch {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  transition: transform 0.15s;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch.active {
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px var(--text-muted);
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
  color: var(--secondary);
}

.create {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.create .input {
  flex: 1;
  min-width: 200px;
}

.error {
  margin-top: 12px;
  font-size: 13px;
  color: var(--secondary);
}
</style>
