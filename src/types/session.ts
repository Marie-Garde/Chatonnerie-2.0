export type SessionType = 'solo' | 'duo'
export type SessionStatus = 'draft' | 'published'
export type SessionSource = 'manual' | 'claude'

export interface TherapySession {
  id: string
  author_id: string
  couple_id: string | null
  type: SessionType
  status: SessionStatus
  shared: boolean
  source: SessionSource
  title: string
  session_date: string
  summary: string
  feelings: string
  topics: string[]
  quotes: string[]
  open_questions: string[]
  next_steps: string[]
  created_at: string
  updated_at: string
}

export type SessionContent = Pick<
  TherapySession,
  'title' | 'session_date' | 'summary' | 'feelings' | 'topics' | 'quotes' | 'open_questions' | 'next_steps'
>

export type SessionPatch = Partial<SessionContent & Pick<TherapySession, 'status' | 'shared'>>
