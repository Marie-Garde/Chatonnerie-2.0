import { z } from 'zod'
import type { AuthInfo, McpServer } from '@modelcontextprotocol/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUserClient } from './supabase.js'

export const SERVER_INSTRUCTIONS = `Chatonnerie est l'espace de thérapie de couple que l'utilisateur partage avec son ou sa partenaire. Tu n'es pas thérapeute : tu aides à réfléchir, à mettre des mots et à préparer le travail avec un futur thérapeute humain.

- Au début de chaque conversation, appelle get_context pour savoir qui te parle, qui est son ou sa partenaire et ce qui s'est passé dans les dernières séances.
- Quand un sujet a déjà été abordé, retrouve-le avec search_sessions ou get_session plutôt que de faire répéter l'utilisateur.
- Les séances de l'autre partenaire que tu peux lire ont été partagées volontairement. Utilise-les avec tact : ne cite pas mot pour mot ce que l'autre a confié sans que ce soit utile, et ne prends pas parti.
- Les tags sont gérés dans l'appli : get_context renvoie la liste (available_tags). Quand l'utilisateur annonce le sujet ("on va parler de…"), retiens le ou les tags qui correspondent, cherche les séances passées sur ce tag avec list_sessions (topic) pour faire le lien, et applique ces tags à l'enregistrement. Ne crée jamais de tag : si aucun ne correspond, propose à l'utilisateur d'en créer un dans les réglages du site.
- Profil de la relation : get_relation donne les langages de l'amour et des excuses de chacun, leurs modes d'emploi, vos repères, et votre cadre de non-monogamie (règles, hard limits, besoins de chacun pour se sentir en sécurité, mot de pause). Respecte strictement les hard limits et ne propose jamais de les remettre en question. Consulte-le quand c'est utile (dispute, sentiment de manque, idée pour faire plaisir) et appuie-toi dessus concrètement, par exemple en reliant un ressenti au langage principal de la personne.
- Avancées en duo : le couple suit certains sujets. Quand on te demande un bilan ("fais le bilan de nos avancées sur…"), appelle get_progress, lis les séances listées avec get_session et audience "couple", puis écris le bilan avec update_progress_summary. Ce bilan est lu par les deux partenaires : il ne doit jamais s'appuyer sur une séance privée.
- Quand l'utilisateur te demande d'enregistrer la séance, rédige un compte-rendu fidèle et détaillé avec save_session. Il est enregistré en brouillon : l'utilisateur le relira, le publiera et choisira de le partager ou non sur le site.
- Si quelqu'un est en danger ou en détresse, oriente vers les urgences (15, 112) ou le 3114 (prévention du suicide, 24h/24).

Séances à deux :
- Une séance à deux se fait dans le Claude d'un seul des partenaires, les deux étant présents. Si l'utilisateur annonce une séance à deux, ou si les deux partenaires semblent participer, confirme-le avant de commencer.
- Pendant toute la séance à deux, passe audience: "couple" à tous les outils de lecture. Les séances privées et les brouillons non partagés du titulaire du compte sont alors exclus : n'y fais jamais allusion devant le partenaire, même si tu t'en souviens d'une conversation précédente.
- Demande que chaque message commence par le prénom de la personne qui parle. Si ce n'est pas clair, demande qui s'exprime plutôt que de deviner.
- Reste neutre : donne la parole aux deux à tour de rôle, reformule le point de vue de chacun, ne tranche pas qui a raison. Aide-les à exprimer leurs besoins plutôt que leurs reproches.
- À la fin, enregistre avec save_session et type "duo", en attribuant clairement les ressentis et les citations à chacun.`

type Ctx = { http?: { authInfo?: AuthInfo } }

const LANGUAGE_NAMES: Record<'love' | 'apology', Record<string, string>> = {
  love: {
    paroles: 'Paroles valorisantes',
    moments: 'Moments de qualité',
    cadeaux: 'Cadeaux',
    services: 'Services rendus',
    contact: 'Contact physique',
  },
  apology: {
    regrets: 'Exprimer des regrets',
    responsabilite: 'Reconnaître sa responsabilité',
    reparer: 'Réparer',
    changer: "S'engager à changer",
    pardon: 'Demander pardon',
  },
}

