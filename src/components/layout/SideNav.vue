<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const initial = computed(() => auth.displayName.charAt(0).toUpperCase())

const open = ref(false)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(
  () => route.fullPath,
  () => (open.value = false),
)

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})

const currentLabel = computed(() => links.find((l) => route.path.startsWith(l.to))?.label ?? '')

const icons = {
  heart: ['M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6a5 5 0 1 1 7.5 6.6z'],
  rings: ['M15 12a6 6 0 1 1-12 0a6 6 0 1 1 12 0z', 'M21 12a6 6 0 1 1-12 0a6 6 0 1 1 12 0z'],
  sliders: [
    'M4 6h9',
    'M17 6h3',
    'M4 12h3',
    'M11 12h9',
    'M4 18h11',
    'M19 18h1',
    'M15 4v4',
    'M9 10v4',
    'M17 16v4',
  ],
}

const links: { to: string; label: string; icon: keyof typeof icons }[] = [
  { to: '/therapie', label: 'Thérapie', icon: 'heart' },
  { to: '/relation', label: 'Relation', icon: 'rings' },
  { to: '/reglages', label: 'Réglages', icon: 'sliders' },
]
</script>

<template>
  <header class="mobile-bar">
    <RouterLink to="/" class="mobile-brand" aria-label="Chatonnerie">
      <span class="brand-mark small">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <ellipse cx="6" cy="9" rx="2" ry="2.6" />
            <ellipse cx="10" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="14" cy="5.5" rx="2" ry="2.6" />
            <ellipse cx="18" cy="9" rx="2" ry="2.6" />
            <path d="M12 11c-3.2 0-6 3.4-6 6.2 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8C18 14.4 15.2 11 12 11z" />
          </svg>
      </span>
      <span class="mobile-title">{{ currentLabel || 'Chatonnerie' }}</span>
    </RouterLink>
    <button
      class="burger"
      type="button"
      :aria-expanded="open"
      aria-controls="main-nav"
      :aria-label="open ? 'Fermer le menu' : 'Ouvrir le menu'"
      @click="open = !open"
    >
      <span class="burger-lines" :class="{ open }">
        <span />
        <span />
        <span />
      </span>
    </button>
  </header>

  <div v-if="open" class="backdrop" aria-hidden="true" @click="open = false" />

  <aside id="main-nav" class="sidenav" :class="{ open }">
    <RouterLink to="/" class="brand">
      <span class="brand-mark">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <ellipse cx="6" cy="9" rx="2" ry="2.6" />
          <ellipse cx="10" cy="5.5" rx="2" ry="2.6" />
          <ellipse cx="14" cy="5.5" rx="2" ry="2.6" />
          <ellipse cx="18" cy="9" rx="2" ry="2.6" />
          <path d="M12 11c-3.2 0-6 3.4-6 6.2 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8C18 14.4 15.2 11 12 11z" />
        </svg>
      </span>
      <span class="brand-name">Chatonnerie</span>
    </RouterLink>

    <nav class="nav">
      <p class="nav-label">Espace</p>
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :class="{ 'router-link-active': $route.path.startsWith(link.to) }"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="d in icons[link.icon]" :key="d" :d="d" />
        </svg>
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidenav-footer">
      <span class="avatar">{{ initial }}</span>
      <div class="user">
        <span class="user-name">{{ auth.displayName }}</span>
        <span class="user-email">{{ auth.user?.email }}</span>
      </div>
      <button class="logout" type="button" aria-label="Se déconnecter" title="Se déconnecter" @click="auth.signOut()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="M10 17l-5-5 5-5" />
          <path d="M5 12h11" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidenav {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: var(--sidebar-width);
  height: 100vh;
  flex-shrink: 0;
  padding: 28px 18px;
  background: var(--bg-deep);
  border-right: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent-line);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-label {
  padding: 0 12px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.nav-link:hover {
  background: var(--surface);
  color: var(--text);
}

.nav-link.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.nav-link.router-link-active::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}

.sidenav-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 10px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--secondary-soft);
  color: var(--secondary);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
}

.user {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  text-transform: capitalize;
}

.user-email {
  overflow: hidden;
  font-size: 12px;
  color: var(--text-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.logout:hover {
  background: var(--surface-raised);
  color: var(--secondary);
}

.mobile-bar,
.backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: calc(10px + env(safe-area-inset-top)) 12px 10px 16px;
    background: color-mix(in srgb, var(--bg-deep) 88%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .brand-mark.small {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
  }

  .mobile-title {
    overflow: hidden;
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .burger {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
  }

  .burger:active {
    background: var(--surface);
  }

  .burger-lines {
    position: relative;
    width: 20px;
    height: 14px;
  }

  .burger-lines span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background: currentColor;
    transition:
      transform 0.25s,
      opacity 0.2s,
      top 0.25s;
  }

  .burger-lines span:nth-child(1) {
    top: 0;
  }

  .burger-lines span:nth-child(2) {
    top: 6px;
  }

  .burger-lines span:nth-child(3) {
    top: 12px;
  }

  .burger-lines.open span:nth-child(1) {
    top: 6px;
    transform: rotate(45deg);
  }

  .burger-lines.open span:nth-child(2) {
    opacity: 0;
  }

  .burger-lines.open span:nth-child(3) {
    top: 6px;
    transform: rotate(-45deg);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: block;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    animation: fade 0.2s ease-out;
  }

  .sidenav {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    width: min(300px, 84vw);
    height: 100%;
    padding: calc(24px + env(safe-area-inset-top)) 18px calc(20px + env(safe-area-inset-bottom));
    visibility: hidden;
    transform: translateX(-100%);
    transition:
      transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
      visibility 0s linear 0.28s;
  }

  .sidenav.open {
    visibility: visible;
    transform: translateX(0);
    box-shadow: 12px 0 40px rgba(0, 0, 0, 0.4);
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .nav-link {
    padding: 13px 12px;
    font-size: 16px;
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}
</style>
