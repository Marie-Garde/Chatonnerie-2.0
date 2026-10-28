import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { LandmarkKind, LanguageKind, ManualFieldId } from '@/lib/languages'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'

export interface LanguageExamples {
  positive: string[]
  negative: string[]
}

export interface LanguageProfile {
  user_id: string
  kind: LanguageKind
  receive_rank: string[]
  give_rank: string[]
  examples: Record<string, LanguageExamples>
  updated_at: string
}

export type UserManual = { user_id: string; updated_at: string } & Record<ManualFieldId, string>

export interface Landmark {
  id: string
  created_by: string | null
  kind: LandmarkKind
  title: string
  detail: string
  date: string | null
  created_at: string
}

export interface Priority {
  id: string
  target_user: string | null
  text: string
  position: number
  done_at: string | null
  created_by: string | null
  created_at: string
}

export const useRelationStore = defineStore('relation', () => {
  const auth = useAuthStore()
  const couple = useCoupleStore()

  const profiles = ref<LanguageProfile[]>([])
  const manuals = ref<UserManual[]>([])
  const landmarks = ref<Landmark[]>([])
  const priorities = ref<Priority[]>([])
  const loaded = ref(false)

  const myId = computed(() => auth.user?.id ?? '')
  const partnerId = computed(() => couple.partner?.user_id ?? '')

  function profileOf(userId: string, kind: LanguageKind) {
    return profiles.value.find((p) => p.user_id === userId && p.kind === kind) ?? null
  }

  function manualOf(userId: string) {
    return manuals.value.find((m) => m.user_id === userId) ?? null
  }

  function reset() {
    profiles.value = []
    manuals.value = []
    landmarks.value = []
    priorities.value = []
    loaded.value = false
  }

  async function fetch() {
    const [p, m, l, pr] = await Promise.all([
      supabase.from('language_profiles').select('*'),
      supabase.from('user_manuals').select('*'),
      couple.coupleId
        ? supabase.from('couple_landmarks').select('*').eq('couple_id', couple.coupleId).order('created_at')
        : Promise.resolve({ data: [], error: null }),
      couple.coupleId
        ? supabase.from('relation_priorities').select('*').eq('couple_id', couple.coupleId).order('position')
        : Promise.resolve({ data: [], error: null }),
    ])
    if (p.error) throw p.error
    if (m.error) throw m.error
    if (l.error) throw l.error
    if (pr.error) throw pr.error
    priorities.value = (pr.data ?? []) as Priority[]
    profiles.value = p.data as LanguageProfile[]
    manuals.value = m.data as UserManual[]
    landmarks.value = (l.data ?? []) as Landmark[]
    loaded.value = true
  }

  async function saveProfile(kind: LanguageKind, values: Pick<LanguageProfile, 'receive_rank' | 'give_rank' | 'examples'>) {
    const { data, error } = await supabase
      .from('language_profiles')
      .upsert({ user_id: myId.value, kind, ...values })
      .select('*')
      .single()
    if (error) throw error
    profiles.value = [...profiles.value.filter((p) => !(p.user_id === myId.value && p.kind === kind)), data as LanguageProfile]
  }

  async function saveManual(values: Record<ManualFieldId, string>) {
    const { data, error } = await supabase
      .from('user_manuals')
      .upsert({ user_id: myId.value, ...values })
      .select('*')
      .single()
    if (error) throw error
    manuals.value = [...manuals.value.filter((m) => m.user_id !== myId.value), data as UserManual]
  }

  async function addLandmark(values: Pick<Landmark, 'kind' | 'title' | 'detail' | 'date'>) {
    if (!couple.coupleId) return
    const { data, error } = await supabase
      .from('couple_landmarks')
      .insert({ ...values, couple_id: couple.coupleId })
      .select('*')
      .single()
    if (error) throw error
    landmarks.value.push(data as Landmark)
  }

  async function removeLandmark(id: string) {
    const { error } = await supabase.from('couple_landmarks').delete().eq('id', id)
    if (error) throw error
    landmarks.value = landmarks.value.filter((l) => l.id !== id)
  }

  function prioritiesFor(target: string | null) {
    return priorities.value
      .filter((p) => p.target_user === target)
      .sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.position - b.position)
  }

  async function addPriority(target: string | null, text: string) {
    if (!couple.coupleId) return
    const position = priorities.value.reduce((max, p) => Math.max(max, p.position), 0) + 1
    const { data, error } = await supabase
      .from('relation_priorities')
      .insert({ couple_id: couple.coupleId, target_user: target, text, position })
      .select('*')
      .single()
    if (error) throw error
    priorities.value.push(data as Priority)
  }

  async function updatePriority(id: string, values: Partial<Pick<Priority, 'text' | 'position' | 'done_at'>>) {
    const { data, error } = await supabase.from('relation_priorities').update(values).eq('id', id).select('*').single()
    if (error) throw error
    priorities.value = priorities.value.map((p) => (p.id === id ? (data as Priority) : p))
  }

  async function movePriority(id: string, direction: -1 | 1) {
    const item = priorities.value.find((p) => p.id === id)
    if (!item) return
    const list = prioritiesFor(item.target_user).filter((p) => !p.done_at)
    const index = list.findIndex((p) => p.id === id)
    const other = list[index + direction]
    if (!other) return
    await Promise.all([
      updatePriority(item.id, { position: other.position }),
      updatePriority(other.id, { position: item.position }),
    ])
  }

  async function removePriority(id: string) {
    const { error } = await supabase.from('relation_priorities').delete().eq('id', id)
    if (error) throw error
    priorities.value = priorities.value.filter((p) => p.id !== id)
  }

  return {
    priorities,
    prioritiesFor,
    addPriority,
    updatePriority,
    movePriority,
    removePriority,
    profiles,
    manuals,
    landmarks,
    loaded,
    myId,
    partnerId,
    profileOf,
    manualOf,
    reset,
    fetch,
    saveProfile,
    saveManual,
    addLandmark,
    removeLandmark,
  }
})
