import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { normalizeTagName, type TagColor } from '@/lib/tagColors'
import { useAuthStore } from '@/stores/auth'

export type TagScope = 'therapie' | 'envies'

export interface Tag {
  id: string
  created_by: string
  scope: TagScope
  name: string
  color: TagColor
}

export const useTagsStore = defineStore('tags', () => {
  const auth = useAuthStore()

  const rows = ref<Tag[]>([])
  const loaded = ref(false)

  function listFor(scope: TagScope) {
    const byName = new Map<string, Tag>()
    for (const tag of rows.value) {
      if (tag.scope !== scope) continue
      const existing = byName.get(tag.name)
      if (!existing || tag.created_by === auth.user?.id) byName.set(tag.name, tag)
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  const tags = computed(() => listFor('therapie'))
  const wishTags = computed(() => listFor('envies'))

  function find(name: string, scope: TagScope = 'therapie') {
    return (scope === 'therapie' ? tags.value : wishTags.value).find((t) => t.name === name)
  }

  function reset() {
    rows.value = []
    loaded.value = false
  }

  async function fetch() {
    const { data, error } = await supabase.from('tags').select('id, created_by, scope, name, color')
    if (error) throw error
    rows.value = data as Tag[]
    loaded.value = true
  }

  async function create(name: string, color: TagColor, scope: TagScope = 'therapie') {
    const normalized = normalizeTagName(name)
    if (!normalized) throw new Error('empty')
    const existing = find(normalized, scope)
    if (existing) return existing

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: normalized, color, scope })
      .select('id, created_by, scope, name, color')
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

  return { tags, wishTags, loaded, listFor, find, reset, fetch, create, updateColor, remove }
})
