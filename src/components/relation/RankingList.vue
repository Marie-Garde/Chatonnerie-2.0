<script setup lang="ts">
import { ref } from 'vue'
import type { LanguageDefinition } from '@/lib/languages'

const props = defineProps<{
  languages: LanguageDefinition[]
  label: string
}>()

const model = defineModel<string[]>({ required: true })
const dragging = ref<number | null>(null)

function definition(id: string) {
  return props.languages.find((l) => l.id === id)
}

function move(from: number, to: number) {
  if (to < 0 || to >= model.value.length || from === to) return
  const next = [...model.value]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  model.value = next
}

function onDrop(index: number) {
  if (dragging.value !== null) move(dragging.value, index)
  dragging.value = null
}
</script>

<template>
  <div class="ranking">
    <p class="ranking-label">{{ label }}</p>
    <ol class="items">
      <li
        v-for="(id, index) in model"
        :key="id"
        class="item"
        :class="{ dragging: dragging === index, top: index === 0 }"
        draggable="true"
        @dragstart="dragging = index"
        @dragend="dragging = null"
        @dragover.prevent
        @drop="onDrop(index)"
      >
        <span class="rank">{{ index + 1 }}</span>
        <span class="text">
          <span class="name">{{ definition(id)?.name }}</span>
          <span class="description">{{ definition(id)?.description }}</span>
        </span>
        <span class="arrows">
          <button type="button" :disabled="index === 0" :aria-label="`Monter ${definition(id)?.name}`" @click="move(index, index - 1)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            :disabled="index === model.length - 1"
            :aria-label="`Descendre ${definition(id)?.name}`"
            @click="move(index, index + 1)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ranking {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 10px 12px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
  cursor: grab;
  transition:
    border-color 0.2s,
    opacity 0.2s;
}

.item.top {
  border-color: var(--accent-line);
}

.item.dragging {
  opacity: 0.4;
}

.rank {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-raised);
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--text-muted);
}

.top .rank {
  background: var(--accent);
  color: var(--on-accent);
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.35;
}

.name {
  font-weight: 600;
  font-size: 14px;
}

.description {
  font-size: 12px;
  color: var(--text-faint);
}

.arrows {
  display: flex;
  flex-direction: column;
}

.arrows button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
}

.arrows button:hover:not(:disabled) {
  background: var(--surface-raised);
  color: var(--accent);
}

.arrows button:disabled {
  opacity: 0.25;
  cursor: default;
}

@media (pointer: coarse) {
  .arrows {
    flex-direction: row;
    gap: 4px;
  }

  .arrows button {
    width: 36px;
    height: 36px;
    background: var(--surface-raised);
  }

  .item {
    cursor: default;
  }
}
</style>
