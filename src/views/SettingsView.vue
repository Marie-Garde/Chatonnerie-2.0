<script setup lang="ts">
import { computed, ref } from 'vue'
import CoupleSettings from '@/components/couple/CoupleSettings.vue'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_THEME, THEMES, type ThemeId } from '@/lib/themes'

const auth = useAuthStore()

const currentTheme = computed(() => auth.profile?.theme ?? DEFAULT_THEME)
const saving = ref<ThemeId | null>(null)
const error = ref('')

async function selectTheme(id: ThemeId) {
  if (id === currentTheme.value || saving.value) return
  error.value = ''
  saving.value = id
  try {
    await auth.updateTheme(id)
  } catch {
    error.value = "Le thème n'a pas pu être enregistré. Réessaie dans un instant."
  } finally {
    saving.value = null
  }
}
</script>

<template>
  <div class="settings">
    <header class="page-header">
      <p class="eyebrow">Réglages</p>
      <h1 class="title">Ton espace, à ton goût</h1>
      <p class="subtitle">Ton couple et les préférences de ton compte.</p>
    </header>

    <CoupleSettings />

    <section class="card">
      <div class="section-head">
        <div>
          <h2 class="section-title">Palette de couleurs</h2>
          <p class="muted">Choisis l'ambiance dans laquelle tu te sens le mieux.</p>
        </div>
      </div>

      <div class="themes" role="radiogroup" aria-label="Palette de couleurs">
        <button
          v-for="theme in THEMES"
          :key="theme.id"
          type="button"
          role="radio"
          class="theme"
          :class="{ active: theme.id === currentTheme }"
          :aria-checked="theme.id === currentTheme"
          :style="{ background: theme.colors.bg, borderColor: theme.colors.border }"
          @click="selectTheme(theme.id)"
        >
          <span class="preview" :style="{ background: theme.colors.surface, borderColor: theme.colors.border }">
            <span class="preview-line" :style="{ background: theme.colors.text }" />
            <span class="preview-line short" :style="{ background: theme.colors.text }" />
            <span class="preview-actions">
              <span class="preview-btn" :style="{ background: theme.colors.accent }" />
              <span class="preview-chip" :style="{ background: theme.colors.secondary }" />
            </span>
          </span>
          <span class="theme-info">
            <span class="theme-name" :style="{ color: theme.colors.text }">{{ theme.name }}</span>
            <span class="theme-description" :style="{ color: theme.colors.text }">{{ theme.description }}</span>
          </span>
          <span
            class="check"
            :style="{ background: theme.colors.accent, color: theme.colors.bg }"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1080px;
}

.eyebrow {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.subtitle {
  max-width: 560px;
  margin-top: 10px;
  color: var(--text-muted);
}

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

.themes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.theme {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border: 1px solid;
  border-radius: var(--radius);
  text-align: left;
  transition:
    transform 0.15s,
    box-shadow 0.2s;
}

.theme:hover {
  transform: translateY(-2px);
}

.theme.active {
  box-shadow:
    0 0 0 2px var(--bg),
    0 0 0 4px var(--accent);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid;
  border-radius: var(--radius-sm);
}

.preview-line {
  height: 6px;
  width: 80%;
  border-radius: 3px;
  opacity: 0.85;
}

.preview-line.short {
  width: 55%;
  opacity: 0.45;
}

.preview-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.preview-btn {
  width: 44px;
  height: 14px;
  border-radius: 4px;
}

.preview-chip {
  width: 24px;
  height: 14px;
  border-radius: 999px;
  opacity: 0.8;
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
}

.theme-description {
  font-size: 12px;
  opacity: 0.65;
}

.check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.theme.active .check {
  opacity: 1;
  transform: scale(1);
}

.error {
  margin-top: 14px;
  font-size: 13px;
  color: var(--secondary);
}
</style>
