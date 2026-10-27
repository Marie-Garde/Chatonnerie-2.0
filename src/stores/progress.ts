import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCoupleStore } from '@/stores/couple'

export interface TagProgress {
  tag: string
  summary: string
  summary_source: 'manual' | 'claude'
  summary_updated_at: string | null
  summary_updated_by: string | null
  created_at: string
}

const COLUMNS = 'tag, summary, summary_source, summary_updated_at, summary_updated_by, created_at'

export const useProgressStore = defineStore('progress', () => {
  const couple = useCoupleStore()

  const items = ref<TagProgress[]>([])
  const loaded = ref(false)

  function reset() {
    items.value = []
    loaded.value = false
  }

  async function fetch() {
    if (!couple.coupleId) {
      reset()
      loaded.value = true
      return
    }
    const { data, error } = await supabase
      .from('tag_progress')
      .select(COLUMNS)
      .eq('couple_id', couple.coupleId)
      .order('created_at')
    if (error) throw error
    items.value = data as TagProgress[]
    loaded.value = true
  }

  async function follow(tag: string) {
    if (!couple.coupleId) return
    const { data, error } = await supabase
      .from('tag_progress')
      .insert({ couple_id: couple.coupleId, tag })
      .select(COLUMNS)
      .single()
    if (error) throw error
    items.value.push(data as TagProgress)
  }

  async function unfollow(tag: string) {
    if (!couple.coupleId) return
    const { error } = await supabase.from('tag_progress').delete().eq('couple_id', couple.coupleId).eq('tag', tag)
    if (error) throw error
    items.value = items.value.filter((i) => i.tag !== tag)
  }

  async function updateSummary(tag: string, summary: string) {
    if (!couple.coupleId) return
    const { data, error } = await supabase
      .from('tag_progress')
      .update({ summary, summary_source: 'manual' })
      .eq('couple_id', couple.coupleId)
      .eq('tag', tag)
      .select(COLUMNS)
      .single()
    if (error) throw error
    const index = items.value.findIndex((i) => i.tag === tag)
    if (index !== -1) items.value[index] = data as TagProgress
  }

  return { items, loaded, reset, fetch, follow, unfollow, updateSummary }
})
