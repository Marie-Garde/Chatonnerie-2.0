<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ placeholder?: string }>()

const model = defineModel<string[]>({ required: true })
const draft = ref('')

function add() {
  const value = draft.value.trim().replace(/,$/, '').toLowerCase()
  if (value && !model.value.includes(value)) model.value = [...model.value, value]
  draft.value = ''
}

function remove(tag: string) {
  model.value = model.value.filter((t) => t !== tag)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    add()
  } else if (event.key === 'Backspace' && !draft.value && model.value.length) {
    model.value = model.value.slice(0, -1)
  }
}
</script>

<template>
  <div class="tags input">
    <span v-for="tag in model" :key="tag" class="chip">
      {{ tag }}
      <button type="button" class="remove" :aria-label="`Retirer ${tag}`" @click="remove(tag)">×</button>
    </span>
    <input
      v-model="draft"
      class="tag-field"
      type="text"
      :placeholder="model.length ? '' : placeholder"
      @keydown="onKeydown"
      @blur="add"
    />
  </div>
</template>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: text;
}

.tags:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.chip {
  padding: 3px 4px 3px 10px;
}

.remove {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 15px;
  line-height: 1;
}

.remove:hover {
  background: var(--accent-soft);
}

.tag-field {
  flex: 1;
  min-width: 140px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
}

.tag-field:focus {
  outline: none;
}

.tag-field::placeholder {
  color: var(--text-faint);
}
</style>
