<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SideNav from '@/components/layout/SideNav.vue'
import InvitationBanner from '@/components/couple/InvitationBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useProgressStore } from '@/stores/progress'
import { useRelationStore } from '@/stores/relation'
import { useSessionsStore } from '@/stores/sessions'
import { useTagsStore } from '@/stores/tags'
import { useWishesStore } from '@/stores/wishes'

const auth = useAuthStore()
const couple = useCoupleStore()
const progress = useProgressStore()
const relation = useRelationStore()
const sessions = useSessionsStore()
const tags = useTagsStore()
const wishes = useWishesStore()
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
    progress.reset()
    relation.reset()
    wishes.reset()
    if (userId) void couple.fetch()
    else {
      couple.reset()
      tags.reset()
    }
  },
  { immediate: true },
)

watch(
  () => [auth.user?.id, couple.partner?.user_id],
  ([userId]) => {
    if (userId) void tags.fetch().catch(() => {})
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
  min-height: 100dvh;
}

.app-main {
  flex: 1;
  min-width: 0;
  overflow-x: clip;
  padding: 40px 48px 64px;
}

@media (max-width: 768px) {
  .app-shell {
    flex-direction: column;
  }

  .app-main {
    padding: 20px 16px calc(32px + env(safe-area-inset-bottom));
  }
}
</style>
