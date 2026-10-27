import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { TagColor } from '@/lib/tagColors'
import { useCoupleStore } from '@/stores/couple'

export interface WishList {
  id: string
  title: string
  color: TagColor
  position: number
  created_at: string
}

export interface WishItem {
  id: string
  list_id: string
  title: string
  description: string
  deadline: string | null
  tag: string | null
  budget: number | null
  wanted_by: string | null
  done_at: string | null
  created_by: string | null
  created_at: string
}

export type WishItemInput = Pick<WishItem, 'title' | 'description' | 'deadline' | 'tag' | 'budget' | 'wanted_by'>

export const WISH_LIST_TEMPLATES = [
  'Voyages',
  'Restos à tester',
  'Sorties et activités',
  'Projets maison',
  'Films et séries',
  'Expériences à vivre',
  'Cadeaux à se faire',
]

export const useWishesStore = defineStore('wishes', () => {
  const couple = useCoupleStore()

  const lists = ref<WishList[]>([])
  const items = ref<WishItem[]>([])
  const loaded = ref(false)

  function reset() {
    lists.value = []
    items.value = []
    loaded.value = false
  }

  async function fetch() {
    if (!couple.coupleId) {
      reset()
      loaded.value = true
      return
    }
    const [l, i] = await Promise.all([
      supabase.from('wish_lists').select('*').eq('couple_id', couple.coupleId).order('position').order('created_at'),
      supabase.from('wish_items').select('*').eq('couple_id', couple.coupleId),
    ])
    if (l.error) throw l.error
    if (i.error) throw i.error
    lists.value = l.data as WishList[]
    items.value = i.data as WishItem[]
    loaded.value = true
  }

  async function createList(title: string, color: TagColor) {
    const position = lists.value.reduce((max, l) => Math.max(max, l.position), 0) + 1
    const { data, error } = await supabase
      .from('wish_lists')
      .insert({ couple_id: couple.coupleId, title, color, position })
      .select('*')
      .single()
    if (error) throw error
    lists.value.push(data as WishList)
  }

  async function updateList(id: string, values: Partial<Pick<WishList, 'title' | 'color' | 'position'>>) {
    const { data, error } = await supabase.from('wish_lists').update(values).eq('id', id).select('*').single()
    if (error) throw error
    lists.value = lists.value.map((l) => (l.id === id ? (data as WishList) : l))
  }

  async function moveList(id: string, direction: -1 | 1) {
    const sorted = [...lists.value].sort((a, b) => a.position - b.position)
    const index = sorted.findIndex((l) => l.id === id)
    const other = sorted[index + direction]
    const current = sorted[index]
    if (!other || !current) return
    await Promise.all([
      updateList(current.id, { position: other.position }),
      updateList(other.id, { position: current.position }),
    ])
  }

  async function removeList(id: string) {
    const { error } = await supabase.from('wish_lists').delete().eq('id', id)
    if (error) throw error
    lists.value = lists.value.filter((l) => l.id !== id)
    items.value = items.value.filter((i) => i.list_id !== id)
  }

  async function createItem(listId: string, values: WishItemInput) {
    const { data, error } = await supabase
      .from('wish_items')
      .insert({ ...values, list_id: listId, couple_id: couple.coupleId })
      .select('*')
      .single()
    if (error) throw error
    items.value.push(data as WishItem)
  }

  async function updateItem(id: string, values: Partial<WishItemInput & Pick<WishItem, 'done_at'>>) {
    const { data, error } = await supabase.from('wish_items').update(values).eq('id', id).select('*').single()
    if (error) throw error
    items.value = items.value.map((i) => (i.id === id ? (data as WishItem) : i))
  }

  async function toggleDone(item: WishItem) {
    await updateItem(item.id, { done_at: item.done_at ? null : new Date().toISOString() })
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from('wish_items').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter((i) => i.id !== id)
  }

  return {
    lists,
    items,
    loaded,
    reset,
    fetch,
    createList,
    updateList,
    moveList,
    removeList,
    createItem,
    updateItem,
    toggleDone,
    removeItem,
  }
})
