<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RankingList from '@/components/relation/RankingList.vue'
import ListInput from '@/components/ui/ListInput.vue'
import { LANGUAGE_KINDS, defaultRank, languageName, type LanguageKind } from '@/lib/languages'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useRelationStore, type LanguageExamples, type LanguageProfile } from '@/stores/relation'

const props = defineProps<{ kind: LanguageKind }>()

const auth = useAuthStore()
const couple = useCoupleStore()
const relation = useRelationStore()

const config = computed(() => LANGUAGE_KINDS[props.kind])
const view = ref<'moi' | 'nous'>('moi')

const form = reactive({
  receive_rank: defaultRank(props.kind),
  give_rank: defaultRank(props.kind),
  examples: {} as Record<string, LanguageExamples>,
})
const openId = ref<string | null>(null)
const saving = ref(false)
const savedAt = ref(false)
const error = ref('')

const mine = computed(() => relation.profileOf(relation.myId, props.kind))
const theirs = computed(() => (relation.partnerId ? relation.profileOf(relation.partnerId, props.kind) : null))
const partnerName = computed(() => couple.partner?.display_name ?? '')

function loadForm(profile: LanguageProfile | null) {
  const ids = defaultRank(props.kind)
  const valid = (rank: string[] | undefined) =>
    rank && rank.length === ids.length && ids.every((id) => rank.includes(id)) ? [...rank] : [...ids]
  form.receive_rank = valid(profile?.receive_rank)
  form.give_rank = valid(profile?.give_rank)
  form.examples = Object.fromEntries(
    ids.map((id) => [
      id,
      {
        positive: [...(profile?.examples?.[id]?.positive ?? [])],
        negative: [...(profile?.examples?.[id]?.negative ?? [])],
      },
    ]),
  )
}

watch(mine, (profile) => loadForm(profile), { immediate: true })

function examplesFor(id: string) {
  return form.examples[id] ?? { positive: [], negative: [] }
}

function exampleCount(id: string) {
  const e = examplesFor(id)
  return e.positive.filter((x) => x.trim()).length + e.negative.filter((x) => x.trim()).length
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    const examples = Object.fromEntries(
      Object.entries(form.examples).map(([id, e]) => [
        id,
        {
          positive: e.positive.map((x) => x.trim()).filter(Boolean),
          negative: e.negative.map((x) => x.trim()).filter(Boolean),
        },
      ]),
    )
    await relation.saveProfile(props.kind, {
      receive_rank: form.receive_rank,
      give_rank: config.value.giveLabel ? form.give_rank : [],
      examples,
    })
    savedAt.value = true
    setTimeout(() => (savedAt.value = false), 2500)
  } catch {
    error.value = 'Tes réponses n’ont pas pu être enregistrées. Réessaie dans un instant.'
  } finally {
    saving.value = false
  }
}

const name = (id: string | undefined) => (id ? languageName(props.kind, id) : '')

const insights = computed(() => {
  const a = mine.value
  const b = theirs.value
  const p = partnerName.value
  if (!a || !b) return []
  const list: { tone: 'match' | 'gap' | 'info'; text: string }[] = []
  const aTop = a.receive_rank[0]
  const bTop = b.receive_rank[0]

  if (aTop === bTop) {
    list.push({ tone: 'match', text: `Vous partagez le même langage principal : ${name(aTop)}.` })
  }

  if (props.kind === 'love') {
    const aGive = a.give_rank[0]
    const bGive = b.give_rank[0]
    if (aGive && aGive !== bTop) {
      list.push({
        tone: 'gap',
        text: `Tu donnes surtout en ${name(aGive).toLowerCase()}, alors que ${p} reçoit surtout en ${name(bTop).toLowerCase()}.`,
      })
    } else if (aGive) {
      list.push({ tone: 'match', text: `Tu donnes naturellement dans le langage préféré de ${p} : ${name(bTop).toLowerCase()}.` })
    }
    if (bGive && bGive !== aTop) {
      list.push({
        tone: 'gap',
        text: `${p} donne surtout en ${name(bGive).toLowerCase()}, alors que tu reçois surtout en ${name(aTop).toLowerCase()}. Pense à repérer ses gestes : c’est sa façon de dire je t’aime.`,
      })
    }
  } else {
    list.push({ tone: 'info', text: `Quand tu t’excuses auprès de ${p}, commence par : ${name(bTop).toLowerCase()}.` })
    list.push({ tone: 'info', text: `Quand ${p} s’excuse auprès de toi, ce qui compte le plus : ${name(aTop).toLowerCase()}.` })
  }

  const bLast = b.receive_rank[b.receive_rank.length - 1]
  if (bLast) {
    list.push({ tone: 'info', text: `Pour ${p}, ${name(bLast).toLowerCase()} compte le moins.` })
  }
  return list
})

