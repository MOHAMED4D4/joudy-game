create extension if not exists pgcrypto;
create table if not exists public.game_sessions (
 id uuid primary key default gen_random_uuid(), session_id text unique not null, player_id text not null,
 first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
 device text, browser text, language text, timezone text, screen text, orientation text,
 dpr numeric, referrer_host text, utm_source text, load_ms integer
);
create index if not exists game_sessions_player_id_idx on public.game_sessions(player_id);
create index if not exists game_sessions_last_seen_idx on public.game_sessions(last_seen_at desc);
create table if not exists public.player_events (
 id bigint generated always as identity primary key, session_id text not null, player_id text not null,
 event_type text not null, payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now()
);
create index if not exists player_events_session_idx on public.player_events(session_id, occurred_at);
create index if not exists player_events_type_idx on public.player_events(event_type);
alter table public.game_sessions enable row level security;
alter table public.player_events enable row level security;
-- No public policies: only the Vercel server using the service-role key can access these tables.
revoke all on public.game_sessions, public.player_events from anon, authenticated;
grant all on public.game_sessions, public.player_events to service_role;
-- Dashboard query indexes (safe to run on an existing installation).
create index if not exists player_events_occurred_at_idx on public.player_events(occurred_at desc);
create index if not exists player_events_type_time_idx on public.player_events(event_type, occurred_at desc);
