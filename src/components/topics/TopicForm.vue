<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { useCoupleStore } from '@/stores/couple'
import type { DiscussionTopic, DiscussionTopicInput } from '@/stores/topics'

const props = defineProps<{
  topic?: DiscussionTopic
  submitLabel: string
  busy?: boolean
}>()

const emit = defineEmits<{
  submit: [values: DiscussionTopicInput]
  cancel: []
}>()

const couple = useCoupleStore()

const form = reactive({
  title: props.topic?.title ?? '',
  description: props.topic?.description ?? '',
  shared: props.topic?.shared ?? false,
})
const error = ref('')

const shareLabel = computed(() =>
  couple.partner ? `Visible par ${couple.partner.display_name}` : 'Visible par mon ou ma partenaire',
)

function submit() {
  if (!form.title.trim()) {
    error.value = 'Donne un titre à ce sujet.'
    return
  }
  emit('submit', { title: form.title.trim(), description: form.description.trim(), shared: form.shared })
}
</script>

<template>
  <form class="topic-form" novalidate @submit.prevent="submit">
    <input
      v-model="form.title"
      class="input"
      type="text"
      maxlength="160"
      placeholder="Comment on s'organise pour les vacances"
      @input="error = ''"
    />
    <textarea
      v-model="form.description"
      class="input"
      rows="3"
      placeholder="Ce que tu veux aborder, pourquoi ça compte pour toi… (facultatif)"
    />
    <ToggleSwitch
      v-model="form.shared"
      class="share"
      :label="shareLabel"
      :description="form.shared ? 'Ce sujet apparaîtra aussi de son côté.' : 'Pour l’instant, tu es seul·e à le voir.'"
    />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button v-if="topic" class="btn btn-small" type="button" @click="emit('cancel')">Annuler</button>
      <button class="btn btn-small btn-primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
    </div>
  </form>
</template>

<style scoped>
.topic-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  font-size: 14px;
}

.share {
  padding: 6px 2px;
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
</style>
