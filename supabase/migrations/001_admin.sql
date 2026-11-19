-- ZenatoCell: executar no SQL Editor de um projeto Supabase novo.
begin;
create table public.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null, role text not null check(role in ('superadmin','owner','staff')),
 active boolean not null default true
);
create function public.admin_role() returns text language sql stable security definer set search_path=public
as $$ select role from public.members where user_id=auth.uid() and active $$;
create function public.require_admin(p_manage boolean default false) returns void language plpgsql security definer set search_path=public as $$
begin
 if public.admin_role() is null or (p_manage and public.admin_role() not in ('superadmin','owner')) then
 raise exception 'Você não tem permissão para esta ação.'; end if;
end $$;
create table public.products(
 id text primary key, name text not null check(length(name) between 1 and 160),
 category text not null check(category in ('Lacrado','Seminovo','Apple Watch')),
 description text not null default '', photos text[] not null default '{}',
 price bigint check(price>0), cost bigint not null default 0 check(cost>=0),
 installment bigint check(installment>0), months integer not null default 12 check(months between 1 and 48),
 warranty text, stock integer not null default 0 check(stock>=0), active boolean not null default false
);
create table public.orders(
 id uuid primary key default gen_random_uuid(), customer text not null, contact text not null,
 notes text not null default '', status text not null default 'pending' check(status in ('pending','confirmed','paid','cancelled')),
 total bigint not null check(total>=0), created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table public.order_items(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 product_id text not null references public.products(id), name text not null,
 quantity integer not null check(quantity between 1 and 99), unit_price bigint not null, unit_cost bigint not null
);
create table public.stock_movements(
 id uuid primary key default gen_random_uuid(), product_id text not null references public.products(id),
 quantity integer not null check(quantity<>0), reason text not null, order_id uuid references public.orders(id),
 created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table public.financial_entries(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('income','expense')),
 amount bigint not null check(amount>0), description text not null,
 occurred_on date not null default current_date, order_id uuid references public.orders(id),
 created_by uuid references auth.users(id), unique(order_id,kind)
);
-- A loja pública nunca recebe custos, usuários, pedidos ou movimentações.
create view public.store_products as select id,name,category,photos,price,installment,months,warranty from public.products where active;
grant select on public.store_products to anon,authenticated;
alter table public.members enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.financial_entries enable row level security;
create policy member_read on public.members for select to authenticated using(user_id=auth.uid() or public.admin_role()='superadmin');
create policy product_read on public.products for select to authenticated using(public.admin_role() is not null);
create policy order_read on public.orders for select to authenticated using(public.admin_role() is not null);
create policy item_read on public.order_items for select to authenticated using(public.admin_role() is not null);
create policy movement_read on public.stock_movements for select to authenticated using(public.admin_role() is not null);
create policy finance_read on public.financial_entries for select to authenticated using(public.admin_role() in ('superadmin','owner'));
revoke all on public.members,public.products,public.orders,public.order_items,public.stock_movements,public.financial_entries from anon,authenticated;
grant select on public.members,public.products,public.orders,public.order_items,public.stock_movements,public.financial_entries to authenticated;

create function public.save_product(p_product jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 perform public.require_admin(true);
 if jsonb_array_length(p_product->'photos')<1 then raise exception 'Adicione pelo menos uma foto.'; end if;
 insert into public.products(id,name,category,description,photos,price,cost,installment,months,warranty,active)
 values(p_product->>'id',trim(p_product->>'name'),p_product->>'category',coalesce(p_product->>'description',''),
 array(select jsonb_array_elements_text(p_product->'photos')),(p_product->>'price')::bigint,
 (p_product->>'cost')::bigint,(p_product->>'installment')::bigint,(p_product->>'months')::int,p_product->>'warranty',(p_product->>'active')::boolean)
 on conflict(id) do update set name=excluded.name,category=excluded.category,description=excluded.description,
 photos=excluded.photos,price=excluded.price,cost=excluded.cost,installment=excluded.installment,months=excluded.months,warranty=excluded.warranty,active=excluded.active;
end $$;

create function public.adjust_stock(p_product_id text,p_quantity integer,p_reason text) returns void language plpgsql security definer set search_path=public as $$
begin
 perform public.require_admin();
 if p_quantity=0 or length(trim(p_reason))<3 then raise exception 'Informe uma quantidade e um motivo válido.'; end if;
 update public.products set stock=stock+p_quantity where id=p_product_id and stock+p_quantity>=0;
 if not found then raise exception 'Produto inexistente ou estoque insuficiente.'; end if;
 insert into public.stock_movements(product_id,quantity,reason,created_by) values(p_product_id,p_quantity,trim(p_reason),auth.uid());
end $$;

create function public.create_order(p_customer text,p_contact text,p_notes text,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_item jsonb; v_product public.products; v_quantity integer; v_total bigint:=0;
begin
 perform public.require_admin();
 if length(trim(p_customer))<2 or length(trim(p_contact))<5 or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Confira o cliente, contato e itens.'; end if;
 insert into public.orders(customer,contact,notes,total,created_by) values(trim(p_customer),trim(p_contact),coalesce(p_notes,''),0,auth.uid()) returning id into v_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
 select * into v_product from public.products where id=v_item->>'product_id';
 v_quantity:=(v_item->>'quantity')::int;
 if v_product.id is null or v_product.price is null or v_quantity not between 1 and 99 then raise exception 'Produto ou quantidade inválidos.'; end if;
 insert into public.order_items(order_id,product_id,name,quantity,unit_price,unit_cost) values(v_id,v_product.id,v_product.name,v_quantity,v_product.price,v_product.cost);
 v_total:=v_total+v_product.price*v_quantity;
 end loop;
 update public.orders set total=v_total where id=v_id;
 return v_id;
end $$;

create function public.transition_order(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare v_order public.orders; v_item record;
begin
 perform public.require_admin();
 select * into v_order from public.orders where id=p_id for update;
 if v_order.id is null then raise exception 'Pedido não encontrado.'; end if;
 if v_order.status=p_status then return; end if;
 if p_status='confirmed' and v_order.status='pending' then
 for v_item in select product_id,sum(quantity)::int as quantity from public.order_items where order_id=p_id group by product_id order by product_id loop
 update public.products set stock=stock-v_item.quantity where id=v_item.product_id and stock>=v_item.quantity;
 if not found then raise exception 'Estoque insuficiente. Confira os itens antes de confirmar.'; end if;
 insert into public.stock_movements(product_id,quantity,reason,order_id,created_by) values(v_item.product_id,-v_item.quantity,'Venda confirmada',p_id,auth.uid());
 end loop;
 elsif p_status='paid' and v_order.status='confirmed' then
 perform public.require_admin(true);
 insert into public.financial_entries(kind,amount,description,order_id,created_by) values('income',v_order.total,'Recebimento do pedido '||left(p_id::text,8),p_id,auth.uid());
 elsif p_status='cancelled' and v_order.status in ('pending','confirmed','paid') then
 if v_order.status='paid' then
 perform public.require_admin(true);
 insert into public.financial_entries(kind,amount,description,order_id,created_by) values('expense',v_order.total,'Estorno do pedido '||left(p_id::text,8),p_id,auth.uid());
 end if;
 if v_order.status in ('confirmed','paid') then
 for v_item in select product_id,sum(quantity)::int as quantity from public.order_items where order_id=p_id group by product_id order by product_id loop
 update public.products set stock=stock+v_item.quantity where id=v_item.product_id;
 insert into public.stock_movements(product_id,quantity,reason,order_id,created_by) values(v_item.product_id,v_item.quantity,'Cancelamento da venda',p_id,auth.uid());
 end loop;
 end if;
 else raise exception 'Esta mudança de situação não é permitida.'; end if;
 update public.orders set status=p_status where id=p_id;
end $$;

create function public.add_financial_entry(p_kind text,p_amount bigint,p_description text,p_date date) returns void language plpgsql security definer set search_path=public as $$
begin
 perform public.require_admin(true);
 if length(trim(p_description))<3 then raise exception 'Descreva o lançamento.'; end if;
 insert into public.financial_entries(kind,amount,description,occurred_on,created_by) values(p_kind,p_amount,trim(p_description),p_date,auth.uid());
end $$;
create function public.set_member(p_user_id uuid,p_role text,p_active boolean) returns void language plpgsql security definer set search_path=public as $$
declare v_email text;
begin
 if public.admin_role() is distinct from 'superadmin' then raise exception 'Somente o superadmin pode gerenciar acessos.'; end if;
 if p_user_id=auth.uid() then raise exception 'Você não pode alterar seu próprio acesso.'; end if;
 select email into v_email from auth.users where id=p_user_id;
 if v_email is null then raise exception 'Crie a conta no Supabase Auth antes de liberar o acesso.'; end if;
 insert into public.members(user_id,email,role,active) values(p_user_id,v_email,p_role,p_active)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,email=excluded.email;
end $$;
revoke execute on function public.admin_role(),public.require_admin(boolean),public.save_product(jsonb),public.adjust_stock(text,integer,text),public.create_order(text,text,text,jsonb),public.transition_order(uuid,text),public.add_financial_entry(text,bigint,text,date),public.set_member(uuid,text,boolean) from public,anon;
grant execute on function public.admin_role(),public.require_admin(boolean),public.save_product(jsonb),public.adjust_stock(text,integer,text),public.create_order(text,text,text,jsonb),public.transition_order(uuid,text),public.add_financial_entry(text,bigint,text,date),public.set_member(uuid,text,boolean) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy product_images_upload on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.admin_role() in ('superadmin','owner'));
create policy product_images_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.admin_role() in ('superadmin','owner'));
create index order_items_order_idx on public.order_items(order_id);
create index stock_created_idx on public.stock_movements(created_at desc);
create index orders_created_idx on public.orders(created_at desc);
commit;
