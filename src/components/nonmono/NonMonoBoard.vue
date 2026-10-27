<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AgreementsCard from '@/components/nonmono/AgreementsCard.vue'
import CareCard from '@/components/nonmono/CareCard.vue'
import LimitsCard from '@/components/nonmono/LimitsCard.vue'
import RulesCard from '@/components/nonmono/RulesCard.vue'
import { useCoupleStore } from '@/stores/couple'
import { useNonMonoStore } from '@/stores/nonmono'

const couple = useCoupleStore()
const nm = useNonMonoStore()

const loadError = ref(false)

async function load() {
  loadError.value = false
  try {
    await nm.fetch()
  } catch {
    loadError.value = true
  }
}

onMounted(load)
watch(() => couple.coupleId, load)
</script>

<template>
  <div class="board">
    <div v-if="couple.loaded && !couple.partner" class="card empty">
      <p class="empty-title">Cet espace se construit à deux</p>
      <p class="muted">Invite ton ou ta partenaire pour poser vos accords ensemble.</p>
      <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">Inviter</RouterLink>
    </div>

    <p v-else-if="loadError" class="card error">Ces informations n'ont pas pu être chargées. Recharge la page pour réessayer.</p>

    <div v-else-if="!nm.loaded" class="card skeleton" />

    <template v-else>
      <AgreementsCard />
      <div class="grid">
        <RulesCard />
        <LimitsCard />
      </div>
      <CareCard />
    </template>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 24px;
  text-align: center;
}

.empty-title {
  font-weight: 600;
}

.muted {
  font-size: 14px;
  color: var(--text-muted);
}

.error {
  color: var(--secondary);
}

.skeleton {
  height: 260px;
  background: var(--surface-raised);
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
