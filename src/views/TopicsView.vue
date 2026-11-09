<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TopicForm from '@/components/topics/TopicForm.vue'
import { formatSessionDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useTopicsStore, type DiscussionTopic, type DiscussionTopicInput } from '@/stores/topics'

const auth = useAuthStore()
const couple = useCoupleStore()
const topics = useTopicsStore()

const error = ref('')
const busy = ref(false)
const formKey = ref(0)
const editingId = ref<string | null>(null)
const showDone = ref(false)

const mine = computed(() => topics.topics.filter((t) => t.author_id === auth.user?.id))
const mineOpen = computed(() => mine.value.filter((t) => !t.done_at))
const fromPartner = computed(() => topics.topics.filter((t) => t.author_id !== auth.user?.id && !t.done_at))
const done = computed(() =>
  topics.topics
    .filter((t) => t.done_at)
    .sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? '')),
)

const partnerName = computed(() => couple.partner?.display_name ?? 'ton ou ta partenaire')

async function load() {
  error.value = ''
  try {
    await topics.fetch()
  } catch {
    error.value = 'Les sujets n’ont pas pu être chargés. Recharge la page pour réessayer.'
  }
}

onMounted(load)
watch(() => couple.coupleId, load)

async function run(action: () => Promise<unknown>, message: string) {
  busy.value = true
  error.value = ''
  try {
    await action()
    return true
  } catch {
    error.value = message
    return false
  } finally {
    busy.value = false
  }
}

async function create(values: DiscussionTopicInput) {
  if (await run(() => topics.create(values), 'Le sujet n’a pas pu être ajouté.')) formKey.value++
}

async function save(id: string, values: DiscussionTopicInput) {
  if (await run(() => topics.update(id, values), 'Le sujet n’a pas pu être modifié.')) editingId.value = null
}

function toggleShared(topic: DiscussionTopic) {
  void run(() => topics.update(topic.id, { shared: !topic.shared }), 'La visibilité n’a pas pu être changée.')
}

function toggleDone(topic: DiscussionTopic) {
  void run(() => topics.toggleDone(topic), 'Le sujet n’a pas pu être mis à jour.')
}

function remove(topic: DiscussionTopic) {
  if (!confirm(`Supprimer « ${topic.title} » ?`)) return
  void run(() => topics.remove(topic.id), 'Le sujet n’a pas pu être supprimé.')
}
</script>

