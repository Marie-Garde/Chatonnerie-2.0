<script setup lang="ts">
defineProps<{
  placeholder?: string
  addLabel: string
}>()

const model = defineModel<string[]>({ required: true })

function update(index: number, value: string) {
  const next = [...model.value]
  next[index] = value
  model.value = next
}

function add() {
  model.value = [...model.value, '']
}

function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="list">
    <div v-for="(item, index) in model" :key="index" class="row">
      <textarea
        class="input"
        rows="2"
        :value="item"
        :placeholder="placeholder"
        @input="update(index, ($event.target as HTMLTextAreaElement).value)"
      />
      <button type="button" class="remove" aria-label="Retirer" @click="remove(index)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
    <button type="button" class="add" @click="add">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {{ addLabel }}
    </button>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.remove {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin-top: 4px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-faint);
}

.remove:hover {
  background: var(--surface-raised);
  color: var(--secondary);
}

.add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 6px 12px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.add:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
