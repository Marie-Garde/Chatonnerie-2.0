<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ label: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  panel.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div ref="panel" class="panel" role="dialog" aria-modal="true" :aria-label="label" tabindex="-1">
        <button class="close" type="button" aria-label="Fermer" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  animation: fade 0.15s ease-out;
}

.panel {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  border-radius: var(--radius-lg);
  outline: none;
  animation: rise 0.2s ease-out;
}

.close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
}

.close:hover {
  background: var(--surface-raised);
  color: var(--text);
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
