<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import TagChip from '@/components/tags/TagChip.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useTagsStore } from '@/stores/tags'
import type { WishItem, WishItemInput } from '@/stores/wishes'

const props = defineProps<{
  item?: WishItem
  submitLabel: string
}>()

const emit = defineEmits<{
  submit: [values: WishItemInput]
  cancel: []
  manageTags: []
}>()

const auth = useAuthStore()
const couple = useCoupleStore()
const tags = useTagsStore()

const form = reactive({
  title: props.item?.title ?? '',
  description: props.item?.description ?? '',
  deadline: props.item?.deadline ?? '',
  tag: props.item?.tag ?? '',
  budget: props.item?.budget ?? null,
  wanted_by: props.item?.wanted_by ?? null,
})
const error = ref('')

const tagOptions = computed(() => {
  const names = tags.wishTags.map((t) => t.name)
  return form.tag && !names.includes(form.tag) ? [...names, form.tag] : names
})

const budgets = [
  { value: null, label: '—' },
  { value: 1, label: '€' },
  { value: 2, label: '€€' },
  { value: 3, label: '€€€' },
]

const people = computed(() => [
  { value: null, label: 'Nous deux' },
  { value: auth.user?.id ?? '', label: auth.displayName },
  ...(couple.partner ? [{ value: couple.partner.user_id, label: couple.partner.display_name }] : []),
])

function submit() {
  if (!form.title.trim()) {
    error.value = 'Donne un titre à cette envie.'
    return
  }
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    deadline: form.deadline || null,
    tag: form.tag || null,
    budget: form.budget,
    wanted_by: form.wanted_by || null,
  })
}
</script>

<template>
  <form class="wish-form" novalidate @submit.prevent="submit">
    <input
      v-model="form.title"
      class="input"
      type="text"
      maxlength="120"
      placeholder="Un week-end à Lisbonne"
      @input="error = ''"
    />
    <textarea v-model="form.description" class="input" rows="2" placeholder="Description, lien, idée… (facultatif)" />

    <label class="field deadline">
      <span class="label">Date limite</span>
      <input v-model="form.deadline" class="input" type="date" />
    </label>

    <div class="field">
      <span class="label">Tag</span>
      <div class="tag-options">
        <button
          v-for="name in tagOptions"
          :key="name"
          type="button"
          class="tag-option"
          :aria-pressed="form.tag === name"
          @click="form.tag = form.tag === name ? '' : name"
        >
          <TagChip :name="name" scope="envies" small :active="form.tag === name" />
        </button>
        <button type="button" class="manage" @click="emit('manageTags')">
          {{ tagOptions.length ? 'Gérer les tags' : '+ Créer des tags' }}
        </button>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Budget</span>
        <div class="segmented">
          <button
            v-for="b in budgets"
            :key="String(b.value)"
            type="button"
            :class="{ active: form.budget === b.value }"
            @click="form.budget = b.value"
          >
            {{ b.label }}
          </button>
        </div>
      </div>
      <div class="field">
        <span class="label">Qui en a envie</span>
        <div class="segmented">
          <button
            v-for="p in people"
            :key="String(p.value)"
            type="button"
            class="capitalize"
            :class="{ active: form.wanted_by === p.value }"
            @click="form.wanted_by = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button class="btn btn-small" type="button" @click="emit('cancel')">Annuler</button>
      <button class="btn btn-small btn-primary" type="submit">{{ submitLabel }}</button>
    </div>
  </form>
</template>

<style scoped>
.wish-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--accent-line);
}

.deadline {
  max-width: 220px;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tag-option {
  padding: 0;
  border: none;
  background: none;
  border-radius: 999px;
}

.manage {
  padding: 2px 6px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.manage:hover {
  color: var(--accent);
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.input {
  min-height: 38px;
  font-size: 14px;
}

.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.segmented button {
  padding: 5px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.segmented button.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.capitalize {
  text-transform: capitalize;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
