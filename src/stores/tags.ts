import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { normalizeTagName, type TagColor } from '@/lib/tagColors'
import { useAuthStore } from '@/stores/auth'

export interface Tag {
  id: string
  created_by: string
  name: string
  color: TagColor
}

export const useTagsStore = defineStore('tags', () => {
  const auth = useAuthStore()

  const rows = ref<Tag[]>([])
  const loaded = ref(false)

  const tags = computed(() => {
    const byName = new Map<string, Tag>()
    for (const tag of rows.value) {
      const existing = byName.get(tag.name)
      if (!existing || tag.created_by === auth.user?.id) byName.set(tag.name, tag)
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  })

  const ownTags = computed(() => tags.value.filter((t) => t.created_by === auth.user?.id))

  function find(name: string) {
    return tags.value.find((t) => t.name === name)
  }

  function reset() {
    rows.value = []
    loaded.value = false
  }

  async function fetch() {
    const { data, error } = await supabase.from('tags').select('id, created_by, name, color')
    if (error) throw error
    rows.value = data as Tag[]
    loaded.value = true
  }

  async function create(name: string, color: TagColor) {
    const normalized = normalizeTagName(name)
    if (!normalized) throw new Error('empty')
    const existing = find(normalized)
    if (existing) return existing

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: normalized, color })
      .select('id, created_by, name, color')
      .single()
    if (error) throw error
    rows.value.push(data as Tag)
    return data as Tag
  }

  async function updateColor(id: string, color: TagColor) {
    const { error } = await supabase.from('tags').update({ color }).eq('id', id)
    if (error) throw error
    const tag = rows.value.find((t) => t.id === id)
    if (tag) tag.color = color
  }

  async function remove(id: string) {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) throw error
    rows.value = rows.value.filter((t) => t.id !== id)
  }

  return { tags, ownTags, loaded, find, reset, fetch, create, updateColor, remove }
})
