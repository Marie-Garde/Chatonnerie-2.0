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

export const useRelationStore = defineStore('relation', () => {
  const auth = useAuthStore()
  const couple = useCoupleStore()

  const profiles = ref<LanguageProfile[]>([])
  const manuals = ref<UserManual[]>([])
  const landmarks = ref<Landmark[]>([])
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
    loaded.value = false
  }

  async function fetch() {
    const [p, m, l] = await Promise.all([
      supabase.from('language_profiles').select('*'),
      supabase.from('user_manuals').select('*'),
      couple.coupleId
        ? supabase.from('couple_landmarks').select('*').eq('couple_id', couple.coupleId).order('created_at')
        : Promise.resolve({ data: [], error: null }),
    ])
    if (p.error) throw p.error
    if (m.error) throw m.error
    if (l.error) throw l.error
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

  return {
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
