-- Run this entire migration once in Supabase SQL Editor before enabling cloud saving.
begin;

create table public.queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  analysis jsonb not null check (jsonb_typeof(analysis) = 'object'),
  status text not null default 'considering' check (status in ('analyzed', 'considering', 'bought', 'skipped', 'postponed')),
  reason text not null default '' check (length(reason) <= 500),
  reconsider_on date,
  scheduled_on date,
  unique (id, user_id),
  check ((reconsider_on is null and scheduled_on is null) or
    (reconsider_on is not null and scheduled_on is not null and reconsider_on >= scheduled_on))
);
create index queue_items_user_created on public.queue_items(user_id, created_at desc, id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  queue_item_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  purchase_estimate jsonb not null check (jsonb_typeof(purchase_estimate) = 'object'),
  review jsonb check (review is null or jsonb_typeof(review) = 'object'),
  -- Match the composite FK exactly so PostgREST embeds this as one object.
  unique (queue_item_id, user_id),
  foreign key (queue_item_id, user_id) references public.queue_items(id, user_id) on delete cascade
);
create index purchases_user_id on public.purchases(user_id);

alter table public.queue_items enable row level security;
alter table public.purchases enable row level security;
revoke all on public.queue_items, public.purchases from anon;
grant select, insert, update, delete on public.queue_items, public.purchases to authenticated;

create policy queue_select_own on public.queue_items for select to authenticated using ((select auth.uid()) = user_id);
create policy queue_insert_own on public.queue_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy queue_update_own on public.queue_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy queue_delete_own on public.queue_items for delete to authenticated using ((select auth.uid()) = user_id);
create policy purchases_select_own on public.purchases for select to authenticated using ((select auth.uid()) = user_id);
create policy purchases_insert_own on public.purchases for insert to authenticated with check ((select auth.uid()) = user_id);
create policy purchases_update_own on public.purchases for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy purchases_delete_own on public.purchases for delete to authenticated using ((select auth.uid()) = user_id);

create function public.stamp_product_record() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.user_id <> old.user_id or new.created_at <> old.created_at then
      raise exception 'Record identity cannot change';
    end if;
    new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  else
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
  end if;
  return new;
end;
$$;
create trigger queue_stamp before insert or update on public.queue_items for each row execute function public.stamp_product_record();
create trigger purchase_stamp before insert or update on public.purchases for each row execute function public.stamp_product_record();

create function public.preserve_purchase_prediction() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.purchase_estimate is distinct from old.purchase_estimate or new.queue_item_id <> old.queue_item_id then
    raise exception 'The original purchase prediction cannot change';
  end if;
  return new;
end;
$$;
create trigger purchase_prediction before update on public.purchases for each row execute function public.preserve_purchase_prediction();

-- SECURITY INVOKER deliberately keeps all table operations subject to RLS.
-- Parent-row locks make decision + purchase writes atomic and reject stale editors.
create function public.mutate_product(
  p_user_id uuid, p_id uuid, p_action text, p_payload jsonb,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  item public.queue_items;
  purchase public.purchases;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Account changed. Sign in again before saving.' using errcode = '42501';
  end if;
  if p_action = 'create' then
    insert into public.queue_items(id, user_id, analysis)
      values(p_id, p_user_id, p_payload->'analysis') returning * into item;
  else
    select * into item from public.queue_items where id = p_id and user_id = p_user_id for update;
    if not found or p_expected_updated_at is null or item.updated_at <> p_expected_updated_at then
      raise exception 'This record changed or was deleted. Refresh before editing.' using errcode = '40001';
    end if;
    if p_action = 'delete' then
      delete from public.queue_items where id = p_id and user_id = p_user_id;
      return null;
    elsif p_action = 'edit' then
      update public.queue_items set analysis = p_payload->'analysis' where id = p_id and user_id = p_user_id returning * into item;
    elsif p_action = 'decide' then
      if p_payload->>'status' = 'bought' then
        insert into public.purchases(user_id, queue_item_id, purchase_estimate)
          values(p_user_id, p_id, item.analysis) on conflict (queue_item_id, user_id) do nothing;
      end if;
      update public.queue_items set status = p_payload->>'status', reason = p_payload->>'reason',
        reconsider_on = (p_payload->>'reconsiderOn')::date, scheduled_on = (p_payload->>'scheduledOn')::date
        where id = p_id and user_id = p_user_id returning * into item;
    elsif p_action = 'review' then
      if item.status <> 'bought' then
        raise exception 'Mark this product bought before recording a review.';
      end if;
      update public.purchases set review = p_payload->'review' where queue_item_id = p_id and user_id = p_user_id;
      if not found then raise exception 'Purchase snapshot is missing. Existing data was preserved.'; end if;
      update public.queue_items set updated_at = clock_timestamp() where id = p_id and user_id = p_user_id returning * into item;
    else
      raise exception 'Unknown product action';
    end if;
  end if;
  select * into purchase from public.purchases where queue_item_id = p_id and user_id = p_user_id;
  return to_jsonb(item) || jsonb_build_object('purchases', case when purchase.id is null then 'null'::jsonb else to_jsonb(purchase) end);
end;
$$;
revoke all on function public.mutate_product(uuid, uuid, text, jsonb, timestamptz) from public, anon;
grant execute on function public.mutate_product(uuid, uuid, text, jsonb, timestamptz) to authenticated;
revoke all on function public.stamp_product_record(), public.preserve_purchase_prediction() from public, anon;
commit;
