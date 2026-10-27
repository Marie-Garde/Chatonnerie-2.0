<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TopicProgressCard from '@/components/progress/TopicProgressCard.vue'
import TagChip from '@/components/tags/TagChip.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { useProgressStore } from '@/stores/progress'
import { isSharedWithCouple, useSessionsStore } from '@/stores/sessions'
import { useTagsStore } from '@/stores/tags'

const auth = useAuthStore()
const couple = useCoupleStore()
const progress = useProgressStore()
const sessions = useSessionsStore()
const tags = useTagsStore()

const error = ref('')
const busyTag = ref<string | null>(null)

const followed = computed(() => new Set(progress.items.map((i) => i.tag)))

const sharedSessions = computed(() => sessions.sessions.filter((s) => isSharedWithCouple(s, auth.user?.id)))

function sessionsFor(tag: string) {
  return sharedSessions.value.filter((s) => s.topics.includes(tag))
}

async function load() {
  error.value = ''
  try {
    await Promise.all([progress.fetch(), sessions.loaded ? Promise.resolve() : sessions.fetchAll()])
  } catch {
    error.value = 'Les avancées n’ont pas pu être chargées. Recharge la page pour réessayer.'
  }
}

onMounted(load)
watch(() => couple.coupleId, load)

async function toggle(tag: string) {
  if (followed.value.has(tag)) return
  busyTag.value = tag
  error.value = ''
  try {
    await progress.follow(tag)
  } catch {
    error.value = 'Le sujet n’a pas pu être suivi.'
  } finally {
    busyTag.value = null
  }
}
</script>

<template>
  <div class="progress">
    <RouterLink :to="{ name: 'therapy' }" class="back-link">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Thérapie
    </RouterLink>

    <header class="page-header">
      <p class="eyebrow">Avancées en duo</p>
      <h1 class="title">Où vous en êtes, sujet par sujet</h1>
      <p class="subtitle">
        Choisissez les sujets que vous voulez suivre ensemble. Seules les séances à deux et les séances perso partagées
        comptent ici.
      </p>
    </header>

    <div v-if="couple.loaded && !couple.partner" class="card empty">
      <p class="empty-title">Cette page se remplit à deux</p>
      <p class="muted">Invite ton ou ta partenaire pour suivre vos avancées ensemble.</p>
      <RouterLink :to="{ name: 'settings', query: { onglet: 'partenaire' } }" class="btn btn-small">
        Inviter mon ou ma partenaire
      </RouterLink>
    </div>

    <template v-else>
      <section class="card picker">
        <h2 class="section-title">Sujets suivis</h2>
        <p v-if="tags.tags.length" class="muted">Clique sur un tag pour le suivre.</p>
        <p v-else class="muted">
          Aucun tag pour l'instant.
          <RouterLink :to="{ name: 'settings', query: { onglet: 'therapie' } }" class="inline-link">Crée-en un</RouterLink>
          pour commencer.
        </p>
        <div v-if="tags.tags.length" class="options">
          <button
            v-for="tag in tags.tags"
            :key="tag.id"
            type="button"
            class="option"
            :class="{ followed: followed.has(tag.name) }"
            :disabled="busyTag === tag.name || followed.has(tag.name)"
            @click="toggle(tag.name)"
          >
            <TagChip :name="tag.name" :active="followed.has(tag.name)">
              <svg v-if="!followed.has(tag.name)" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </TagChip>
          </button>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>

      <div v-if="!progress.loaded" class="card skeleton" />

      <p v-else-if="!progress.items.length" class="hint-empty">
        Aucun sujet suivi pour l'instant. Choisis-en un au-dessus pour voir votre parcours.
      </p>

      <TopicProgressCard
        v-for="item in progress.items"
        :key="item.tag"
        :progress="item"
        :sessions="sessionsFor(item.tag)"
      />
    </template>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 920px;
}

.muted {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.inline-link {
  font-weight: 600;
  color: var(--accent);
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

.empty .btn {
  margin-top: 8px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.option {
  padding: 0;
  border: none;
  background: none;
  border-radius: 999px;
}

.option.followed {
  cursor: default;
}

.option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.skeleton {
  height: 280px;
  background: var(--surface-raised);
}

.hint-empty {
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-strong);
  text-align: center;
  color: var(--text-muted);
}

.error {
  margin-top: 12px;
  font-size: 13px;
  color: var(--secondary);
}
</style>
