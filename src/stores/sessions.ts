import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { SessionContent, SessionPatch, SessionType, TherapySession } from '@/types/session'

export function isSharedWithCouple(session: TherapySession, userId: string | undefined) {
  if (session.type === 'duo') return true
  if (session.author_id !== userId) return true
  return session.status === 'published' && session.shared
}

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<TherapySession[]>([])
  const loaded = ref(false)

  function upsertLocal(session: TherapySession) {
    const index = sessions.value.findIndex((s) => s.id === session.id)
    if (index === -1) sessions.value.unshift(session)
    else sessions.value[index] = session
    sessions.value.sort(
      (a, b) =>
        b.session_date.localeCompare(a.session_date) || b.created_at.localeCompare(a.created_at),
    )
  }

  function reset() {
    sessions.value = []
    loaded.value = false
  }

  async function fetchAll() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    sessions.value = data as TherapySession[]
    loaded.value = true
  }

  async function fetchOne(id: string) {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (data) upsertLocal(data as TherapySession)
    return data as TherapySession | null
  }

  async function create(content: SessionContent, type: SessionType = 'solo', coupleId: string | null = null) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ...content, type, couple_id: type === 'duo' ? coupleId : null })
      .select('*')
      .single()
    if (error) throw error
    upsertLocal(data as TherapySession)
    return data as TherapySession
  }

  async function update(id: string, patch: SessionPatch) {
    const { data, error } = await supabase
      .from('sessions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    upsertLocal(data as TherapySession)
    return data as TherapySession
  }

  async function remove(id: string) {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) throw error
    sessions.value = sessions.value.filter((s) => s.id !== id)
  }

  return { sessions, loaded, reset, fetchAll, fetchOne, create, update, remove }
})
