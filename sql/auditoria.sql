-- =========================================================
-- Módulo de Auditoría
-- Usa triggers a nivel de base de datos (no solo llamadas desde la app),
-- así que registra un cambio sin importar si se hizo desde el sistema
-- o directamente en el editor de tablas de Supabase.
--
-- Requiere que sql/fix_recursion_rls.sql ya esté aplicado (usa is_admin()).
-- =========================================================

create table auditoria (
  id uuid primary key default uuid_generate_v4(),
  tabla text not null,
  operacion text not null check (operacion in ('INSERT', 'UPDATE', 'DELETE')),
  registro_id uuid,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  usuario_id uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

create index idx_auditoria_tabla on auditoria(tabla);
create index idx_auditoria_creado_en on auditoria(creado_en desc);

alter table auditoria enable row level security;

-- Solo un admin puede ver el registro de auditoría. Nadie más tiene
-- política de select/insert/update: solo el trigger (que corre como
-- SECURITY DEFINER, saltándose RLS) puede escribir en esta tabla.
create policy "auditoria_select_admin" on auditoria
  for select using (is_admin());

-- =========================================================
-- Función de trigger genérica: guarda el estado antes/después de la
-- fila afectada, quién estaba autenticado en ese momento, y cuándo.
-- =========================================================
create or replace function fn_auditoria()
returns trigger as $$
begin
  insert into auditoria (tabla, operacion, registro_id, datos_anteriores, datos_nuevos, usuario_id)
  values (
    TG_TABLE_NAME,
    TG_OP,
    case when TG_OP = 'DELETE' then OLD.id else NEW.id end,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end,
    auth.uid()
  );

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Productos: toda creación, edición o eliminación (sobre todo cambios de precio)
create trigger trg_auditoria_productos
  after insert or update or delete on productos
  for each row execute function fn_auditoria();

-- Perfiles: solo ediciones (cambios de rol, activar/desactivar personal)
create trigger trg_auditoria_perfiles
  after update on perfiles
  for each row execute function fn_auditoria();
