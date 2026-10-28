<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BilanSection from '@/components/relation/BilanSection.vue'
import LandmarksSection from '@/components/relation/LandmarksSection.vue'
import LanguageSection from '@/components/relation/LanguageSection.vue'
import ManualSection from '@/components/relation/ManualSection.vue'
import PageTabs from '@/components/ui/PageTabs.vue'
import WishBoard from '@/components/wishes/WishBoard.vue'
import NonMonoBoard from '@/components/nonmono/NonMonoBoard.vue'
import { useCoupleStore } from '@/stores/couple'
import { useRelationStore } from '@/stores/relation'

const couple = useCoupleStore()
const relation = useRelationStore()

const error = ref(false)

const tabs = [
  { id: 'nous', label: 'Nous' },
  { id: 'envies', label: 'Envies' },
  { id: 'non-monogamie', label: 'Non-monogamie' },
] as const

const sections = [
  { id: 'bilan', label: 'Bilan' },
  { id: 'amour', label: "Langages de l'amour" },
  { id: 'excuses', label: 'Langages des excuses' },
  { id: 'mode-emploi', label: "Mode d'emploi" },
  { id: 'reperes', label: 'Nos repères' },
] as const

async function load() {
  error.value = false
  try {
    await relation.fetch()
  } catch {
    error.value = true
  }
}

onMounted(load)
watch(() => couple.coupleId, load)
</script>

<template>
  <div class="relation">
    <header class="page-header">
      <p class="eyebrow">Relation</p>
      <h1 class="title">Ce qui nous lie</h1>
    </header>

    <PageTabs v-slot="{ active }" :tabs="tabs" label="Sections de la relation">
      <div v-if="active === 'nous'" class="nous">
        <PageTabs v-slot="{ active: section }" :tabs="sections" label="Thèmes de Nous" query-key="section" variant="pills">
          <div v-if="!relation.loaded && !error" class="card skeleton" />
          <p v-else-if="error" class="card error">Ces informations n'ont pas pu être chargées. Recharge la page pour réessayer.</p>
          <BilanSection v-else-if="section === 'bilan'" />
          <LanguageSection v-else-if="section === 'amour'" key="love" kind="love" />
          <LanguageSection v-else-if="section === 'excuses'" key="apology" kind="apology" />
          <ManualSection v-else-if="section === 'mode-emploi'" />
          <LandmarksSection v-else />
        </PageTabs>
      </div>
      <WishBoard v-else-if="active === 'envies'" />
      <NonMonoBoard v-else />
    </PageTabs>
  </div>
</template>

<style scoped>
.relation {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1080px;
}

.nous {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton {
  height: 320px;
  background: var(--surface-raised);
}

.error {
  color: var(--secondary);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.muted {
  font-size: 14px;
  color: var(--text-muted);
}
</style>
