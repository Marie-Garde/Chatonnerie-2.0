<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useNonMonoStore, type LimitLevel } from '@/stores/nonmono'

const auth = useAuthStore()
const couple = useCoupleStore()
const nm = useNonMonoStore()

const draft = ref('')
const level = ref<LimitLevel>('hard')
const error = ref('')
const confirmingId = ref<string | null>(null)

const levels: { id: LimitLevel; label: string; hint: string }[] = [
  { id: 'hard', label: 'Hard limit', hint: 'Non négociable' },
  { id: 'soft', label: 'À discuter', hint: 'Possible, mais on en parle avant' },
]

const people = computed(() => [
  { id: auth.user?.id ?? '', name: 'Toi', mine: true },
  ...(couple.partner ? [{ id: couple.partner.user_id, name: couple.partner.display_name, mine: false }] : []),
])

function limitsOf(userId: string, lvl: LimitLevel) {
  return nm.limits.filter((l) => l.user_id === userId && l.level === lvl)
}

async function add() {
  if (!draft.value.trim()) {
    error.value = 'Écris la limite.'
    return
  }
  error.value = ''
  try {
    await nm.addLimit(level.value, draft.value.trim())
    draft.value = ''
  } catch {
    error.value = 'La limite n’a pas pu être ajoutée.'
  }
}

async function run(action: () => Promise<unknown>) {
  error.value = ''
  try {
    await action()
  } catch {
    error.value = 'Ça n’a pas fonctionné.'
  } finally {
    confirmingId.value = null
  }
}
</script>

<template>
  <section class="card limits">
    <div>
      <h2 class="section-title">Nos limites</h2>
      <p class="muted">Chacun écrit les siennes. Les hard limits ne se négocient pas, les autres se discutent avant.</p>
    </div>

    <div class="columns">
      <div v-for="person in people" :key="person.id" class="column">
        <p class="who capitalize">{{ person.name }}</p>

        <div v-for="lvl in levels" :key="lvl.id" class="group" :class="lvl.id">
          <p class="group-label">{{ lvl.label }}</p>
          <ul v-if="limitsOf(person.id, lvl.id).length" class="items">
            <li v-for="limit in limitsOf(person.id, lvl.id)" :key="limit.id" class="item">
              <span class="text">{{ limit.text }}</span>
              <span v-if="person.mine" class="item-actions">
                <template v-if="confirmingId === limit.id">
                  <button class="link" type="button" @click="confirmingId = null">Non</button>
                  <button class="link danger" type="button" @click="run(() => nm.removeLimit(limit.id))">Supprimer</button>
                </template>
                <template v-else>
                  <button
                    class="link"
                    type="button"
                    :title="lvl.id === 'hard' ? 'Passer en « à discuter »' : 'Passer en hard limit'"
                    @click="run(() => nm.updateLimit(limit.id, { level: lvl.id === 'hard' ? 'soft' : 'hard' }))"
                  >
                    {{ lvl.id === 'hard' ? '↓' : '↑' }}
                  </button>
                  <button class="link" type="button" :aria-label="`Supprimer ${limit.text}`" @click="confirmingId = limit.id">✕</button>
                </template>
              </span>
            </li>
          </ul>
          <p v-else class="none">{{ person.mine ? 'Rien pour l’instant.' : 'Rien d’indiqué.' }}</p>
        </div>

        <form v-if="person.mine" class="add" novalidate @submit.prevent="add">
          <div class="level-picker" role="radiogroup" aria-label="Type de limite">
            <button
              v-for="lvl in levels"
              :key="lvl.id"
              type="button"
              role="radio"
              :aria-checked="level === lvl.id"
              :class="[lvl.id, { active: level === lvl.id }]"
              @click="level = lvl.id"
            >
              {{ lvl.label }}
            </button>
          </div>
          <div class="add-row">
            <input v-model="draft" class="input" type="text" maxlength="200" placeholder="Pas de rendez-vous chez nous" @input="error = ''" />
            <button class="btn btn-small btn-primary" type="submit">Ajouter</button>
          </div>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.limits {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.who {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.capitalize {
  text-transform: capitalize;
}

.group {
  --level: var(--secondary);
  padding: 12px 14px;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--level) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--level) 25%, transparent);
}

.group.soft {
  --level: var(--accent);
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--level);
}

.items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
}

.text {
  min-width: 0;
}

.item-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.link {
  padding: 0 2px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-faint);
}

.link:hover {
  color: var(--accent);
}

.link.danger,
.link.danger:hover {
  color: var(--secondary);
}

.none {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-faint);
}

.add {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-picker {
  display: flex;
  gap: 6px;
}

.level-picker button {
  padding: 4px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.level-picker button.hard.active {
  border-color: var(--secondary);
  background: var(--secondary-soft);
  color: var(--secondary);
}

.level-picker button.soft.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.add-row {
  display: flex;
  gap: 8px;
}

.add-row .input {
  min-height: 38px;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 760px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
