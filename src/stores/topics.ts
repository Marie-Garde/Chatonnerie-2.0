import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCoupleStore } from '@/stores/couple'

export interface DiscussionTopic {
  id: string
  couple_id: string | null
  author_id: string
  title: string
  description: string
  shared: boolean
  done_at: string | null
  created_at: string
}

export type DiscussionTopicInput = Pick<DiscussionTopic, 'title' | 'description' | 'shared'>

export const useTopicsStore = defineStore('topics', () => {
  const couple = useCoupleStore()

  const topics = ref<DiscussionTopic[]>([])
  const loaded = ref(false)

  function reset() {
    topics.value = []
    loaded.value = false
  }

  async function fetch() {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    topics.value = data as DiscussionTopic[]
    loaded.value = true
  }

  async function create(values: DiscussionTopicInput) {
    const { data, error } = await supabase
      .from('discussion_topics')
      .insert({ ...values, couple_id: couple.coupleId })
      .select('*')
      .single()
    if (error) throw error
    topics.value.unshift(data as DiscussionTopic)
  }

  async function update(id: string, values: Partial<DiscussionTopicInput & Pick<DiscussionTopic, 'done_at'>>) {
    const { data, error } = await supabase.from('discussion_topics').update(values).eq('id', id).select('*').single()
    if (error) throw error
    topics.value = topics.value.map((t) => (t.id === id ? (data as DiscussionTopic) : t))
  }

  async function toggleDone(topic: DiscussionTopic) {
    await update(topic.id, { done_at: topic.done_at ? null : new Date().toISOString() })
  }

  async function remove(id: string) {
    const { error } = await supabase.from('discussion_topics').delete().eq('id', id)
    if (error) throw error
    topics.value = topics.value.filter((t) => t.id !== id)
  }

  return { topics, loaded, reset, fetch, create, update, toggleDone, remove }
})