const MANUAL_LABELS: Record<string, string> = {
  stress_needs: 'Quand je suis stressé·e, j’ai besoin de',
  stress_avoid: 'Quand je suis stressé·e, il vaut mieux éviter de',
  conflict_helps: 'Pendant une dispute, ce qui m’aide',
  conflict_triggers: 'Ce qui m’enflamme',
  recharge: 'Comment je recharge mes batteries',
  signals: 'Mes signaux quand ça ne va pas',
  other: 'Autre chose à savoir sur moi',
}

const CARE_LABELS: Record<string, string> = {
  info_level: 'Ce que je veux savoir de ses rencontres (tout / essentiel / minimum)',
  info_note: 'Précision sur ce que je veux savoir',
  before: 'Avant un rendez-vous',
  during: 'Pendant',
  after: 'Au retour',
  jealousy: 'Quand je ressens de la jalousie',
  priority: 'Ce qui me fait sentir prioritaire',
}

const LANDMARK_LABELS: Record<string, string> = {
  date: 'date importante',
  ritual: 'rituel',
  activity: 'activité préférée',
  joke: 'private joke',
}

const SUMMARY_COLUMNS = 'id, author_id, type, status, shared, source, title, session_date, topics, summary'

function getAuth(ctx: Ctx) {
  const authInfo = ctx.http?.authInfo
  const userId = authInfo?.extra?.userId
  if (!authInfo || typeof userId !== 'string') throw new Error('Non authentifié.')
  return { supabase: createUserClient(authInfo.token), userId }
}

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function fail(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}

function excerpt(text: string, max = 280) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

interface People {
  me: { id: string; name: string }
  partner: { id: string; name: string } | null
  coupleId: string | null
}

async function loadPeople(supabase: SupabaseClient, userId: string): Promise<People> {
  const { data: membership } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .maybeSingle()

  const coupleId: string | null = membership?.couple_id ?? null
  let memberIds = [userId]
  if (coupleId) {
    const { data: members } = await supabase.from('couple_members').select('user_id').eq('couple_id', coupleId)
    memberIds = (members ?? []).map((m) => m.user_id as string)
  }

  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', memberIds)
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? 'inconnu'
  const partnerId = memberIds.find((id) => id !== userId)

  return {
    me: { id: userId, name: nameOf(userId) },
    partner: partnerId ? { id: partnerId, name: nameOf(partnerId) } : null,
    coupleId,
  }
}

const audienceField = z
  .enum(['me', 'couple'])
  .default('me')
  .describe(
    "'couple' pendant une séance à deux : exclut les séances privées et les brouillons de l'utilisateur pour ne rien révéler au partenaire présent. 'me' sinon.",
  )

type Audience = z.infer<typeof audienceField>

function isVisibleToPartner(row: Record<string, unknown>, people: People) {
  if (row.type === 'duo') return true
  if (row.author_id !== people.me.id) return true
  return row.status === 'published' && row.shared === true
}

function restrictToCouple<T extends { or: (filters: string) => T }>(query: T, audience: Audience, userId: string) {
  if (audience !== 'couple') return query
  return query.or(`author_id.neq.${userId},type.eq.duo,and(status.eq.published,shared.eq.true)`)
}

async function loadTagNames(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from('tags').select('name').eq('scope', 'therapie')
  return [...new Set((data ?? []).map((t) => t.name as string))].sort((a, b) => a.localeCompare(b, 'fr'))
}

