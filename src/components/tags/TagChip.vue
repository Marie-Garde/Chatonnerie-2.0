<script setup lang="ts">
import { computed } from 'vue'
import { tagHex } from '@/lib/tagColors'
import { useTagsStore } from '@/stores/tags'

const props = defineProps<{
  name: string
  active?: boolean
  small?: boolean
}>()

const tags = useTagsStore()
const hex = computed(() => tagHex(tags.find(props.name)?.color))
</script>

<template>
  <span class="tag" :class="{ active, small }" :style="{ '--tag': hex }">
    <span class="dot" />
    {{ name }}
    <slot />
  </span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tag) 30%, transparent);
  background: color-mix(in srgb, var(--tag) 12%, transparent);
  color: var(--tag);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.tag.small {
  padding: 1px 8px;
  font-size: 12px;
}

.tag.active {
  background: var(--tag);
  border-color: var(--tag);
  color: var(--bg);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
</style>
