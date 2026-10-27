<script setup lang="ts">
import { installPrompt, isIos, isStandalone, promptInstall } from '@/lib/install'
</script>

<template>
  <section v-if="!isStandalone" class="card install">
    <img class="icon" src="/icons/icon-192.png" alt="" width="52" height="52" />
    <div class="body">
      <h2 class="title">Installer Chatonnerie</h2>
      <p v-if="installPrompt" class="text">Ajoute l'appli à ton écran d'accueil pour l'ouvrir en plein écran.</p>
      <p v-else-if="isIos" class="text">
        Dans Safari, appuie sur <strong>Partager</strong>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
        puis <strong>Sur l'écran d'accueil</strong>.
      </p>
      <p v-else class="text">
        Dans le menu du navigateur (⋮), choisis <strong>Installer l'application</strong> ou
        <strong>Ajouter à l'écran d'accueil</strong>.
      </p>
    </div>
    <button v-if="installPrompt" class="btn btn-small btn-primary" type="button" @click="promptInstall">Installer</button>
  </section>
</template>

<style scoped>
.install {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  background:
    radial-gradient(320px 160px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.icon {
  flex-shrink: 0;
  border-radius: 12px;
}

.body {
  flex: 1;
  min-width: 0;
}

.title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.text {
  margin-top: 2px;
  font-size: 14px;
  color: var(--text-muted);
}

.text strong {
  color: var(--text);
}

.text svg {
  vertical-align: -2px;
  color: var(--accent);
}

@media (max-width: 420px) {
  .install {
    flex-wrap: wrap;
  }

  .install .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
