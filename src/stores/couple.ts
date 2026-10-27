import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface CoupleMember {
  user_id: string
  display_name: string
  joined_at: string
}

export interface SentInvitation {
  id: string
  invited_email: string
  created_at: string
}

export interface ReceivedInvitation {
  id: string
  inviter_name: string
  created_at: string
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Cette adresse email n'est pas valide.",
  cannot_invite_self: 'Tu ne peux pas t’inviter toi-même.',
  couple_full: 'Ce couple est déjà au complet.',
  already_in_couple: 'Tu fais déjà partie d’un couple. Quitte-le avant d’en rejoindre un autre.',
  invitation_not_found: 'Cette invitation n’existe plus.',
}

export function coupleErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : ''
  return ERROR_MESSAGES[message] ?? 'Quelque chose s’est mal passé. Réessaie dans un instant.'
}

export const useCoupleStore = defineStore('couple', () => {
  const auth = useAuthStore()

  const coupleId = ref<string | null>(null)
  const members = ref<CoupleMember[]>([])
  const sentInvitation = ref<SentInvitation | null>(null)
  const receivedInvitations = ref<ReceivedInvitation[]>([])
  const loaded = ref(false)

  const partner = computed(() => members.value.find((m) => m.user_id !== auth.user?.id) ?? null)
  const isComplete = computed(() => members.value.length >= 2)

  function nameOf(userId: string) {
    if (userId === auth.user?.id) return auth.displayName
    return members.value.find((m) => m.user_id === userId)?.display_name ?? ''
  }

  function reset() {
    coupleId.value = null
    members.value = []
    sentInvitation.value = null
    receivedInvitations.value = []
    loaded.value = false
  }

  async function fetch() {
    const userId = auth.user?.id
    if (!userId) {
      reset()
      return
    }

    const [{ data: membership }, { data: received }] = await Promise.all([
      supabase.from('couple_members').select('couple_id').eq('user_id', userId).maybeSingle(),
      supabase.rpc('my_pending_invitations'),
    ])

    receivedInvitations.value = (received ?? []) as ReceivedInvitation[]
    coupleId.value = membership?.couple_id ?? null

    if (!coupleId.value) {
      members.value = []
      sentInvitation.value = null
      loaded.value = true
      return
    }

    const [{ data: memberRows }, { data: invitation }] = await Promise.all([
      supabase.from('couple_members').select('user_id, joined_at').eq('couple_id', coupleId.value),
      supabase
        .from('couple_invitations')
        .select('id, invited_email, created_at')
        .eq('couple_id', coupleId.value)
        .eq('status', 'pending')
        .maybeSingle(),
    ])

    const ids = (memberRows ?? []).map((m) => m.user_id as string)
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [] }

    members.value = (memberRows ?? []).map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      display_name: profiles?.find((p) => p.id === m.user_id)?.display_name ?? '',
    }))
    sentInvitation.value = invitation
    loaded.value = true
  }

  async function callRpc(fn: string, args?: Record<string, unknown>) {
    const { error } = await supabase.rpc(fn, args)
    if (error) throw new Error(error.message)
    await fetch()
  }

  const invite = (email: string) => callRpc('invite_partner', { partner_email: email })
  const cancelInvitation = (id: string) => callRpc('cancel_invitation', { invitation_id: id })
  const acceptInvitation = (id: string) => callRpc('accept_invitation', { invitation_id: id })
  const declineInvitation = (id: string) => callRpc('decline_invitation', { invitation_id: id })
  const leave = () => callRpc('leave_couple')

  return {
    coupleId,
    members,
    partner,
    isComplete,
    nameOf,
    sentInvitation,
    receivedInvitations,
    loaded,
    fetch,
    reset,
    invite,
    cancelInvitation,
    acceptInvitation,
    declineInvitation,
    leave,
  }
})
