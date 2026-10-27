<script setup lang="ts">
import { computed, ref } from 'vue'
import { coupleErrorMessage, useCoupleStore } from '@/stores/couple'

const couple = useCoupleStore()

const email = ref('')
const busy = ref(false)
const error = ref('')
const confirmingLeave = ref(false)

const partnerInitial = computed(() => couple.partner?.display_name.charAt(0).toUpperCase() ?? '')

const sinceLabel = computed(() => {
  if (!couple.partner) return ''
  return new Date(couple.partner.joined_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

async function run(action: () => Promise<void>) {
  error.value = ''
  busy.value = true
  try {
    await action()
  } catch (err) {
    error.value = coupleErrorMessage(err)
  } finally {
    busy.value = false
  }
}

function invite() {
  if (!email.value.trim()) {
    error.value = 'Renseigne l’email de ton ou ta partenaire.'
    return
  }
  void run(async () => {
    await couple.invite(email.value.trim())
    email.value = ''
  })
}

function leave() {
  void run(async () => {
    await couple.leave()
    confirmingLeave.value = false
  })
}
</script>

<template>
  <section class="card">
    <h2 class="section-title">Ton couple</h2>
    <p class="muted">Les séances partagées et le dossier sont communs aux deux membres du couple.</p>

    <div v-if="!couple.loaded" class="placeholder" />

    <div v-else-if="couple.partner" class="partner">
      <span class="avatar">{{ partnerInitial }}</span>
      <div class="partner-info">
        <span class="partner-name">{{ couple.partner.display_name }}</span>
        <span class="faint">Ensemble depuis le {{ sinceLabel }}</span>
      </div>
      <div class="partner-actions">
        <template v-if="confirmingLeave">
          <span class="faint">Quitter le couple ?</span>
          <button class="btn btn-small" type="button" :disabled="busy" @click="confirmingLeave = false">
            Annuler
          </button>
          <button class="btn btn-small btn-danger" type="button" :disabled="busy" @click="leave">
            Quitter
          </button>
        </template>
        <button v-else class="btn btn-small" type="button" @click="confirmingLeave = true">
          Quitter le couple
        </button>
      </div>
    </div>

    <div v-else-if="couple.sentInvitation" class="pending">
      <span class="pulse" aria-hidden="true" />
      <div class="pending-info">
        <span>Invitation envoyée à <strong>{{ couple.sentInvitation.invited_email }}</strong></span>
        <span class="faint">Elle apparaîtra quand cette personne se connectera avec cette adresse.</span>
      </div>
      <button
        class="btn btn-small"
        type="button"
        :disabled="busy"
        @click="run(() => couple.cancelInvitation(couple.sentInvitation!.id))"
      >
        Annuler
      </button>
    </div>

    <form v-else class="invite" novalidate @submit.prevent="invite">
      <label class="field">
        <span class="label">Inviter ton ou ta partenaire</span>
        <div class="invite-row">
          <input
            v-model="email"
            class="input"
            type="email"
            autocomplete="off"
            placeholder="chaton@exemple.fr"
            @input="error = ''"
          />
          <button class="btn btn-primary" type="submit" :disabled="busy">
            {{ busy ? 'Envoi…' : 'Inviter' }}
          </button>
        </div>
      </label>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.faint {
  font-size: 13px;
  color: var(--text-faint);
}

.placeholder {
  height: 64px;
  margin-top: 20px;
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.partner,
.pending {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.partner-info,
.pending-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.4;
}

.partner-name {
  font-weight: 600;
  text-transform: capitalize;
}

.pending-info strong {
  color: var(--accent);
  font-weight: 600;
}

.partner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.pending .btn {
  margin-left: auto;
}

.pulse {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--secondary);
  box-shadow: 0 0 0 0 rgba(var(--secondary-rgb), 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 10px rgba(var(--secondary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--secondary-rgb), 0);
  }
}

.invite {
  margin-top: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.invite-row {
  display: flex;
  gap: 10px;
}

.input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input::placeholder {
  color: var(--text-faint);
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.error {
  margin-top: 12px;
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 600px) {
  .partner,
  .pending {
    flex-wrap: wrap;
  }

  .partner-actions,
  .pending .btn {
    margin-left: 0;
  }

  .invite-row {
    flex-direction: column;
  }
}
</style>
