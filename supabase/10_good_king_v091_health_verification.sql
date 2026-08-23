-- GOOD KING V0.9.1 · VERIFICACIÓN DE SALUD (SOLO LECTURA)
-- No crea, modifica ni elimina datos.

-- 1) Migraciones base requeridas por la V0.9.1.
select version, description, applied_at
from public.schema_migrations
where version in ('0.8.0','0.9.0')
order by version;

-- 2) Tablas críticas para acceso y operación.
with required(name) as (
  values
    ('businesses'),('profiles'),('business_members'),('devices'),
    ('cash_sessions'),('sales'),('sale_items'),('customers'),
    ('customer_credit_movements'),('products'),('product_categories'),
    ('ingredients'),('inventory_items'),('inventory_movements'),
    ('purchases'),('purchase_items'),('recipes'),('recipe_items'),
    ('market_lists'),('market_list_items'),('expenses'),('audit_logs'),('sync_events')
)
select r.name as required_table,
       case when t.table_name is null then 'MISSING' else 'OK' end as status,
       coalesce(c.relrowsecurity,false) as rls_enabled
from required r
left join information_schema.tables t
  on t.table_schema='public' and t.table_name=r.name
left join pg_class c on c.relname=r.name and c.relnamespace='public'::regnamespace
order by r.name;

-- 3) Funciones críticas de V0.8/V0.9.
with required(name) as (
  values ('apply_inventory_movement_v080'),('good_king_dashboard_v090')
)
select r.name as required_function,
       case when p.proname is null then 'MISSING' else 'OK' end as status,
       pg_get_function_identity_arguments(p.oid) as arguments
from required r
left join pg_proc p on p.proname=r.name
left join pg_namespace n on n.oid=p.pronamespace and n.nspname='public'
order by r.name;

-- 4) Usuarios de Good King y membresías activas (no muestra contraseñas).
select u.email,
       p.display_name,
       p.active as profile_active,
       bm.role,
       bm.active as membership_active,
       b.name as business_name
from auth.users u
left join public.profiles p on p.id=u.id
left join public.business_members bm on bm.user_id=u.id
left join public.businesses b on b.id=bm.business_id
where lower(u.email) in ('goodking.bo@gmail.com','gloria.msg27@gmail.com')
order by u.email;

-- 5) Conteo rápido de políticas RLS por tabla crítica.
select tablename, count(*) as policy_count
from pg_policies
where schemaname='public'
  and tablename in ('businesses','profiles','business_members','cash_sessions','sales','sale_items','customers','products','inventory_items','inventory_movements','expenses','sync_events')
group by tablename
order by tablename;

-- Resultado esperado:
-- - migraciones 0.8.0 y 0.9.0 presentes;
-- - ninguna tabla/función marcada MISSING;
-- - RLS true en tablas comerciales;
-- - usuarios autorizados con profile_active=true y membership_active=true.
