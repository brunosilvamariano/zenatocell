-- Validação defensiva do cadastro; preserva dados e permissões existentes.
begin;
create or replace function public.save_product(p_product jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 perform public.require_admin(true);
 if jsonb_typeof(p_product) is distinct from 'object' then raise exception 'Dados do produto inválidos.'; end if;
 if jsonb_typeof(p_product->'photos') is distinct from 'array' then raise exception 'Adicione pelo menos uma foto.'; end if;
 if jsonb_array_length(p_product->'photos')<1 then raise exception 'Adicione pelo menos uma foto.'; end if;
 if exists(select 1 from jsonb_array_elements(p_product->'photos') as photo(value) where jsonb_typeof(value) is distinct from 'string' or length(trim(value #>> '{}'))=0) then raise exception 'Confira as fotos do produto.'; end if;
 insert into public.products(id,name,category,description,photos,price,cost,installment,months,warranty,active)
 values(p_product->>'id',trim(p_product->>'name'),p_product->>'category',coalesce(p_product->>'description',''),
 array(select jsonb_array_elements_text(p_product->'photos')),(p_product->>'price')::bigint,
 (p_product->>'cost')::bigint,(p_product->>'installment')::bigint,(p_product->>'months')::int,p_product->>'warranty',(p_product->>'active')::boolean)
 on conflict(id) do update set name=excluded.name,category=excluded.category,description=excluded.description,
 photos=excluded.photos,price=excluded.price,cost=excluded.cost,installment=excluded.installment,months=excluded.months,warranty=excluded.warranty,active=excluded.active;
end $$;
create or replace function public.create_order(p_customer text,p_contact text,p_notes text,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_item jsonb; v_product public.products; v_quantity integer; v_total bigint:=0;
begin
 perform public.require_admin();
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Adicione os itens do pedido.'; end if;
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
commit;
