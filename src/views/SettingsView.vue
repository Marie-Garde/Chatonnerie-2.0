<script setup lang="ts">
import CoupleSettings from '@/components/couple/CoupleSettings.vue'
import AccountSettings from '@/components/settings/AccountSettings.vue'
import InstallCard from '@/components/settings/InstallCard.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import TagSettings from '@/components/tags/TagSettings.vue'
import PageTabs from '@/components/ui/PageTabs.vue'

const tabs = [
  { id: 'parametres', label: 'Paramètres' },
  { id: 'therapie', label: 'Thérapie' },
  { id: 'partenaire', label: 'Partenaire' },
] as const
</script>

<template>
  <div class="settings">
    <header class="page-header">
      <p class="eyebrow">Réglages</p>
      <h1 class="title">Ton espace, à ton goût</h1>
    </header>

    <PageTabs v-slot="{ active }" :tabs="tabs" label="Sections des réglages">
      <template v-if="active === 'parametres'">
        <AccountSettings />
        <InstallCard />
        <ThemeSettings />
      </template>
      <TagSettings v-else-if="active === 'therapie'" />
      <CoupleSettings v-else />
    </PageTabs>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1080px;
}
</style>