function normalizeTag(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function splitTags(requested: string[], available: string[]) {
  const normalized = [...new Set(requested.map(normalizeTag).filter(Boolean))]
  return {
    kept: normalized.filter((t) => available.includes(t)),
    ignored: normalized.filter((t) => !available.includes(t)),
  }
}

function ignoredTagsNote(ignored: string[]) {
  if (!ignored.length) return {}
  return {
    ignored_tags: ignored,
    note: "Ces tags n'existent pas dans l'appli et n'ont pas été appliqués. Propose à l'utilisateur de les créer dans les réglages du site s'il le souhaite.",
  }
}

function describeSession(row: Record<string, unknown>, people: People) {
  const authorId = row.author_id as string
  const author = authorId === people.me.id ? people.me.name : (people.partner?.name ?? 'inconnu')
  return {
    id: row.id,
    title: row.title,
    date: row.session_date,
    type: row.type === 'duo' ? 'à deux' : 'perso',
    author,
    written_by_me: authorId === people.me.id,
    status: row.status === 'published' ? 'publiée' : 'brouillon',
    shared_with_partner: row.type === 'duo' ? true : row.shared,
    visible_to_partner: isVisibleToPartner(row, people),
    source: row.source === 'claude' ? 'rédigée par Claude' : 'écrite à la main',
    topics: row.topics,
    ...(typeof row.summary === 'string' ? { summary_excerpt: excerpt(row.summary) } : {}),
  }
}

const contentFields = {
  title: z.string().min(1).max(200).describe('Titre court et parlant de la séance.'),
  session_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Date de la séance au format AAAA-MM-JJ. Par défaut : aujourd'hui."),
  summary: z.string().describe('Résumé détaillé de ce qui a été dit et exploré, en plusieurs paragraphes.'),
  feelings: z.string().describe('Ressentis et besoins exprimés. En duo, précise qui ressent quoi.'),
  topics: z
    .array(z.string())
    .describe(
      "Tags de la séance, choisis uniquement parmi les tags existants (voir available_tags dans get_context ou list_tags). Les tags inconnus sont ignorés.",
    ),
  quotes: z
    .array(z.string())
    .describe('Phrases importantes, mot pour mot. En duo, préfixe par le prénom : "Prénom : « … »".'),
  open_questions: z.array(z.string()).describe('Questions qui restent à creuser.'),
  next_steps: z.array(z.string()).describe('Exercices, engagements ou pistes à essayer.'),
}

export function registerTools(server: McpServer) {
  server.registerTool(
    'get_context',
    {
      title: 'Contexte',
      description:
        "À appeler au début de chaque conversation. Renvoie qui est l'utilisateur, son ou sa partenaire et les 10 dernières séances accessibles.",
      inputSchema: z.object({ audience: audienceField }),
      annotations: { readOnlyHint: true },
    },
    async ({ audience }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const [people, availableTags] = await Promise.all([loadPeople(supabase, userId), loadTagNames(supabase)])
      const query = supabase
        .from('sessions')
        .select(SUMMARY_COLUMNS)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)
      const { data, error } = await restrictToCouple(query, audience, userId)
      if (error) return fail('Impossible de charger les séances.')

      return json({
        user: people.me.name,
        partner: people.partner?.name ?? null,
        in_couple: !!people.partner,
        audience,
        today: today(),
        available_tags: availableTags,
        recent_sessions: (data ?? []).map((row) => describeSession(row, people)),
      })
    },
  )

  server.registerTool(
    'list_tags',
    {
      title: 'Lister les tags',
      description:
        "Renvoie les tags définis dans l'appli. Quand l'utilisateur annonce le sujet de la conversation, choisis le ou les tags correspondants dans cette liste.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async (_args, ctx) => {
      const { supabase } = getAuth(ctx as Ctx)
      return json({ tags: await loadTagNames(supabase) })
    },
  )

  server.registerTool(
    'list_sessions',
    {
      title: 'Lister les séances',
      description: 'Liste les séances accessibles, des plus récentes aux plus anciennes, avec un extrait du résumé.',
      inputSchema: z.object({
        type: z.enum(['solo', 'duo']).optional().describe('solo = séance perso, duo = séance à deux.'),
        author: z.enum(['me', 'partner']).optional(),
        topic: z.string().optional().describe('Filtrer sur un thème exact.'),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
        audience: audienceField,
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ type, author, topic, limit, offset, audience }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const people = await loadPeople(supabase, userId)

      let query = supabase
        .from('sessions')
        .select(SUMMARY_COLUMNS)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (type) query = query.eq('type', type)
      if (author === 'me') query = query.eq('author_id', userId)
      if (author === 'partner') {
        if (!people.partner) return json({ sessions: [] })
        query = query.eq('author_id', people.partner.id)
      }
      if (topic) query = query.contains('topics', [topic.toLowerCase()])

      const { data, error } = await restrictToCouple(query, audience, userId)
      if (error) return fail('Impossible de lister les séances.')
      return json({ sessions: (data ?? []).map((row) => describeSession(row, people)) })
    },
  )

  server.registerTool(
    'get_session',
    {
      title: 'Lire une séance',
      description: "Renvoie le compte-rendu complet d'une séance.",
      inputSchema: z.object({ id: z.string().uuid(), audience: audienceField }),
      annotations: { readOnlyHint: true },
    },
    async ({ id, audience }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const [people, { data, error }] = await Promise.all([
        loadPeople(supabase, userId),
        supabase.from('sessions').select('*').eq('id', id).maybeSingle(),
      ])
      if (error) return fail('Impossible de lire la séance.')
      if (!data) return fail("Cette séance n'existe pas ou n'est pas accessible.")
      if (audience === 'couple' && !isVisibleToPartner(data, people)) {
        return fail("Séance privée : elle ne doit pas être utilisée pendant une séance à deux.")
      }

      const { summary_excerpt: _excerpt, ...meta } = describeSession(data, people)
      return json({
        ...meta,
        summary: data.summary,
        feelings: data.feelings,
        quotes: data.quotes,
        open_questions: data.open_questions,
        next_steps: data.next_steps,
      })
    },
  )

  server.registerTool(
    'search_sessions',
    {
      title: 'Chercher dans les séances',
      description:
        'Recherche plein texte (en français) dans les titres, résumés, ressentis, citations, questions et pistes de toutes les séances accessibles.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Mots-clés, ex. "belle-mère vacances".'),
        limit: z.number().int().min(1).max(30).default(10),
        audience: audienceField,
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit, audience }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const people = await loadPeople(supabase, userId)
      const search = supabase
        .from('sessions')
        .select(SUMMARY_COLUMNS)
        .textSearch('search', query, { config: 'french', type: 'websearch' })
        .order('session_date', { ascending: false })
        .limit(limit)
      const { data, error } = await restrictToCouple(search, audience, userId)
      if (error) return fail('La recherche a échoué.')
      return json({ results: (data ?? []).map((row) => describeSession(row, people)) })
    },
  )

  server.registerTool(
    'get_relation',
    {
      title: 'Profil de la relation',
      description:
        "Renvoie ce que les deux partenaires ont partagé dans l'onglet Relation : langages de l'amour (comment chacun reçoit et donne), langages des excuses, modes d'emploi (stress, disputes, recharge, signaux), repères du couple (dates, rituels, activités, private jokes) et cadre de non-monogamie (règles, limites de chacun, comment prendre soin de l'autre, mot de pause). Utile pour personnaliser tes conseils.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async (_args, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const people = await loadPeople(supabase, userId)
      const empty = Promise.resolve({ data: [] as Record<string, unknown>[] })
      const [
        { data: profiles },
        { data: manuals },
        { data: landmarks },
        { data: agreements },
        { data: rules },
        { data: limits },
        { data: cares },
      ] = await Promise.all([
        supabase.from('language_profiles').select('user_id, kind, receive_rank, give_rank, examples'),
        supabase.from('user_manuals').select('*'),
        people.coupleId
          ? supabase.from('couple_landmarks').select('kind, title, detail, date').eq('couple_id', people.coupleId)
          : empty,
        people.coupleId
          ? supabase.from('nm_agreements').select('pause_word, next_checkin, last_review').eq('couple_id', people.coupleId)
          : empty,
        people.coupleId
          ? supabase.from('nm_rules').select('text, detail').eq('couple_id', people.coupleId).order('created_at')
          : empty,
        supabase.from('nm_limits').select('user_id, level, text').order('created_at'),
        supabase.from('nm_care').select('*'),
      ])

      const describePerson = (id: string, name: string) => {
        const profile = (kind: 'love' | 'apology') => {
          const p = profiles?.find((row) => row.user_id === id && row.kind === kind)
          if (!p) return null
          const names = LANGUAGE_NAMES[kind]
          const examples = (p.examples ?? {}) as Record<string, { positive?: string[]; negative?: string[] }>
          return {
            receive_ranking: (p.receive_rank as string[]).map((l) => names[l] ?? l),
            ...(kind === 'love' ? { give_ranking: (p.give_rank as string[]).map((l) => names[l] ?? l) } : {}),
            examples: Object.fromEntries(
              Object.entries(examples)
                .filter(([, e]) => e.positive?.length || e.negative?.length)
                .map(([l, e]) => [
                  names[l] ?? l,
                  kind === 'love'
                    ? { me_touche: e.positive ?? [], me_blesse: e.negative ?? [] }
                    : { m_apaise: e.positive ?? [], sonne_faux: e.negative ?? [] },
                ]),
            ),
          }
        }
        const manual = manuals?.find((m) => m.user_id === id)
        const care = cares?.find((c) => c.user_id === id)
        const ownLimits = (limits ?? []).filter((l) => l.user_id === id)
        return {
          name,
          love_languages: profile('love'),
          apology_languages: profile('apology'),
          user_manual: manual
            ? Object.fromEntries(
                Object.entries(MANUAL_LABELS)
                  .filter(([key]) => typeof manual[key] === 'string' && manual[key].trim())
                  .map(([key, label]) => [label, manual[key]]),
              )
            : null,
          non_monogamy: {
            hard_limits: ownLimits.filter((l) => l.level === 'hard').map((l) => l.text),
            limits_to_discuss_first: ownLimits.filter((l) => l.level === 'soft').map((l) => l.text),
            care: care
              ? Object.fromEntries(
                  Object.entries(CARE_LABELS)
                    .filter(([key]) => typeof care[key] === 'string' && care[key].trim())
                    .map(([key, label]) => [label, care[key]]),
                )
              : null,
          },
        }
      }

      return json({
        me: describePerson(people.me.id, people.me.name),
        partner: people.partner ? describePerson(people.partner.id, people.partner.name) : null,
        non_monogamy_agreements: {
          pause_word: (agreements?.[0]?.pause_word as string) || null,
          next_checkin: agreements?.[0]?.next_checkin ?? null,
          last_review: agreements?.[0]?.last_review ?? null,
          rules: (rules ?? []).map((r) => (r.detail ? `${r.text} (${r.detail})` : r.text)),
        },
        landmarks: (landmarks ?? []).map((l) => ({
          type: LANDMARK_LABELS[l.kind as string] ?? l.kind,
          title: l.title,
          ...(l.detail ? { detail: l.detail } : {}),
          ...(l.date ? { date: l.date } : {}),
        })),
      })
    },
  )

  server.registerTool(
    'get_progress',
    {
      title: 'Avancées en duo',
      description:
        "Renvoie les sujets (tags) que le couple a choisi de suivre, avec leur bilan actuel et des statistiques calculées uniquement sur les séances visibles par les deux partenaires.",
      inputSchema: z.object({
        tag: z.string().optional().describe('Limiter à un sujet suivi.'),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ tag }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const people = await loadPeople(supabase, userId)
      if (!people.coupleId || !people.partner) {
        return fail("Les avancées en duo nécessitent un ou une partenaire lié.")
      }

      let progressQuery = supabase
        .from('tag_progress')
        .select('tag, summary, summary_source, summary_updated_at')
        .eq('couple_id', people.coupleId)
      if (tag) progressQuery = progressQuery.eq('tag', normalizeTag(tag))
      const { data: followed, error } = await progressQuery
      if (error) return fail('Impossible de charger les avancées.')
      if (!followed?.length) {
        return json({
          followed_topics: [],
          note: "Aucun sujet suivi. L'utilisateur peut en choisir dans la page Avancées en duo du site.",
        })
      }

      const sessionsQuery = supabase
        .from('sessions')
        .select('id, author_id, type, status, shared, title, session_date, topics, open_questions, next_steps')
        .overlaps('topics', followed.map((f) => f.tag))
        .order('session_date', { ascending: false })
      const { data: rows } = await restrictToCouple(sessionsQuery, 'couple', userId)

      return json({
        followed_topics: followed.map((f) => {
          const related = (rows ?? []).filter((r) => (r.topics as string[]).includes(f.tag))
          return {
            tag: f.tag,
            summary: f.summary || null,
            summary_updated_at: f.summary_updated_at,
            summary_written_by: f.summary_source === 'claude' ? 'Claude' : 'un des partenaires',
            session_count: related.length,
            duo_count: related.filter((r) => r.type === 'duo').length,
            last_session_date: related[0]?.session_date ?? null,
            first_session_date: related[related.length - 1]?.session_date ?? null,
            sessions: related.map((r) => ({ id: r.id, title: r.title, date: r.session_date, type: r.type === 'duo' ? 'à deux' : 'perso partagée' })),
            recent_open_questions: related.slice(0, 3).flatMap((r) => r.open_questions as string[]),
            recent_next_steps: related.slice(0, 3).flatMap((r) => r.next_steps as string[]),
          }
        }),
      })
    },
  )

  server.registerTool(
    'update_progress_summary',
    {
      title: 'Mettre à jour un bilan',
      description:
        "Écrit le bilan global d'un sujet suivi en duo. Avant d'écrire, lis toutes les séances du sujet avec get_progress puis get_session (audience \"couple\"). Le bilan est visible par les deux partenaires : n'utilise jamais une séance privée.",
      inputSchema: z.object({
        tag: z.string().describe('Le sujet suivi.'),
        summary: z
          .string()
          .min(1)
          .describe(
            "Bilan en plusieurs paragraphes : d'où vous partiez, ce qui a été exploré, ce qui a bougé, ce qui reste difficile, les pistes en cours. Ton bienveillant et factuel, sans prendre parti.",
          ),
      }),
    },
    async ({ tag, summary }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)
      const people = await loadPeople(supabase, userId)
      if (!people.coupleId) return fail("Les avancées en duo nécessitent un ou une partenaire lié.")

      const { data, error } = await supabase
        .from('tag_progress')
        .update({ summary, summary_source: 'claude' })
        .eq('couple_id', people.coupleId)
        .eq('tag', normalizeTag(tag))
        .select('tag')
        .maybeSingle()
      if (error) return fail("Le bilan n'a pas pu être enregistré.")
      if (!data) {
        return fail("Ce sujet n'est pas suivi. Propose à l'utilisateur de le suivre dans la page Avancées en duo du site.")
      }
      return json({ updated: true, tag: data.tag })
    },
  )

  server.registerTool(
    'save_session',
    {
      title: 'Enregistrer la séance',
      description:
        "Enregistre le compte-rendu de la séance en cours, en brouillon. À utiliser quand l'utilisateur le demande. Type 'duo' seulement si les deux partenaires participaient à la conversation.",
      inputSchema: z.object({
        type: z.enum(['solo', 'duo']).describe('solo = séance perso, duo = les deux partenaires étaient présents.'),
        ...contentFields,
      }),
    },
    async ({ type, session_date, ...content }, ctx) => {
      const { supabase, userId } = getAuth(ctx as Ctx)

      let coupleId: string | null = null
      if (type === 'duo') {
        const people = await loadPeople(supabase, userId)
        if (!people.partner || !people.coupleId) {
          return fail("Impossible d'enregistrer une séance à deux : l'utilisateur n'a pas encore de partenaire lié.")
        }
        coupleId = people.coupleId
      }

      const tags = splitTags(content.topics, await loadTagNames(supabase))

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...content,
          type,
          couple_id: coupleId,
          session_date: session_date ?? today(),
          topics: tags.kept,
          source: 'claude',
          status: 'draft',
        })
        .select('id, title')
        .single()
      if (error) return fail("La séance n'a pas pu être enregistrée.")

      return json({
        saved: true,
        id: data.id,
        title: data.title,
        tags: tags.kept,
        ...ignoredTagsNote(tags.ignored),
        message:
          type === 'duo'
            ? 'Séance à deux enregistrée en brouillon. Elle est visible par les deux partenaires sur le site.'
            : "Séance enregistrée en brouillon. L'utilisateur peut la relire, la publier et choisir de la partager sur le site.",
      })
    },
  )

  server.registerTool(
    'update_session',
    {
      title: 'Modifier une séance',
      description:
        "Corrige ou complète une séance existante. Seuls les champs fournis sont modifiés. La publication et le partage se décident uniquement sur le site.",
      inputSchema: z.object({
        id: z.string().uuid(),
        title: contentFields.title.optional(),
        session_date: contentFields.session_date,
        summary: contentFields.summary.optional(),
        feelings: contentFields.feelings.optional(),
        topics: contentFields.topics.optional(),
        quotes: contentFields.quotes.optional(),
        open_questions: contentFields.open_questions.optional(),
        next_steps: contentFields.next_steps.optional(),
      }),
    },
    async ({ id, ...patch }, ctx) => {
      const { supabase } = getAuth(ctx as Ctx)
      const values = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      if (!Object.keys(values).length) return fail('Aucun champ à modifier.')
      let ignored: string[] = []
      if (Array.isArray(values.topics)) {
        const tags = splitTags(values.topics as string[], await loadTagNames(supabase))
        values.topics = tags.kept
        ignored = tags.ignored
      }

      const { data, error } = await supabase
        .from('sessions')
        .update(values)
        .eq('id', id)
        .select('id, title')
        .maybeSingle()
      if (error) return fail("La séance n'a pas pu être modifiée.")
      if (!data) return fail("Cette séance n'existe pas ou ne peut pas être modifiée par cet utilisateur.")
      return json({ updated: true, id: data.id, title: data.title, ...ignoredTagsNote(ignored) })
    },
  )
}
