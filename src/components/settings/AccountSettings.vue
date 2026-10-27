<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const initial = computed(() => auth.displayName.charAt(0).toUpperCase())
</script>

<template>
  <section class="card account">
    <span class="avatar">{{ initial }}</span>
    <div class="info">
      <span class="name">{{ auth.displayName }}</span>
      <span class="email">{{ auth.user?.email }}</span>
    </div>
    <button class="btn btn-small btn-danger" type="button" @click="auth.signOut()">Se déconnecter</button>
  </section>
</template>

<style scoped>
.account {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--secondary-soft);
  color: var(--secondary);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.name {
  font-weight: 600;
  text-transform: capitalize;
}

.email {
  overflow: hidden;
  font-size: 13px;
  color: var(--text-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .account {
    flex-wrap: wrap;
  }

  .account .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
