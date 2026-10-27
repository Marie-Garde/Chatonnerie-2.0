<script setup lang="ts">
defineProps<{
  label: string
  description?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="toggle" :class="{ disabled }">
    <span class="text">
      <span class="toggle-label">{{ label }}</span>
      <span v-if="description" class="toggle-description">{{ description }}</span>
    </span>
    <input v-model="model" class="sr-only" type="checkbox" role="switch" :disabled="disabled" />
    <span class="track" aria-hidden="true">
      <span class="thumb" />
    </span>
  </label>
</template>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
}

.toggle.disabled {
  cursor: progress;
  opacity: 0.7;
}

.text {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.toggle-label {
  font-weight: 600;
  font-size: 14px;
}

.toggle-description {
  font-size: 13px;
  color: var(--text-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.track {
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--surface-raised);
  border: 1px solid var(--border-strong);
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-muted);
  transition:
    transform 0.2s,
    background-color 0.2s;
}

input:checked + .track {
  background: var(--accent);
  border-color: var(--accent);
}

input:checked + .track .thumb {
  transform: translateX(18px);
  background: var(--on-accent);
}

input:focus-visible + .track {
  box-shadow: 0 0 0 3px var(--accent-soft);
}
</style>
