import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'

export interface Agreements {
  couple_id: string
  pause_word: string
  next_checkin: string | null
  last_review: string | null
}

export interface Rule {
  id: string
  text: string
  detail: string
  created_by: string | null
  created_at: string
}

export type LimitLevel = 'hard' | 'soft'

export interface Limit {
  id: string
  user_id: string
  level: LimitLevel
  text: string
  created_at: string
}

export const CARE_FIELDS = [
  { id: 'before', label: 'Avant un rendez-vous', placeholder: 'Qu’on passe un moment à deux juste avant, que tu me dises où tu vas' },
  { id: 'during', label: 'Pendant', placeholder: 'Un petit message dans la soirée, sans détails' },
  { id: 'after', label: 'Au retour', placeholder: 'Un câlin d’abord, on parle le lendemain' },
  { id: 'jealousy', label: 'Quand je ressens de la jalousie', placeholder: 'Que tu m’écoutes sans te justifier, puis qu’on cherche ce qui me manque' },
  { id: 'priority', label: 'Ce qui me fait sentir prioritaire', placeholder: 'Nos soirées du mardi restent sacrées' },
] as const

export type CareFieldId = (typeof CARE_FIELDS)[number]['id']

export const INFO_LEVELS = [
  { id: 'tout', label: 'Tout savoir' },
  { id: 'essentiel', label: 'L’essentiel' },
  { id: 'minimum', label: 'Le minimum' },
] as const

export type InfoLevel = (typeof INFO_LEVELS)[number]['id'] | ''

export type Care = { user_id: string; info_level: InfoLevel; info_note: string; updated_at: string } & Record<CareFieldId, string>

export const useNonMonoStore = defineStore('nonmono', () => {
  const auth = useAuthStore()
  const couple = useCoupleStore()

  const agreements = ref<Agreements | null>(null)
  const rules = ref<Rule[]>([])
  const limits = ref<Limit[]>([])
  const cares = ref<Care[]>([])
  const loaded = ref(false)

  function reset() {
    agreements.value = null
    rules.value = []
    limits.value = []
    cares.value = []
    loaded.value = false
  }

  async function fetch() {
    if (!couple.coupleId) {
      reset()
      loaded.value = true
      return
    }
    const [a, r, l, c] = await Promise.all([
      supabase.from('nm_agreements').select('*').eq('couple_id', couple.coupleId).maybeSingle(),
      supabase.from('nm_rules').select('*').eq('couple_id', couple.coupleId).order('created_at'),
      supabase.from('nm_limits').select('*').order('created_at'),
      supabase.from('nm_care').select('*'),
    ])
    for (const result of [a, r, l, c]) if (result.error) throw result.error
    agreements.value = a.data as Agreements | null
    rules.value = r.data as Rule[]
    limits.value = l.data as Limit[]
    cares.value = c.data as Care[]
    loaded.value = true
  }

  async function saveAgreements(values: Partial<Omit<Agreements, 'couple_id'>>) {
    const { data, error } = await supabase
      .from('nm_agreements')
      .upsert({ couple_id: couple.coupleId, ...values })
      .select('*')
      .single()
    if (error) throw error
    agreements.value = data as Agreements
  }

  async function addRule(text: string, detail: string) {
    const { data, error } = await supabase
      .from('nm_rules')
      .insert({ couple_id: couple.coupleId, text, detail })
      .select('*')
      .single()
    if (error) throw error
    rules.value.push(data as Rule)
  }

  async function updateRule(id: string, text: string, detail: string) {
    const { data, error } = await supabase.from('nm_rules').update({ text, detail }).eq('id', id).select('*').single()
    if (error) throw error
    rules.value = rules.value.map((r) => (r.id === id ? (data as Rule) : r))
  }

  async function removeRule(id: string) {
    const { error } = await supabase.from('nm_rules').delete().eq('id', id)
    if (error) throw error
    rules.value = rules.value.filter((r) => r.id !== id)
  }

  async function addLimit(level: LimitLevel, text: string) {
    const { data, error } = await supabase.from('nm_limits').insert({ level, text }).select('*').single()
    if (error) throw error
    limits.value.push(data as Limit)
  }

  async function updateLimit(id: string, values: Partial<Pick<Limit, 'level' | 'text'>>) {
    const { data, error } = await supabase.from('nm_limits').update(values).eq('id', id).select('*').single()
    if (error) throw error
    limits.value = limits.value.map((l) => (l.id === id ? (data as Limit) : l))
  }

  async function removeLimit(id: string) {
    const { error } = await supabase.from('nm_limits').delete().eq('id', id)
    if (error) throw error
    limits.value = limits.value.filter((l) => l.id !== id)
  }

  function careOf(userId: string) {
    return cares.value.find((c) => c.user_id === userId) ?? null
  }

  async function saveCare(values: Omit<Care, 'user_id' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('nm_care')
      .upsert({ user_id: auth.user?.id, ...values })
      .select('*')
      .single()
    if (error) throw error
    cares.value = [...cares.value.filter((c) => c.user_id !== auth.user?.id), data as Care]
  }

  return {
    agreements,
    rules,
    limits,
    cares,
    loaded,
    reset,
    fetch,
    saveAgreements,
    addRule,
    updateRule,
    removeRule,
    addLimit,
    updateLimit,
    removeLimit,
    careOf,
    saveCare,
  }
})
