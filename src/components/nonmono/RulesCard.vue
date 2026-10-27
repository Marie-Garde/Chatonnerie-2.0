<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useCoupleStore } from '@/stores/couple'
import { useNonMonoStore, type Rule } from '@/stores/nonmono'

const couple = useCoupleStore()
const nm = useNonMonoStore()

const adding = ref(false)
const editingId = ref<string | null>(null)
const confirmingId = ref<string | null>(null)
const form = reactive({ text: '', detail: '' })
const error = ref('')

function startAdd() {
  form.text = ''
  form.detail = ''
  editingId.value = null
  adding.value = true
  error.value = ''
}

function startEdit(rule: Rule) {
  form.text = rule.text
  form.detail = rule.detail
  adding.value = false
  editingId.value = rule.id
  error.value = ''
}

async function submit() {
  if (!form.text.trim()) {
    error.value = 'Écris la règle.'
    return
  }
  error.value = ''
  try {
    if (editingId.value) await nm.updateRule(editingId.value, form.text.trim(), form.detail.trim())
    else await nm.addRule(form.text.trim(), form.detail.trim())
    adding.value = false
    editingId.value = null
  } catch {
    error.value = 'La règle n’a pas pu être enregistrée.'
  }
}

async function remove(id: string) {
  try {
    await nm.removeRule(id)
  } catch {
    error.value = 'La règle n’a pas pu être supprimée.'
  } finally {
    confirmingId.value = null
  }
}
</script>

<template>
  <section class="card rules">
    <div class="head">
      <div>
        <h2 class="section-title">Nos règles</h2>
        <p class="muted">Ce sur quoi on s'est mis d'accord, tous les deux.</p>
      </div>
      <button v-if="!adding" class="add" type="button" @click="startAdd">+ Ajouter</button>
    </div>

    <form v-if="adding" class="form" novalidate @submit.prevent="submit">
      <input v-model="form.text" class="input" type="text" maxlength="200" placeholder="On se prévient avant un premier rendez-vous" />
      <textarea v-model="form.detail" class="input" rows="2" placeholder="Précision, exception, pourquoi c'est important… (facultatif)" />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn btn-small" type="button" @click="adding = false">Annuler</button>
        <button class="btn btn-small btn-primary" type="submit">Ajouter</button>
      </div>
    </form>

    <ol v-if="nm.rules.length" class="list">
      <li v-for="(rule, index) in nm.rules" :key="rule.id" class="rule">
        <span class="number">{{ index + 1 }}</span>
        <form v-if="editingId === rule.id" class="form grow" novalidate @submit.prevent="submit">
          <input v-model="form.text" class="input" type="text" maxlength="200" />
          <textarea v-model="form.detail" class="input" rows="2" />
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <div class="actions">
            <button class="btn btn-small" type="button" @click="editingId = null">Annuler</button>
            <button class="btn btn-small btn-primary" type="submit">Enregistrer</button>
          </div>
        </form>
        <div v-else class="body">
          <p class="text">{{ rule.text }}</p>
          <p v-if="rule.detail" class="detail">{{ rule.detail }}</p>
          <div class="meta">
            <span v-if="rule.created_by" class="faint capitalize">{{ couple.nameOf(rule.created_by) }}</span>
            <button class="link" type="button" @click="startEdit(rule)">Modifier</button>
            <template v-if="confirmingId === rule.id">
              <button class="link" type="button" @click="confirmingId = null">Annuler</button>
              <button class="link danger" type="button" @click="remove(rule.id)">Confirmer la suppression</button>
            </template>
            <button v-else class="link danger" type="button" @click="confirmingId = rule.id">Supprimer</button>
          </div>
        </div>
      </li>
    </ol>
    <p v-else-if="!adding" class="empty">Pas encore de règle. Commencez par celles qui vous semblent évidentes : elles le sont rarement pour les deux.</p>
  </section>
</template>

<style scoped>
.rules {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.add {
  flex-shrink: 0;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.add:hover {
  background: var(--accent-soft);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grow {
  flex: 1;
  min-width: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
}

.rule {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
}

.number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 14px;
}

.body {
  flex: 1;
  min-width: 0;
}

.text {
  font-weight: 600;
}

.detail {
  margin-top: 2px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-line;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.faint {
  font-size: 12px;
  color: var(--text-faint);
}

.capitalize {
  text-transform: capitalize;
}

.link {
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.link:hover {
  color: var(--accent);
}

.link.danger:hover {
  color: var(--secondary);
}

.empty {
  font-size: 14px;
  color: var(--text-faint);
}

.error {
  font-size: 13px;
  color: var(--secondary);
}
</style>
