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
3. `supabase/migrations/20260904030000_implementation_classes.sql`
4. `supabase/migrations/20260904040000_lesson_checkpoints.sql`
5. `supabase/migrations/20260905010000_usernames_organizations_goal_checkpoints.sql`
6. `supabase/migrations/20260905020000_master_methodology_phase_gates.sql`
7. `supabase/migrations/20260905030000_curriculum_modules_03_07.sql`
8. `supabase/migrations/20260905040000_business_os_foundation.sql`
9. `supabase/migrations/20260905050000_managed_credentials.sql`

La segunda migración añade suspensión de perfiles, módulos y archivos, movimientos financieros, seguimientos y un bucket privado de módulos. La tercera añade clases de implementación, enlaces de YouTube, avance de aprendizaje, entrega, revisión y desbloqueos administrativos. La cuarta sustituye el porcentaje manual del video por el checkpoint `video_completed`. La quinta añade usuarios únicos, objetivos y checkpoints de avance. La sexta fija una sola metodología CONTROL, añade niveles de acceso sin pérdida de historial, los 46 controles internos, el expediente empresarial, entregables estructurados y gates de salida por fase. La séptima incorpora las 36 clases de las etapas 3 y 4, 34 recursos editoriales versionados, gates avanzados, tickets con SLA, sesiones y entitlements de los módulos 05–07. La octava crea la foundation multiempresa de CONTROL Business OS, con scopes financieros, clientes, servicios, ledger, imputaciones, períodos cerrables, objetivos por checkpoints, procesos/SOP, snapshots, eventos, exportaciones, SSO one-time y almacenamiento privado.

La novena migración añade la marca de contraseña temporal, la fecha del último cambio y el permiso controlado para editar perfiles. Las contraseñas nunca se guardan en Postgres: permanecen exclusivamente en Supabase Auth.

La clave publicable/anon permite usar Auth, REST y Storage bajo RLS, pero no ejecutar DDL. Para aplicar migraciones se necesita una sesión administrativa de Supabase o la contraseña de la base de datos. La clave `service_role` o secret jamás debe exponerse con prefijo `NEXT_PUBLIC_` ni versionarse. Para activar los cambios de contraseña desde la aplicación, configura una clave secret nueva y rotada como `SUPABASE_SECRET_KEY` únicamente en el entorno del servidor de Vercel.

## Primer administrador

Después de crear el primer usuario con Supabase Auth, promociónalo desde SQL Editor usando su UUID:

```sql
update public.profiles
set global_role = 'SUPER_ADMIN'
where id = '<USER_UUID>';
```

Para el administrador principal definido en la interfaz, crea primero la identidad interna `admin@crisdalcompany.com` desde **Authentication → Users**. Este correo no se muestra como acceso en CONTROL OS; la migración 8 le asigna el usuario visible `aldaircrizam`. Después puedes promoverlo sin copiar el UUID manualmente:

```sql
update public.profiles p
set global_role = 'SUPER_ADMIN', status = 'ACTIVE'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'admin@crisdalcompany.com';
```

La asignación se omite de forma segura si el alias `aldaircrizam` ya pertenece a otra cuenta.

La contraseña se configura exclusivamente en Supabase Auth. No debe añadirse a migraciones, variables `NEXT_PUBLIC_*` ni archivos del repositorio. La integración productiva deberá resolver el usuario hacia la identidad de Auth exclusivamente desde el servidor, sin exponer correos internos al navegador.

## Archivos de Business OS

El bucket `control-business-files` es privado y limita cada objeto a 25 MB. Usa el UUID de la organización como primer segmento de la ruta. Los movimientos financieros se protegen además con scopes `finance_read` y `finance_write`; el acceso del staff requiere asignación, consentimiento y vigencia en `business_staff_access`.

## Archivos de evidencia

El bucket `control-os-evidence` es privado. Usa rutas con el UUID de la organización como primer segmento:

```text
<organization_uuid>/<task_uuid>/<file_name>
```

Las políticas de Storage validan ese primer segmento contra la membresía del usuario.

## Archivos de módulos

El bucket `control-os-modules` también es privado, admite únicamente PDF, Word y Excel y limita cada objeto a 15 MB. Solo el equipo interno activo puede gestionarlo; los usuarios activos autenticados pueden leer los materiales publicados. Antes de producción conviene restringir además la lectura por entitlement del plan y semana habilitada.

## Videos de las clases

Los videos no se cargan a Supabase ni al servidor de CONTROL OS. El administrador pega una URL HTTPS de YouTube y la plataforma conserva únicamente la referencia y el checkpoint de clase vista. Esto reduce almacenamiento, transferencia y carga operativa. El usuario no ingresa porcentajes manualmente.
