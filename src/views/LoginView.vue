<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthApiError } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const isSignup = computed(() => route.name === 'signup')

const displayName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const confirmationSentTo = ref('')

watch(isSignup, () => {
  error.value = ''
  confirmationSentTo.value = ''
})

function validate() {
  if (isSignup.value && !displayName.value.trim()) return 'Choisis un pseudo.'
  if (!email.value.trim() || !password.value) return 'Renseigne ton email et ton mot de passe.'
  if (isSignup.value && password.value.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.'
  return ''
}

function signupErrorMessage(err: unknown) {
  if (err instanceof AuthApiError) {
    if (err.code === 'user_already_exists') return 'Un compte existe déjà avec cet email.'
    if (err.code === 'weak_password') return 'Ce mot de passe est trop faible.'
    if (err.code === 'signup_disabled') return 'Les inscriptions sont fermées pour le moment.'
    if (err.code === 'email_address_invalid') return "Cette adresse email n'est pas valide."
  }
  return "L'inscription n'a pas fonctionné. Réessaie dans un instant."
}

async function redirectAfterAuth() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.replace(redirect)
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    if (isSignup.value) {
      const { needsConfirmation } = await auth.signUp(
        email.value.trim(),
        password.value,
        displayName.value.trim(),
      )
      if (needsConfirmation) {
        confirmationSentTo.value = email.value.trim()
        return
      }
    } else {
      await auth.signIn(email.value.trim(), password.value)
    }
    await redirectAfterAuth()
  } catch (err) {
    if (isSignup.value) {
      error.value = signupErrorMessage(err)
    } else if (err instanceof AuthApiError && err.code === 'email_not_confirmed') {
      error.value = "Ton email n'est pas encore confirmé. Regarde ta boîte mail."
    } else {
      error.value = 'Email ou mot de passe incorrect.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login-card card">
      <div class="brand">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <ellipse cx="6" cy="9" rx="2" ry="2.6" />
            <ellipse cx="10" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="14" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="18" cy="9" rx="2" ry="2.6" />
            <path d="M12 11c-3.2 0-6 3.4-6 6.2 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8C18 14.4 15.2 11 12 11z" />
          </svg>
        </span>
        <h1 class="title">Chatonnerie</h1>
        <p class="subtitle">
          {{
            isSignup
              ? 'Crée ton compte pour rejoindre votre espace.'
              : 'Content de te revoir. Connecte-toi pour retrouver votre espace.'
          }}
        </p>
      </div>

      <div v-if="confirmationSentTo" class="confirmation">
        <p class="confirmation-title">Plus qu'une étape</p>
        <p class="confirmation-text">
          On t'a envoyé un lien de confirmation à <strong>{{ confirmationSentTo }}</strong>. Clique dessus pour activer ton compte.
        </p>
        <RouterLink :to="{ name: 'login' }" class="btn submit">Retour à la connexion</RouterLink>
      </div>

      <form v-else class="form" novalidate @submit.prevent="submit">
        <label v-if="isSignup" class="field">
          <span class="label">Pseudo</span>
          <input
            v-model="displayName"
            class="input"
            type="text"
            autocomplete="nickname"
            maxlength="40"
            placeholder="Chaton"
            @input="error = ''"
          />
        </label>
        <label class="field">
          <span class="label">Email</span>
          <input
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="chaton@exemple.fr"
            @input="error = ''"
          />
        </label>
        <label class="field">
          <span class="label">Mot de passe</span>
          <input
            v-model="password"
            class="input"
            type="password"
            :autocomplete="isSignup ? 'new-password' : 'current-password'"
            :placeholder="isSignup ? '8 caractères minimum' : '••••••••'"
            @input="error = ''"
          />
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button class="btn btn-primary submit" type="submit" :disabled="loading">
          <template v-if="isSignup">{{ loading ? 'Création…' : 'Créer mon compte' }}</template>
          <template v-else>{{ loading ? 'Connexion…' : 'Se connecter' }}</template>
        </button>

        <p class="switch">
          <template v-if="isSignup">
            Déjà un compte ?
            <RouterLink :to="{ name: 'login', query: route.query }">Se connecter</RouterLink>
          </template>
          <template v-else>
            Pas encore de compte ?
            <RouterLink :to="{ name: 'signup', query: route.query }">Créer un compte</RouterLink>
          </template>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 36px 32px;
  background:
    radial-gradient(360px 180px at 50% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 16px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent-line);
}

.title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.subtitle {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 28px;
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

.input {
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
  font-size: 13px;
  color: var(--secondary);
}

.submit {
  justify-content: center;
  height: 44px;
  margin-top: 4px;
}

.submit:disabled {
  opacity: 0.7;
  cursor: progress;
}

.switch {
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}

.switch a {
  font-weight: 600;
  color: var(--accent);
}

.switch a:hover {
  color: var(--accent-hover);
}

.confirmation {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 28px;
  padding: 20px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  text-align: center;
}

.confirmation-title {
  font-weight: 600;
  color: var(--accent);
}

.confirmation-text {
  font-size: 14px;
  color: var(--text-muted);
}

.confirmation-text strong {
  color: var(--text);
}

.confirmation .submit {
  margin-top: 8px;
}
</style>
