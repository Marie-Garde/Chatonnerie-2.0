<script setup lang="ts">
import { computed, ref } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import { TAG_COLOR_KEYS, normalizeTagName } from '@/lib/tagColors'
import { useTagsStore } from '@/stores/tags'

const model = defineModel<string[]>({ required: true })

const tags = useTagsStore()

const draft = ref('')
const creating = ref(false)
const error = ref('')

const orphanTags = computed(() => model.value.filter((name) => !tags.find(name)))

function toggle(name: string) {
  model.value = model.value.includes(name) ? model.value.filter((t) => t !== name) : [...model.value, name]
}

async function createTag() {
  const name = normalizeTagName(draft.value)
  if (!name) return
  error.value = ''
  creating.value = true
  try {
    const color = TAG_COLOR_KEYS[tags.tags.length % TAG_COLOR_KEYS.length]!
    const tag = await tags.create(name, color)
    if (!model.value.includes(tag.name)) model.value = [...model.value, tag.name]
    draft.value = ''
  } catch {
    error.value = 'Le tag n’a pas pu être créé.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="picker">
    <div v-if="tags.tags.length || orphanTags.length" class="options">
      <button v-for="tag in tags.tags" :key="tag.id" type="button" class="option" @click="toggle(tag.name)">
        <TagChip :name="tag.name" :active="model.includes(tag.name)" />
      </button>
      <button v-for="name in orphanTags" :key="name" type="button" class="option" @click="toggle(name)">
        <TagChip :name="name" active />
      </button>
    </div>
    <p v-else class="hint">Aucun tag pour l'instant. Crée le premier ci-dessous.</p>

    <div class="create">
      <input
        v-model="draft"
        class="input"
        type="text"
        maxlength="40"
        placeholder="Nouveau tag (ex. belle-famille)"
        @keydown.enter.prevent="createTag"
      />
      <button class="btn btn-small" type="button" :disabled="creating || !draft.trim()" @click="createTag">
        Ajouter
      </button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option {
  padding: 0;
  border: none;
  background: none;
  border-radius: 999px;
}

.option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.create {
  display: flex;
  gap: 8px;
}

.create .input {
  flex: 1;
  min-height: 38px;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}
</style>
