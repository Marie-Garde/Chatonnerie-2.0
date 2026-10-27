<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  value: string
  multiline?: boolean
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="copy-field" :class="{ multiline }">
    <pre v-if="multiline" class="value">{{ value }}</pre>
    <code v-else class="value">{{ value }}</code>
    <button class="btn btn-small copy" type="button" @click="copy">
      {{ copied ? 'Copié' : 'Copier' }}
    </button>
  </div>
</template>

<style scoped>
.copy-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border-strong);
}

.copy-field.multiline {
  flex-direction: column;
  align-items: stretch;
  padding: 14px;
}

.value {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: var(--accent);
  white-space: nowrap;
}

.multiline .value {
  max-height: 320px;
  overflow-y: auto;
  color: var(--text);
  line-height: 1.6;
  white-space: pre-wrap;
}

.copy {
  flex-shrink: 0;
}

.multiline .copy {
  align-self: flex-end;
}
</style>