function pickExamples(profile: LanguageProfile | null, field: keyof LanguageExamples) {
  if (!profile) return []
  return profile.receive_rank
    .slice(0, 2)
    .flatMap((id) => (profile.examples?.[id]?.[field] ?? []).map((text) => ({ id, text })))
    .slice(0, 3)
}

const ideasForPartner = computed(() => pickExamples(theirs.value, 'positive'))
const avoidForPartner = computed(() => pickExamples(theirs.value, 'negative'))
const ideasForMe = computed(() => pickExamples(mine.value, 'positive'))
</script>

<template>
  <section class="language">
    <div class="head">
      <div>
        <h2 class="section-title">{{ config.title }}</h2>
        <p class="intro">{{ config.intro }}</p>
      </div>
      <div class="switch" role="tablist" aria-label="Vue">
        <button type="button" role="tab" :aria-selected="view === 'moi'" :class="{ active: view === 'moi' }" @click="view = 'moi'">
          Mes réponses
        </button>
        <button type="button" role="tab" :aria-selected="view === 'nous'" :class="{ active: view === 'nous' }" @click="view = 'nous'">
          Nous deux
        </button>
      </div>
    </div>

    <template v-if="view === 'moi'">
      <div class="card rankings" :class="{ single: !config.giveLabel }">
        <RankingList v-model="form.receive_rank" :languages="config.languages" :label="config.receiveLabel" />
        <RankingList
          v-if="config.giveLabel"
          v-model="form.give_rank"
          :languages="config.languages"
          :label="config.giveLabel"
        />
      </div>

      <div class="card examples">
        <h3 class="sub-title">Des exemples concrets</h3>
        <p class="muted">Plus c'est précis, plus c'est utile à l'autre.</p>
        <div class="accordion">
          <div v-for="id in form.receive_rank" :key="id" class="acc-item" :class="{ open: openId === id }">
            <button type="button" class="acc-head" :aria-expanded="openId === id" @click="openId = openId === id ? null : id">
              <span class="acc-name">{{ name(id) }}</span>
              <span v-if="exampleCount(id)" class="chip">{{ exampleCount(id) }}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div v-if="openId === id" class="acc-body">
              <p class="hint">{{ config.languages.find((l) => l.id === id)?.examplePrompt }}</p>
              <div class="field">
                <span class="label positive">{{ config.positiveLabel }}</span>
                <ListInput v-model="examplesFor(id).positive" add-label="Ajouter un exemple" :placeholder="config.positivePlaceholder" />
              </div>
              <div class="field">
                <span class="label negative">{{ config.negativeLabel }}</span>
                <ListInput v-model="examplesFor(id).negative" add-label="Ajouter un exemple" :placeholder="config.negativePlaceholder" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="save-bar">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-else-if="savedAt" class="saved">Enregistré</p>
        <p v-else-if="mine" class="faint">Visible par {{ partnerName || 'ton ou ta partenaire' }}</p>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="!couple.partner" class="card empty">
        <p>Invite ton ou ta partenaire pour comparer vos réponses.</p>
        <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">Inviter</RouterLink>
      </div>

      <template v-else>
        <div class="card compare">
          <div class="compare-col">
            <p class="compare-who">Toi</p>
            <ol v-if="mine" class="compare-list">
              <li v-for="(id, i) in mine.receive_rank" :key="id" :class="{ top: i === 0 }">
                <span class="rank">{{ i + 1 }}</span>{{ name(id) }}
              </li>
            </ol>
            <p v-else class="faint">Tu n'as pas encore répondu.</p>
          </div>
          <div class="compare-col">
            <p class="compare-who capitalize">{{ partnerName }}</p>
            <ol v-if="theirs" class="compare-list">
              <li v-for="(id, i) in theirs.receive_rank" :key="id" :class="{ top: i === 0, shared: mine && mine.receive_rank[i] === id }">
                <span class="rank">{{ i + 1 }}</span>{{ name(id) }}
              </li>
            </ol>
            <p v-else class="faint"><span class="capitalize">{{ partnerName }}</span> n'a pas encore répondu.</p>
          </div>
        </div>

        <div v-if="insights.length" class="card insights">
          <h3 class="sub-title">Ce qu'on remarque</h3>
          <ul>
            <li v-for="(insight, i) in insights" :key="i" :class="insight.tone">{{ insight.text }}</li>
          </ul>
        </div>

        <div v-if="ideasForPartner.length || avoidForPartner.length || ideasForMe.length" class="ideas">
          <div v-if="ideasForPartner.length" class="card idea-card">
            <h3 class="sub-title">Pour faire plaisir à <span class="capitalize">{{ partnerName }}</span></h3>
            <ul>
              <li v-for="(idea, i) in ideasForPartner" :key="i">
                {{ idea.text }}
                <span class="faint">· {{ name(idea.id) }}</span>
              </li>
            </ul>
          </div>
          <div v-if="avoidForPartner.length" class="card idea-card avoid">
            <h3 class="sub-title">À éviter avec <span class="capitalize">{{ partnerName }}</span></h3>
            <ul>
              <li v-for="(idea, i) in avoidForPartner" :key="i">{{ idea.text }}</li>
            </ul>
          </div>
          <div v-if="ideasForMe.length" class="card idea-card">
            <h3 class="sub-title">Ce que <span class="capitalize">{{ partnerName }}</span> peut faire pour toi</h3>
            <ul>
              <li v-for="(idea, i) in ideasForMe" :key="i">{{ idea.text }}</li>
            </ul>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.language {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.intro {
  max-width: 620px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.switch {
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.switch button {
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.switch button.active {
  background: var(--surface-raised);
  color: var(--text);
}

.rankings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.rankings.single {
  grid-template-columns: minmax(0, 560px);
}

.sub-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.faint {
  font-size: 13px;
  color: var(--text-faint);
}

.capitalize {
  text-transform: capitalize;
}

.accordion {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  border-top: 1px solid var(--border);
}

.acc-item {
  border-bottom: 1px solid var(--border);
}

.acc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 4px;
  border: none;
  background: none;
  text-align: left;
}

.acc-name {
  flex: 1;
  font-weight: 600;
}

.chevron {
  color: var(--text-faint);
  transition: transform 0.2s;
}

.open .chevron {
  transform: rotate(180deg);
}

.acc-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px 18px;
}

.label.positive {
  color: var(--accent);
}

.label.negative {
  color: var(--secondary);
}

.save-bar {
  position: sticky;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-deep);
  border: 1px solid var(--border);
}

.save-bar p {
  margin-right: auto;
}

.saved {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.error {
  font-size: 13px;
  color: var(--secondary);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 24px;
  text-align: center;
  color: var(--text-muted);
}

.compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.compare-who {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.compare-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  list-style: none;
}

.compare-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 14px;
}

.compare-list li.top {
  border-color: var(--accent-line);
  font-weight: 600;
}

.compare-list li.shared {
  background: var(--accent-soft);
}

.rank {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-raised);
  font-size: 12px;
  color: var(--text-muted);
}

.top .rank {
  background: var(--accent);
  color: var(--on-accent);
}

.insights ul,
.idea-card ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-left: 18px;
}

.insights li {
  line-height: 1.5;
}

.insights li.match::marker {
  color: var(--accent);
}

.insights li.gap::marker {
  color: var(--secondary);
}

.insights li.info::marker {
  color: var(--text-faint);
}

.ideas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.idea-card li::marker {
  color: var(--accent);
}

.idea-card.avoid li::marker {
  color: var(--secondary);
}

@media (max-width: 760px) {
  .rankings,
  .compare {
    grid-template-columns: minmax(0, 1fr);
  }

  .save-bar {
    bottom: var(--mobile-nav-offset);
  }
}
</style>
