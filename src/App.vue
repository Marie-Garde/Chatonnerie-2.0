<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SideNav from '@/components/layout/SideNav.vue'
import InvitationBanner from '@/components/couple/InvitationBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useSessionsStore } from '@/stores/sessions'

const auth = useAuthStore()
const couple = useCoupleStore()
const sessions = useSessionsStore()
const route = useRoute()
const router = useRouter()

const showNav = computed(() => auth.isAuthenticated && !route.meta.public && !route.meta.bare)

watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && auth.ready && !route.meta.public) {
      void router.replace({ name: 'login' })
    }
  },
)

watch(
  () => auth.user?.id,
  (userId) => {
    sessions.reset()
    if (userId) void couple.fetch()
    else couple.reset()
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="showNav" class="app-shell">
    <SideNav />
    <main class="app-main">
      <InvitationBanner />
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  min-width: 0;
  padding: 40px 48px 64px;
}

@media (max-width: 768px) {
  .app-shell {
    flex-direction: column;
  }

  .app-main {
    padding: 24px 16px 96px;
  }
}
</style>
