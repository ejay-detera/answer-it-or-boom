-- Answer It! or BOOM! — Phase 2 initial schema, indexes, RLS, and Realtime

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting'
    check (status in ('waiting', 'countdown', 'running', 'finished')),
  base_time_seconds integer not null default 120
    check (base_time_seconds > 0),
  bonus_time_seconds integer not null default 30
    check (bonus_time_seconds >= 0),
  points_per_correct integer not null default 10
    check (points_per_correct >= 0),
  wrong_answer_penalty_seconds integer not null default 0
    check (wrong_answer_penalty_seconds >= 0),
  lobby_locked boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null
    check (char_length(trim(name)) between 2 and 20),
  score integer not null default 0
    check (score >= 0),
  correct_count integer not null default 0
    check (correct_count >= 0),
  wrong_count integer not null default 0
    check (wrong_count >= 0),
  streak integer not null default 0
    check (streak >= 0),
  best_streak integer not null default 0
    check (best_streak >= 0),
  deadline timestamptz,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'exploded', 'completed')),
  finished_at timestamptz,
  joined_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question text not null
    check (char_length(trim(question)) > 0),
  options jsonb not null
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 4),
  correct_index integer not null
    check (correct_index >= 0 and correct_index < jsonb_array_length(options)),
  category text not null
    check (category in ('software', 'general', 'fun')),
  difficulty text not null default 'easy'
    check (difficulty in ('easy', 'medium')),
  is_active boolean not null default true
);

create table if not exists public.player_answers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_index integer not null
    check (selected_index >= 0),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  constraint player_answers_player_question_unique unique (player_id, question_id)
);

-- Indexes
create unique index if not exists players_session_name_lower_uidx
  on public.players (session_id, lower(trim(name)));

create index if not exists players_leaderboard_idx
  on public.players (session_id, score desc, correct_count desc, finished_at asc);

create index if not exists player_answers_player_id_idx
  on public.player_answers (player_id);

create index if not exists player_answers_question_id_idx
  on public.player_answers (question_id);

create index if not exists questions_active_easy_idx
  on public.questions (id)
  where is_active = true and difficulty = 'easy';

-- Row Level Security & least-privilege grants
alter table public.sessions enable row level security;
alter table public.players enable row level security;
alter table public.questions enable row level security;
alter table public.player_answers enable row level security;

revoke all on table public.sessions, public.players, public.questions, public.player_answers
  from anon, authenticated;

grant select on table public.sessions, public.players
  to anon, authenticated;

drop policy if exists sessions_public_read on public.sessions;
create policy sessions_public_read
  on public.sessions
  for select
  to anon, authenticated
  using (true);

drop policy if exists players_public_read on public.players;
create policy players_public_read
  on public.players
  for select
  to anon, authenticated
  using (true);

-- Include old columns (e.g. session_id) on Realtime DELETE events (kick/reset)
alter table public.players replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      alter publication supabase_realtime add table public.sessions;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'players'
    ) then
      alter publication supabase_realtime add table public.players;
    end if;
  end if;
end $$;
