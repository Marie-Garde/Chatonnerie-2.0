<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const authorizationId = computed(() =>
  typeof route.query.authorization_id === 'string' ? route.query.authorization_id : '',
)

const details = ref<OAuthAuthorizationDetails | null>(null)
const loading = ref(true)
const deciding = ref<'approve' | 'deny' | null>(null)
const error = ref('')

const clientName = computed(() => details.value?.client.name || 'Une application')

const permissions = [
  'Lire tes séances, les séances à deux et celles que ton ou ta partenaire te partage',
  'Enregistrer de nouveaux comptes-rendus en brouillon',
  'Modifier les séances que tu peux déjà modifier sur le site',
]

onMounted(async () => {
  if (!authorizationId.value) {
    error.value = 'Cette demande d’autorisation est incomplète.'
    loading.value = false
    return
  }

  const { data, error: err } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId.value)
  if (err || !data) {
    error.value = 'Cette demande d’autorisation a expiré ou n’existe pas. Relance la connexion depuis Claude.'
    loading.value = false
    return
  }

  if (!('authorization_id' in data)) {
    window.location.href = data.redirect_url
    return
  }

  details.value = data
  loading.value = false
})

async function decide(approve: boolean) {
  error.value = ''
  deciding.value = approve ? 'approve' : 'deny'
  const { data, error: err } = approve
    ? await supabase.auth.oauth.approveAuthorization(authorizationId.value)
    : await supabase.auth.oauth.denyAuthorization(authorizationId.value)

  if (err || !data) {
    error.value = 'La réponse n’a pas pu être envoyée. Réessaie dans un instant.'
    deciding.value = null
    return
  }
  window.location.href = data.redirect_url
}
</script>

<template>
  <div class="consent">
    <div class="consent-card card">
      <div class="logos" aria-hidden="true">
        <span class="logo">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <ellipse cx="6" cy="9" rx="2" ry="2.6" />
            <ellipse cx="10" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="14" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="18" cy="9" rx="2" ry="2.6" />
            <path d="M12 11c-3.2 0-6 3.4-6 6.2 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8C18 14.4 15.2 11 12 11z" />
          </svg>
        </span>
        <span class="link-dots">
          <span />
          <span />
          <span />
        </span>
        <span class="logo logo-client">{{ clientName.charAt(0).toUpperCase() }}</span>
      </div>

      <div v-if="loading" class="skeleton" />

      <template v-else-if="details">
        <h1 class="title"><span class="client">{{ clientName }}</span> veut accéder à ton espace</h1>
        <p class="subtitle">
          Connecté en tant que <strong>{{ auth.displayName }}</strong> ({{ details.user.email }})
        </p>

        <ul class="permissions">
          <li v-for="permission in permissions" :key="permission">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {{ permission }}
          </li>
        </ul>

        <p class="note">
          Tes séances privées restent invisibles pour ton ou ta partenaire, y compris dans son Claude. Tu pourras retirer cet accès à tout moment.
        </p>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <div class="actions">
          <button class="btn" type="button" :disabled="!!deciding" @click="decide(false)">
            {{ deciding === 'deny' ? 'Refus…' : 'Refuser' }}
          </button>
          <button class="btn btn-primary" type="button" :disabled="!!deciding" @click="decide(true)">
            {{ deciding === 'approve' ? 'Autorisation…' : 'Autoriser' }}
          </button>
        </div>
      </template>

      <template v-else>
        <h1 class="title">Autorisation impossible</h1>
        <p class="error" role="alert">{{ error }}</p>
        <RouterLink to="/" class="btn back">Retour à Chatonnerie</RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.consent {
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px 16px;
}

.consent-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 460px;
  padding: 36px 32px;
  background:
    radial-gradient(360px 180px at 50% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.logos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 8px;
}

.logo {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent-line);
}

.logo-client {
  background: var(--secondary-soft);
  color: var(--secondary);
  border-color: rgba(var(--secondary-rgb), 0.25);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
}

.link-dots {
  display: flex;
  gap: 5px;
}

.link-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border-strong);
}

.skeleton {
  height: 220px;
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
}

.client {
  color: var(--accent);
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
}

.subtitle strong {
  color: var(--text);
  text-transform: capitalize;
}

.permissions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
  list-style: none;
}

.permissions li {
  display: flex;
  gap: 10px;
  font-size: 14px;
  line-height: 1.45;
}

.permissions svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--accent);
}

.note {
  font-size: 13px;
  color: var(--text-muted);
}

.error {
  font-size: 13px;
  color: var(--secondary);
  text-align: center;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.actions .btn,
.back {
  justify-content: center;
  height: 44px;
}
</style>
