-- Identidade visual pública. As funções operacionais existentes permanecem inalteradas.
begin;
create table if not exists public.store_branding (
 id boolean primary key default true check(id),
 display_name text not null default 'ZenatoCell' check(length(trim(display_name)) between 2 and 60),
 logo_path text check(logo_path is null or logo_path ~ '^logos/[a-f0-9-]+[.]webp$')
);
alter table public.store_branding enable row level security;
revoke all on public.store_branding from anon,authenticated;
grant select on public.store_branding to anon,authenticated;
do $$begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='store_branding' and policyname='branding_read') then
  create policy branding_read on public.store_branding for select to anon,authenticated using(true);
 end if;
end $$;
insert into public.store_branding(id,display_name) values(true,'ZenatoCell') on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('brand-assets','brand-assets',true,2097152,array['image/webp']) on conflict(id) do nothing;
do $$begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='brand_logo_upload') then
  create policy brand_logo_upload on storage.objects for insert to authenticated
   with check(bucket_id='brand-assets' and name ~ '^logos/[a-f0-9-]+[.]webp$' and public.admin_role() in ('superadmin','owner'));
 end if;
end $$;
create or replace function public.save_branding(p_display_name text,p_logo_path text default null)
 returns void language plpgsql security definer set search_path=public as $$
begin
 perform public.require_admin(true);
 if p_display_name is null or length(trim(p_display_name)) not between 2 and 60 then raise exception 'Informe um nome entre 2 e 60 caracteres.'; end if;
 if p_logo_path is not null then
  if p_logo_path !~ '^logos/[a-f0-9-]+[.]webp$' then raise exception 'Arquivo de logo inválido.'; end if;
  if not exists(select 1 from storage.objects where bucket_id='brand-assets' and name=p_logo_path) then raise exception 'Envie a logo antes de salvar.'; end if;
 end if;
 insert into public.store_branding(id,display_name,logo_path) values(true,trim(p_display_name),p_logo_path)
 on conflict(id) do update set display_name=excluded.display_name,logo_path=excluded.logo_path;
end $$;
revoke execute on function public.save_branding(text,text) from public,anon;
grant execute on function public.save_branding(text,text) to authenticated;
commit;
