-- Schema fuer recipe_box. Im Supabase SQL-Editor ausfuehren.

create table if not exists public.categories (
  id    text primary key,
  name  text not null unique,
  icon  text not null default '',
  color text not null default ''
);

create table if not exists public.recipes (
  id        bigint generated always as identity primary key,
  name      text not null unique,
  category  text not null default '',
  bemerkung text not null default ''
);

create table if not exists public.ingredients (
  id         bigint generated always as identity primary key,
  recipe_id  bigint not null references public.recipes(id) on delete cascade,
  zutat      text not null default '',
  menge      text not null default '',
  taetigkeit text not null default '',
  sort_order integer not null default 0
);
create index if not exists ingredients_recipe_id_idx on public.ingredients(recipe_id, sort_order);

alter table public.categories  enable row level security;
alter table public.recipes     enable row level security;
alter table public.ingredients enable row level security;

-- Lesen: oeffentlich. Schreiben: nur service_role (umgeht RLS).
drop policy if exists "public read categories"  on public.categories;
drop policy if exists "public read recipes"     on public.recipes;
drop policy if exists "public read ingredients" on public.ingredients;
create policy "public read categories"  on public.categories  for select to anon, authenticated using (true);
create policy "public read recipes"     on public.recipes     for select to anon, authenticated using (true);
create policy "public read ingredients" on public.ingredients for select to anon, authenticated using (true);

-- Rezept + Zutaten atomar anlegen (p_original_name null) oder aktualisieren.
create or replace function public.save_recipe(
  p_original_name text,
  p_name text,
  p_category text,
  p_bemerkung text,
  p_ingredients jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  rid bigint;
begin
  if p_original_name is null then
    insert into recipes(name, category, bemerkung)
    values (p_name, p_category, coalesce(p_bemerkung, ''))
    returning id into rid;
  else
    update recipes
       set name = p_name, category = p_category, bemerkung = coalesce(p_bemerkung, '')
     where name = p_original_name
    returning id into rid;
    if rid is null then raise exception 'not_found'; end if;
    delete from ingredients where recipe_id = rid;
  end if;

  insert into ingredients(recipe_id, zutat, menge, taetigkeit, sort_order)
  select rid, coalesce(e->>'zutat', ''), coalesce(e->>'menge', ''), coalesce(e->>'taetigkeit', ''), (o - 1)::int
  from jsonb_array_elements(p_ingredients) with ordinality as t(e, o);
end;
$$;

revoke execute on function public.save_recipe(text,text,text,text,jsonb) from public, anon, authenticated;
grant  execute on function public.save_recipe(text,text,text,text,jsonb) to service_role;
