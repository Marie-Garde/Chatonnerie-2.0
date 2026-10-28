<script setup lang="ts">
import { computed } from 'vue'
import PriorityColumn from '@/components/relation/PriorityColumn.vue'
import { languageName } from '@/lib/languages'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useRelationStore } from '@/stores/relation'

const auth = useAuthStore()
const couple = useCoupleStore()
const relation = useRelationStore()

const people = computed(() => [
  { id: relation.myId, name: auth.displayName, accent: 'accent' as const },
  ...(couple.partner ? [{ id: couple.partner.user_id, name: couple.partner.display_name, accent: 'secondary' as const }] : []),
])

function loveOf(userId: string) {
  return relation.profileOf(userId, 'love')
}
</script>

<template>
  <section class="bilan">
    <div>
      <h2 class="section-title">Bilan</h2>
      <p class="intro">Notre tableau de bord : comment chacun se sent aimé, et ce sur quoi on se concentre en ce moment.</p>
    </div>

    <div class="languages">
      <article v-for="person in people" :key="person.id" class="card lang" :class="person.accent">
        <p class="who capitalize">{{ person.name }}</p>
        <template v-if="loveOf(person.id)">
          <p class="top-label">Se sent aimé·e surtout par</p>
          <p class="top">{{ languageName('love', loveOf(person.id)!.receive_rank[0] ?? '') }}</p>
          <ol class="rest">
            <li v-for="(id, i) in loveOf(person.id)!.receive_rank.slice(1, 3)" :key="id">
              <span class="rank">{{ i + 2 }}</span>{{ languageName('love', id) }}
            </li>
          </ol>
          <p v-if="loveOf(person.id)!.give_rank[0]" class="gives">
            Donne surtout en <strong>{{ languageName('love', loveOf(person.id)!.give_rank[0]!).toLowerCase() }}</strong>
          </p>
        </template>
        <p v-else class="missing">
          Pas encore rempli.
          <RouterLink v-if="person.id === relation.myId" :to="{ query: { section: 'amour' } }" class="link">Remplir mes langages</RouterLink>
        </p>
      </article>
    </div>

    <div>
      <h3 class="sub-title">Nos priorités</h3>
      <p class="intro">À entretenir en ce moment, pour l'un, pour l'autre et pour nous. Classez du plus important au moins important.</p>
    </div>

    <div v-if="!couple.partner" class="card empty">
      <p>Invite ton ou ta partenaire pour construire vos priorités ensemble.</p>
      <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">Inviter</RouterLink>
    </div>
    <div v-else class="priorities">
      <PriorityColumn
        v-for="person in people"
        :key="person.id"
        :target="person.id"
        :title="`Pour ${person.name}`"
        :accent="person.accent"
      />
      <PriorityColumn :target="null" title="Pour nous" accent="both" />
    </div>
  </section>
</template>

<style scoped>
.bilan {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.sub-title {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.languages {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.lang {
  --col: var(--accent);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background:
    radial-gradient(300px 140px at 100% 0%, color-mix(in srgb, var(--col) 14%, transparent), transparent 70%),
    var(--surface);
}

.lang.secondary {
  --col: var(--secondary);
}

.who {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.capitalize {
  text-transform: capitalize;
}

.top-label {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.top {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--col);
}

.rest {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 8px;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--text-muted);
}

.rest li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rank {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-raised);
  font-size: 11px;
  font-weight: 700;
}

.gives {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
}

.gives strong {
  color: var(--text);
}

.missing {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-faint);
}

.link {
  margin-left: 4px;
  font-weight: 600;
  color: var(--accent);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
  color: var(--text-muted);
}

.priorities {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

@media (max-width: 960px) {
  .priorities {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .languages {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
