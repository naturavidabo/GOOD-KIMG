-- GOOD KING V0.9.0 · VERIFICACIÓN

select version, description, applied_at
from public.schema_migrations
where version in ('0.8.0','0.9.0')
order by applied_at;

select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('apply_inventory_movement_v080','good_king_dashboard_v090')
order by p.proname;

select tablename, policyname, cmd
from pg_policies
where schemaname='public'
  and tablename in ('sales','sale_items','inventory_items','inventory_movements')
order by tablename, policyname;

select indexname, indexdef
from pg_indexes
where schemaname='public'
  and indexname in ('devices_business_seen_v090_idx','sync_events_status_v090_idx','inventory_low_stock_v090_idx')
order by indexname;

-- Debe ejecutarse con sesión autenticada desde la app/RPC. Desde SQL Editor
-- auth.uid() no representa al usuario de Good King y el RPC puede rechazar acceso.
