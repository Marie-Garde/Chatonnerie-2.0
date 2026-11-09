import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCoupleStore } from '@/stores/couple'

export const WEATHERS = [
  { id: 'soleil', emoji: '☀️', label: 'Grand soleil' },
  { id: 'eclaircies', emoji: '🌤️', label: 'Éclaircies' },
  { id: 'nuageux', emoji: '☁️', label: 'Nuageux' },
  { id: 'pluie', emoji: '🌧️', label: 'Pluie' },
  { id: 'orage', emoji: '⛈️', label: 'Orage' },
] as const

export type Weather = (typeof WEATHERS)[number]['id']

export const CHECKIN_QUESTIONS = [
  {
    id: 'felt_loved',
    label: 'Qu’est-ce que l’autre a fait qui m’a fait me sentir aimé·e ?',
    placeholder: 'Le petit-déj surprise du dimanche, ton message avant mon entretien…',
  },
  {
    id: 'connection_need',
    label: 'De quoi j’aurais besoin pour une meilleure connexion ?',
    placeholder: 'Plus de soirées sans écran, un vrai moment rien qu’à nous…',
  },
  {
    id: 'unspoken',
    label: 'Est-ce que j’ai quelque chose dont je n’ai pas osé parler ?',
    placeholder: 'Ce qui me trotte dans la tête, même si c’est petit',
  },
  {
    id: 'next_goal',
    label: 'Mon objectif pour le mois qui s’annonce',
    placeholder: 'Prendre un week-end à deux, se coucher à la même heure…',
  },
] as const

export type CheckinQuestionId = (typeof CHECKIN_QUESTIONS)[number]['id']

export type Checkin = {
  id: string
  couple_id: string | null
  author_id: string
  month: string
  weather: Weather | null
  weather_note: string
  created_at: string
  updated_at: string
} & Record<CheckinQuestionId, string>

export type CheckinInput = Pick<Checkin, 'weather' | 'weather_note' | CheckinQuestionId>

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number)
  return monthKey(new Date(year!, m! - 1 + delta, 1))
}

export const useCheckinsStore = defineStore('checkins', () => {
  const couple = useCoupleStore()

  const checkins = ref<Checkin[]>([])
  const loaded = ref(false)

  function reset() {
    checkins.value = []
    loaded.value = false
  }

  async function fetch() {
    const { data, error } = await supabase
      .from('monthly_checkins')
      .select('*')
      .order('month', { ascending: false })
    if (error) throw error
    checkins.value = data as Checkin[]
    loaded.value = true
  }

  async function save(month: string, values: CheckinInput) {
    const { data, error } = await supabase
      .from('monthly_checkins')
      .upsert(
        { ...values, month, couple_id: couple.coupleId, updated_at: new Date().toISOString() },
        { onConflict: 'author_id,month' },
      )
      .select('*')
      .single()
    if (error) throw error
    const saved = data as Checkin
    const index = checkins.value.findIndex((c) => c.id === saved.id)
    if (index === -1) checkins.value.push(saved)
    else checkins.value[index] = saved
  }

  return { checkins, loaded, reset, fetch, save }
})