<template>
  <div class="topics">
    <header class="page-header">
      <p class="eyebrow">À discuter</p>
      <h1 class="title">Ce qu'on veut se dire</h1>
      <p class="subtitle">
        Note les sujets que tu veux aborder pour ne pas les oublier. Tu choisis lesquels {{ partnerName }} peut voir.
      </p>
    </header>

    <p v-if="error" class="error card" role="alert">{{ error }}</p>

    <div class="grid">
      <section class="card new">
        <h2 class="section-title">Nouveau sujet</h2>
        <TopicForm :key="formKey" submit-label="Ajouter" :busy="busy" @submit="create" />
      </section>

      <div class="columns">
        <section class="card">
          <div class="section-head">
            <h2 class="section-title">Mes sujets</h2>
            <span v-if="topics.loaded" class="chip">{{ mineOpen.length }}</span>
          </div>

          <div v-if="!topics.loaded && !error" class="list">
            <div v-for="n in 2" :key="n" class="skeleton" />
          </div>

          <p v-else-if="!mineOpen.length" class="muted">Rien en attente pour l'instant.</p>

          <ul v-else class="list">
            <li v-for="topic in mineOpen" :key="topic.id" class="topic">
              <TopicForm
                v-if="editingId === topic.id"
                :topic="topic"
                submit-label="Enregistrer"
                :busy="busy"
                @submit="(values) => save(topic.id, values)"
                @cancel="editingId = null"
              />
              <template v-else>
                <div class="topic-top">
                  <span class="topic-title">{{ topic.title }}</span>
                  <button
                    type="button"
                    class="visibility"
                    :class="{ shared: topic.shared }"
                    :disabled="busy"
                    :title="topic.shared ? `Visible par ${partnerName} — cliquer pour masquer` : 'Privé — cliquer pour partager'"
                    @click="toggleShared(topic)"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <template v-if="topic.shared">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </template>
                      <template v-else>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </template>
                    </svg>
                    {{ topic.shared ? 'Partagé' : 'Privé' }}
                  </button>
                </div>
                <p v-if="topic.description" class="topic-description">{{ topic.description }}</p>
                <div class="topic-actions">
                  <button type="button" class="link" :disabled="busy" @click="toggleDone(topic)">C'est discuté</button>
                  <button type="button" class="link" @click="editingId = topic.id">Modifier</button>
                  <button type="button" class="link danger" :disabled="busy" @click="remove(topic)">Supprimer</button>
                </div>
              </template>
            </li>
          </ul>
        </section>

        <section v-if="couple.partner" class="card">
          <div class="section-head">
            <h2 class="section-title capitalize">Côté {{ partnerName }}</h2>
            <span v-if="topics.loaded" class="chip chip-secondary">{{ fromPartner.length }}</span>
          </div>

          <p v-if="topics.loaded && !fromPartner.length" class="muted">
            Aucun sujet partagé pour l'instant.
          </p>

          <ul v-else-if="topics.loaded" class="list">
            <li v-for="topic in fromPartner" :key="topic.id" class="topic partner">
              <span class="topic-title">{{ topic.title }}</span>
              <p v-if="topic.description" class="topic-description">{{ topic.description }}</p>
              <span class="topic-meta">Ajouté le {{ formatSessionDate(topic.created_at.slice(0, 10), { day: 'numeric', month: 'long' }) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="done.length" class="card">
          <button type="button" class="done-toggle" :aria-expanded="showDone" @click="showDone = !showDone">
            <h2 class="section-title">Déjà discutés</h2>
            <span class="chip">{{ done.length }}</span>
            <svg class="chevron" :class="{ open: showDone }" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <ul v-if="showDone" class="list">
            <li v-for="topic in done" :key="topic.id" class="topic done">
              <div class="topic-top">
                <span class="topic-title">{{ topic.title }}</span>
                <span v-if="topic.author_id !== auth.user?.id" class="topic-meta capitalize">{{ partnerName }}</span>
              </div>
              <div v-if="topic.author_id === auth.user?.id" class="topic-actions">
                <button type="button" class="link" :disabled="busy" @click="toggleDone(topic)">Remettre à discuter</button>
                <button type="button" class="link danger" :disabled="busy" @click="remove(topic)">Supprimer</button>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topics {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1080px;
}

.subtitle {
  max-width: 560px;
  margin-top: 10px;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 20px;
  align-items: start;
}

.new {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 24px;
  background:
    radial-gradient(320px 160px at 100% 0%, var(--accent-glow), transparent 70%),
    var(--surface);
}

.columns {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding: 0;
  list-style: none;
}

.skeleton {
  height: 72px;
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.topic {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
}

.topic.partner {
  border-left: 3px solid var(--secondary);
}

.topic.done .topic-title {
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--text-faint);
}

.topic-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.topic-title {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.topic-description {
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.topic-meta {
  font-size: 12px;
  color: var(--text-faint);
}

.visibility {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 3px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.visibility.shared {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  color: var(--accent);
}

.visibility:hover {
  border-color: var(--accent);
}

.topic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 2px;
}

.link {
  padding: 2px 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.link:hover {
  color: var(--accent);
}

.link.danger:hover {
  color: var(--secondary);
}

.done-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  text-align: left;
}

.chevron {
  margin-left: auto;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.capitalize {
  text-transform: capitalize;
}

.muted {
  margin-top: 14px;
  font-size: 14px;
  color: var(--text-muted);
}

.error {
  font-size: 14px;
  color: var(--secondary);
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .new {
    position: static;
  }
}
</style>
