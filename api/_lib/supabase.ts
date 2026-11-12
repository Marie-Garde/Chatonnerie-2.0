import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuthInfo } from '@modelcontextprotocol/server'

export const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '') as string
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '') as string
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '') as string

export const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`

export function createUserClient(token: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

// Contourne les règles de lecture : réservé aux séances semi-publiques du ou de la partenaire,
// lues uniquement pendant une séance à deux. Ne jamais exposer cette clé côté navigateur.
export function createAdminClient(): SupabaseClient | null {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1] ?? ''
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return {}
  }
}

export async function verifyToken(_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined

  const client = createUserClient(bearerToken)
  const { data, error } = await client.auth.getUser(bearerToken)
  if (error || !data.user) return undefined

  const claims = decodeJwtPayload(bearerToken)
  const scope = typeof claims.scope === 'string' ? claims.scope : ''

  return {
    token: bearerToken,
    clientId: typeof claims.client_id === 'string' ? claims.client_id : 'unknown',
    scopes: scope ? scope.split(' ') : [],
    expiresAt: typeof claims.exp === 'number' ? claims.exp : undefined,
    extra: { userId: data.user.id, email: data.user.email ?? '' },
  }
}
