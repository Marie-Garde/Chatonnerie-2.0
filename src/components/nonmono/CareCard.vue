<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { CARE_FIELDS, INFO_LEVELS, useNonMonoStore, type CareFieldId, type InfoLevel } from '@/stores/nonmono'

const auth = useAuthStore()
const couple = useCoupleStore()
const nm = useNonMonoStore()

const view = ref<'partenaire' | 'moi'>(couple.partner ? 'partenaire' : 'moi')
const form = reactive({
  ...(Object.fromEntries(CARE_FIELDS.map((f) => [f.id, ''])) as Record<CareFieldId, string>),
  info_level: '' as InfoLevel,
  info_note: '',
})
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const partnerName = computed(() => couple.partner?.display_name ?? '')
const mine = computed(() => nm.careOf(auth.user?.id ?? ''))
const theirs = computed(() => (couple.partner ? nm.careOf(couple.partner.user_id) : null))
const theirFields = computed(() => CARE_FIELDS.filter((f) => theirs.value?.[f.id]?.trim()))
const theirInfoLabel = computed(() => INFO_LEVELS.find((l) => l.id === theirs.value?.info_level)?.label ?? '')

watch(
  mine,
  (care) => {
    for (const field of CARE_FIELDS) form[field.id] = care?.[field.id] ?? ''
    form.info_level = care?.info_level ?? ''
    form.info_note = care?.info_note ?? ''
  },
  { immediate: true },
)

async function save() {
  error.value = ''
  saving.value = true
  try {
    await nm.saveCare({
      ...(Object.fromEntries(CARE_FIELDS.map((f) => [f.id, form[f.id].trim()])) as Record<CareFieldId, string>),
      info_level: form.info_level,
      info_note: form.info_note.trim(),
    })
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch {
    error.value = 'Ça n’a pas pu être enregistré.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="card care">
    <div class="head">
      <div>
        <h2 class="section-title">Prendre soin de l'autre</h2>
        <p class="muted">Ce dont chacun a besoin pour se sentir en sécurité, avant, pendant et après.</p>
      </div>
      <div v-if="couple.partner" class="switch" role="tablist" aria-label="Vue">
        <button type="button" role="tab" :aria-selected="view === 'partenaire'" :class="{ active: view === 'partenaire' }" @click="view = 'partenaire'">
          Pour <span class="capitalize">{{ partnerName }}</span>
        </button>
        <button type="button" role="tab" :aria-selected="view === 'moi'" :class="{ active: view === 'moi' }" @click="view = 'moi'">
          Pour moi
        </button>
      </div>
    </div>

    <template v-if="view === 'partenaire'">
      <div v-if="theirFields.length || theirInfoLabel" class="read">
        <div v-if="theirInfoLabel" class="read-item info">
          <p class="read-label">Ce que <span class="capitalize">{{ partnerName }}</span> veut savoir</p>
          <p class="read-value strong">{{ theirInfoLabel }}</p>
          <p v-if="theirs?.info_note" class="read-value">{{ theirs.info_note }}</p>
        </div>
        <div v-for="field in theirFields" :key="field.id" class="read-item">
          <p class="read-label">{{ field.label }}</p>
          <p class="read-value">{{ theirs?.[field.id] }}</p>
        </div>
      </div>
      <p v-else class="empty"><span class="capitalize">{{ partnerName }}</span> n'a pas encore rempli cette partie.</p>
    </template>

    <template v-else>
      <div class="field">
        <span class="label">Ce que je veux savoir de ses rencontres</span>
        <div class="segmented">
          <button
            v-for="level in INFO_LEVELS"
            :key="level.id"
            type="button"
            :class="{ active: form.info_level === level.id }"
            @click="form.info_level = form.info_level === level.id ? '' : level.id"
          >
            {{ level.label }}
          </button>
        </div>
        <textarea v-model="form.info_note" class="input" rows="2" placeholder="Je veux savoir quand et avec qui, pas les détails" />
      </div>

      <div class="fields">
        <label v-for="field in CARE_FIELDS" :key="field.id" class="field">
          <span class="label">{{ field.label }}</span>
          <textarea v-model="form[field.id]" class="input" rows="3" :placeholder="field.placeholder" />
        </label>
      </div>

      <div class="save">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-else-if="saved" class="saved">Enregistré</p>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.care {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.muted {
  margin-top: 4px;
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

.read {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.read-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
}

.read-item.info {
  border-color: var(--accent-line);
  background: var(--accent-soft);
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

.read-value.strong {
  font-family: var(--font-display);
  font-size: 18px;
}

.empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.segmented button {
  padding: 6px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.segmented button.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.fields .field:last-child {
  grid-column: 1 / -1;
}

.save {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.save p {
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

@media (max-width: 760px) {
  .fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
