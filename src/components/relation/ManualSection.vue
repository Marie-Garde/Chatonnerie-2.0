<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { MANUAL_FIELDS, type ManualFieldId } from '@/lib/languages'
import { useCoupleStore } from '@/stores/couple'
import { useRelationStore } from '@/stores/relation'

const couple = useCoupleStore()
const relation = useRelationStore()

const view = ref<'moi' | 'partenaire'>('moi')
const form = reactive(Object.fromEntries(MANUAL_FIELDS.map((f) => [f.id, ''])) as Record<ManualFieldId, string>)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const mine = computed(() => relation.manualOf(relation.myId))
const theirs = computed(() => (relation.partnerId ? relation.manualOf(relation.partnerId) : null))
const partnerName = computed(() => couple.partner?.display_name ?? '')
const theirFields = computed(() => MANUAL_FIELDS.filter((f) => theirs.value?.[f.id]?.trim()))

watch(
  mine,
  (manual) => {
    for (const field of MANUAL_FIELDS) form[field.id] = manual?.[field.id] ?? ''
  },
  { immediate: true },
)

async function save() {
  error.value = ''
  saving.value = true
  try {
    const values = Object.fromEntries(MANUAL_FIELDS.map((f) => [f.id, form[f.id].trim()])) as Record<ManualFieldId, string>
    await relation.saveManual(values)
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch {
    error.value = 'Ton mode d’emploi n’a pas pu être enregistré.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="manual">
    <div class="head">
      <div>
        <h2 class="section-title">Mode d'emploi</h2>
        <p class="intro">Ce que l'autre gagnerait à savoir sur toi, surtout dans les moments difficiles.</p>
      </div>
      <div v-if="couple.partner" class="switch" role="tablist" aria-label="Vue">
        <button type="button" role="tab" :aria-selected="view === 'moi'" :class="{ active: view === 'moi' }" @click="view = 'moi'">
          Le mien
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="view === 'partenaire'"
          :class="{ active: view === 'partenaire' }"
          class="capitalize"
          @click="view = 'partenaire'"
        >
          Celui de {{ partnerName }}
        </button>
      </div>
    </div>

    <template v-if="view === 'moi'">
      <div class="card fields">
        <label v-for="field in MANUAL_FIELDS" :key="field.id" class="field">
          <span class="label">{{ field.label }}</span>
          <textarea v-model="form[field.id]" class="input" rows="3" :placeholder="field.placeholder" />
        </label>
      </div>

      <div class="save-bar">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-else-if="saved" class="saved">Enregistré</p>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="theirFields.length" class="read">
        <div v-for="field in theirFields" :key="field.id" class="card read-item">
          <p class="read-label">{{ field.label }}</p>
          <p class="read-value">{{ theirs?.[field.id] }}</p>
        </div>
      </div>
      <div v-else class="card empty">
        <p><span class="capitalize">{{ partnerName }}</span> n'a pas encore rempli son mode d'emploi.</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.manual {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.intro {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.capitalize {
  text-transform: capitalize;
}

.switch {
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.switch button {
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.switch button.active {
  background: var(--surface-raised);
  color: var(--text);
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 20px;
}

.fields .field:last-child {
  grid-column: 1 / -1;
}

.save-bar {
  position: sticky;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.save-bar p {
  margin-right: auto;
}

.saved {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

.read {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.read-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.read-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.read-value {
  white-space: pre-line;
  line-height: 1.6;
}

.empty {
  padding: 36px 24px;
  text-align: center;
  color: var(--text-muted);
}

@media (max-width: 760px) {
  .fields {
    grid-template-columns: 1fr;
  }

  .save-bar {
    bottom: var(--mobile-nav-offset);
  }
}
</style>
