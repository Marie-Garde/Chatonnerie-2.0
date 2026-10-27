<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    tabs: readonly { id: T; label: string }[]
    label: string
    queryKey?: string
    variant?: 'tabs' | 'pills'
  }>(),
  { queryKey: 'onglet', variant: 'tabs' },
)

const route = useRoute()
const router = useRouter()

const active = computed<T>(() => {
  const value = route.query[props.queryKey]
  return props.tabs.find((tab) => tab.id === value)?.id ?? props.tabs[0]!.id
})

function select(id: T) {
  void router.replace({ query: { ...route.query, [props.queryKey]: id === props.tabs[0]!.id ? undefined : id } })
}
</script>

<template>
  <div class="tabs" :class="variant" role="tablist" :aria-label="label">
    <button
      v-for="tab in tabs"
      :id="`${queryKey}-tab-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      class="tab"
      :class="{ active: tab.id === active }"
      :aria-selected="tab.id === active"
      :aria-controls="`${queryKey}-panel-${tab.id}`"
      @click="select(tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>

  <div :id="`${queryKey}-panel-${active}`" role="tabpanel" :aria-labelledby="`${queryKey}-tab-${active}`">
    <slot :active="active" />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  align-self: flex-start;
  max-width: 100%;
  padding: 4px;
  overflow-x: auto;
  border-radius: var(--radius);
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.tab {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.tabs.pills {
  flex-wrap: wrap;
  padding: 0;
  overflow: visible;
  background: none;
  border: none;
  gap: 8px;
}

.pills .tab {
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px;
}

.pills .tab.active {
  border-color: var(--accent-line);
}

.tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
