<script setup lang="ts">
import { ref } from 'vue'
import { coupleErrorMessage, useCoupleStore } from '@/stores/couple'

const couple = useCoupleStore()

const busyId = ref<string | null>(null)
const error = ref('')

async function respond(id: string, accept: boolean) {
  error.value = ''
  busyId.value = id
  try {
    if (accept) await couple.acceptInvitation(id)
    else await couple.declineInvitation(id)
  } catch (err) {
    error.value = coupleErrorMessage(err)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div v-if="couple.receivedInvitations.length" class="banners">
    <div v-for="invitation in couple.receivedInvitations" :key="invitation.id" class="banner">
      <span class="banner-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6a5 5 0 1 1 7.5 6.6z" />
        </svg>
      </span>
      <div class="banner-text">
        <p class="banner-title">
          <span class="name">{{ invitation.inviter_name }}</span> t'invite à rejoindre son espace
        </p>
        <p class="banner-sub">Vous partagerez les séances à deux, le dossier et les séances que chacun choisit de partager.</p>
      </div>
      <div class="banner-actions">
        <button class="btn btn-small" type="button" :disabled="busyId === invitation.id" @click="respond(invitation.id, false)">
          Refuser
        </button>
        <button class="btn btn-small btn-primary" type="button" :disabled="busyId === invitation.id" @click="respond(invitation.id, true)">
          Accepter
        </button>
      </div>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.banners {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 1080px;
  margin-bottom: 28px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
}

.banner-mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
}

.banner-text {
  min-width: 0;
}

.banner-title {
  font-weight: 600;
}

.name {
  color: var(--accent);
  text-transform: capitalize;
}

.banner-sub {
  font-size: 13px;
  color: var(--text-muted);
}

.banner-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

@media (max-width: 700px) {
  .banner {
    flex-wrap: wrap;
  }

  .banner-actions {
    margin-left: 0;
  }
}
</style>
