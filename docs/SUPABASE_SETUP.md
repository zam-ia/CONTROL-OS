# Supabase para CONTROL OS

El proyecto está asociado al `project_id` configurado en `supabase/config.toml`. La migración inicial crea el modelo multiempresa, contenido del programa, roles, políticas RLS y almacenamiento privado para evidencias.

## Aplicar la migración

Opción CLI (recomendada para mantener historial):

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Opción Dashboard: abre **SQL Editor** y ejecuta, en orden y una sola vez:

1. `supabase/migrations/20260904010000_control_os_foundation.sql`
2. `supabase/migrations/20260904020000_admin_modules_finance.sql`

La segunda migración añade suspensión de perfiles, módulos y archivos, movimientos financieros, seguimientos y un bucket privado de módulos.

La clave publicable/anon permite usar Auth, REST y Storage bajo RLS, pero no ejecutar DDL. Para aplicar migraciones se necesita una sesión administrativa de Supabase o la contraseña de la base de datos. La clave `service_role` o secret jamás debe exponerse con prefijo `NEXT_PUBLIC_` ni versionarse.

## Primer administrador

Después de crear el primer usuario con Supabase Auth, promociónalo desde SQL Editor usando su UUID:

```sql
update public.profiles
set global_role = 'SUPER_ADMIN'
where id = '<USER_UUID>';
```

## Archivos de evidencia

El bucket `control-os-evidence` es privado. Usa rutas con el UUID de la organización como primer segmento:

```text
<organization_uuid>/<task_uuid>/<file_name>
```

Las políticas de Storage validan ese primer segmento contra la membresía del usuario.

## Archivos de módulos

El bucket `control-os-modules` también es privado, admite únicamente PDF, Word y Excel y limita cada objeto a 15 MB. Solo el equipo interno activo puede gestionarlo; los usuarios activos autenticados pueden leer los materiales publicados. Antes de producción conviene restringir además la lectura por entitlement del plan y semana habilitada.
