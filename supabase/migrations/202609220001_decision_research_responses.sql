-- Anonymous paired answers only. Independent of auth, Queue, and Purchases.
begin;

create table public.decision_research_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_analysis_id uuid not null unique
    check (session_analysis_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  category text null check (category in (
    'technology', 'clothing', 'home', 'transport', 'hobby', 'sports', 'education', 'travel gear', 'custom'
  )),
  before_intent text not null check (before_intent in ('yes', 'maybe', 'no')),
  after_intent text not null check (after_intent in ('yes', 'maybe', 'no')),
  before_confidence smallint not null check (before_confidence between 1 and 5),
  after_confidence smallint not null check (after_confidence between 1 and 5),
  intention_changed boolean not null,
  confidence_change smallint not null check (confidence_change between -4 and 4),
  constraint research_intention_consistent check (intention_changed = (before_intent <> after_intent)),
  constraint research_confidence_consistent check (confidence_change = after_confidence - before_confidence)
);

alter table public.decision_research_responses enable row level security;

-- Remove Supabase default privileges, then grant only the allowed input columns.
-- Clients cannot provide their own row ID or timestamp, or return/read raw rows.
revoke all on public.decision_research_responses from public, anon, authenticated;
grant insert (
  session_analysis_id, category, before_intent, after_intent,
  before_confidence, after_confidence, intention_changed, confidence_change
) on public.decision_research_responses to anon, authenticated;

-- Column privileges and CHECK/NOT NULL constraints enforce valid complete inserts.
create policy research_insert on public.decision_research_responses
  for insert to anon, authenticated with check (true);

commit;
