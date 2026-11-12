-- Séances semi-publiques : invisibles pour le ou la partenaire (sur le site comme dans son Claude),
-- mais lisibles par Claude pendant une séance à deux. Les règles de lecture existantes ne changent
-- pas : une séance non partagée reste illisible pour l'autre. Seul le serveur MCP, avec la clé
-- service_role, va chercher ces séances pendant une séance à deux.

alter table public.sessions
  add column duo_context boolean not null default false;

alter table public.sessions
  add constraint sessions_duo_context_not_shared check (not (shared and duo_context));
