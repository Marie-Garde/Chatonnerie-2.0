<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const initial = computed(() => auth.displayName.charAt(0).toUpperCase())

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
  <aside class="sidenav">
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

@media (max-width: 768px) {
  .sidenav {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    flex-direction: row;
    justify-content: center;
    width: 100%;
    height: auto;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    border-right: none;
    border-top: 1px solid var(--border);
  }

  .brand,
  .nav-label,
  .sidenav-footer {
    display: none;
  }

  .nav {
    flex-direction: row;
  }

  .nav-link.router-link-active::before {
    display: none;
  }
}
</style>
