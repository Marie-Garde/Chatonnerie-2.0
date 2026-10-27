import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { applyTheme, isThemeId, type ThemeId } from '@/lib/themes'

export interface Profile {
  id: string
  display_name: string
  theme: ThemeId
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const ready = ref(false)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => !!session.value)
  const displayName = computed(
    () => profile.value?.display_name ?? user.value?.email?.split('@')[0] ?? '',
  )

  let initPromise: Promise<void> | null = null

  function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      await fetchProfile()
      ready.value = true

      supabase.auth.onAuthStateChange((_event, newSession) => {
        const userChanged = newSession?.user.id !== session.value?.user.id
        session.value = newSession
        if (userChanged) void fetchProfile()
      })
    })()
    return initPromise
  }

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, theme')
      .eq('id', user.value.id)
      .maybeSingle()
    if (!data) {
      profile.value = null
      return
    }
    const theme = isThemeId(data.theme) ? data.theme : 'prune'
    profile.value = { ...data, theme }
    applyTheme(theme)
  }

  async function updateTheme(theme: ThemeId) {
    if (!user.value) return
    const previous = profile.value?.theme
    applyTheme(theme)
    if (profile.value) profile.value.theme = theme

    const { error } = await supabase.from('profiles').update({ theme }).eq('id', user.value.id)
    if (error) {
      if (previous) {
        applyTheme(previous)
        if (profile.value) profile.value.theme = previous
      }
      throw error
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return {
    session,
    profile,
    ready,
    user,
    isAuthenticated,
    displayName,
    init,
    signIn,
    signUp,
    signOut,
    updateTheme,
  }
})
