-- GOOD KING V0.9.0 · OPERACIÓN INTEGRADA Y CONTROL REMOTO
-- Requiere esquema V0.5.1 + migración V0.8.0.
-- Idempotente: puede volver a ejecutarse si se interrumpe.

begin;

create index if not exists devices_business_seen_v090_idx
  on public.devices(business_id, active, last_seen_at desc);
create index if not exists sync_events_status_v090_idx
  on public.sync_events(business_id, sync_status, updated_at desc);
create index if not exists inventory_low_stock_v090_idx
  on public.inventory_items(business_id, theoretical_quantity, updated_at desc)
  where deleted_at is null;

-- El ayudante descuenta inventario únicamente mediante la función segura de venta.
-- Los ajustes manuales vuelven a quedar reservados a administrador/propietaria.
drop policy if exists inventory_items_write on public.inventory_items;
create policy inventory_items_write on public.inventory_items for all to authenticated
using (public.has_business_role(business_id, array['admin','owner']))
with check (public.has_business_role(business_id, array['admin','owner']));

drop policy if exists inventory_movements_write on public.inventory_movements;
create policy inventory_movements_write on public.inventory_movements for all to authenticated
using (public.has_business_role(business_id, array['admin','owner']))
with check (public.has_business_role(business_id, array['admin','owner']));

-- Un ayudante puede reintentar/sincronizar sus propias ventas confirmadas,
-- pero no puede convertir una venta en anulada desde la API.
drop policy if exists sales_update on public.sales;
create policy sales_update on public.sales for update to authenticated
using (public.is_business_member(business_id))
with check (
  public.has_business_role(business_id, array['admin','owner'])
  or (created_by = auth.uid() and status = 'confirmed')
);

-- Mismo criterio para el detalle de una venta: propia y confirmada o rol administrativo.
drop policy if exists sale_items_update on public.sale_items;
create policy sale_items_update on public.sale_items for update to authenticated
using (public.is_business_member(business_id))
with check (
  public.has_business_role(business_id, array['admin','owner'])
  or exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
      and s.business_id = sale_items.business_id
      and s.created_by = auth.uid()
      and s.status = 'confirmed'
  )
);

-- Resumen remoto: una sola llamada para el panel administrativo del celular.
create or replace function public.good_king_dashboard_v090(
  p_business_id uuid,
  p_business_date date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.has_business_role(p_business_id, array['admin','owner']) then
    raise exception 'Acceso administrativo requerido';
  end if;

  with valid_sales as (
    select * from public.sales
    where business_id = p_business_id
      and business_date = p_business_date
      and status = 'confirmed'
      and deleted_at is null
  ),
  sale_summary as (
    select
      count(*)::integer as sales_count,
      coalesce(sum(total),0)::numeric as total_sales,
      coalesce(sum(total) filter (where payment_method='cash'),0)::numeric as cash_sales,
      coalesce(sum(total) filter (where payment_method='qr'),0)::numeric as qr_sales,
      coalesce(sum(estimated_cost),0)::numeric as estimated_cost
    from valid_sales
  ),
  expense_summary as (
    select coalesce(sum(amount),0)::numeric as expense_total
    from public.expenses
    where business_id=p_business_id and expense_date=p_business_date and deleted_at is null
  ),
  purchase_summary as (
    select coalesce(sum(total),0)::numeric as purchase_total
    from public.purchases
    where business_id=p_business_id and purchase_date=p_business_date and deleted_at is null
  ),
  debt_summary as (
    select coalesce(sum(balance),0)::numeric as outstanding_debt
    from public.customers
    where business_id=p_business_id and active=true and deleted_at is null
  ),
  open_cash as (
    select to_jsonb(c) - 'payload' as row
    from public.cash_sessions c
    where c.business_id=p_business_id and c.status='open' and c.deleted_at is null
    order by c.opened_at desc limit 1
  ),
  low_stock as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id,
      'ingredient_id', ing.id,
      'name', ing.name,
      'quantity', i.theoretical_quantity,
      'minimum', ing.minimum_stock,
      'unit', ing.base_unit,
      'updated_at', i.updated_at
    ) order by (i.theoretical_quantity - ing.minimum_stock) asc), '[]'::jsonb) as rows
    from public.inventory_items i
    join public.ingredients ing on ing.id=i.ingredient_id
    where i.business_id=p_business_id
      and i.deleted_at is null
      and ing.deleted_at is null
      and ing.active=true
      and i.theoretical_quantity <= ing.minimum_stock
  )
  select jsonb_build_object(
    'business_date', p_business_date,
    'sales_count', s.sales_count,
    'total_sales', s.total_sales,
    'cash_sales', s.cash_sales,
    'qr_sales', s.qr_sales,
    'estimated_cost', s.estimated_cost,
    'expense_total', e.expense_total,
    'purchase_total', p.purchase_total,
    'net_profit', s.total_sales - s.estimated_cost - e.expense_total,
    'outstanding_debt', d.outstanding_debt,
    'open_cash', (select row from open_cash),
    'low_stock', (select rows from low_stock),
    'generated_at', now()
  ) into v_result
  from sale_summary s, expense_summary e, purchase_summary p, debt_summary d;

  return v_result;
end;
$$;

revoke all on function public.good_king_dashboard_v090(uuid,date) from public;
grant execute on function public.good_king_dashboard_v090(uuid,date) to authenticated;

insert into public.schema_migrations(version, description)
values ('0.9.0', 'Control remoto, panel operativo, refuerzo de roles y sincronización resistente a conflictos')
on conflict (version) do update
set description=excluded.description, applied_at=now();

commit;
