# CONTROL OS

Plataforma de implementación del Método CONTROL™ para gestionar aprendizaje, ejecución, evidencias, seguimiento, usuarios y control financiero por cliente.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```powershell
npm ci
npm run dev
```

Abre la dirección local indicada por el servidor. En Windows también puede usarse **INICIAR.cmd** cuando las dependencias ya están instaladas.

## Funcionalidad incluida

- Portal cliente y Command Center responsive, con barra lateral contraíble y navegación adaptada a móvil.
- Launcher **Mi Empresa** con sesión y organización compartidas, sin segundo login ni iframe.
- CONTROL Business OS como bounded context separado dentro del mismo repositorio: dashboard ejecutivo, libro financiero, rentabilidad por cliente/servicio, objetivos por checkpoints, tareas, procesos/SOP, reportes e importación preparada.
- Etapa 00 de onboarding con ocho clases, desbloqueo progresivo y regla **aprender → aplicar → entregar → recibir feedback → avanzar**.
- Una metodología maestra para todos los planes: 82 controles internos y 68 clases de implementación a lo largo de las cuatro etapas.
- Gates de salida basados en evidencia al finalizar cada etapa, incluida Delegación y Controles y Escalar con Propósito.
- Etiquetas de responsabilidad `[C]`, `[E]`, `[C+E]` y `[A]` para separar trabajo del cliente, equipo y sistema.
- Clases reproducidas desde enlaces de YouTube, sin almacenar archivos de video en CONTROL OS.
- Seguimiento separado de aprendizaje, ejecución y validación; alerta ante alto consumo y baja aplicación.
- Constructor administrativo de clases con objetivo, aprendizajes, acción, recurso, actividad, entregable, puntuación, revisión y asignación por plan o cliente.
- Controles administrativos para desbloquear, omitir requisito, reabrir y ampliar vencimientos.
- Ruta de 12 semanas con microacciones, evidencia versionada, revisión y aprobación de cierres.
- Adjuntos PDF, Word y Excel como sustento de evidencias y como materiales de módulos.
- Registro y validación de KPIs, CONTROL Score, Execution Score y Health Score.
- Cliente 360 con seguimiento operativo, intervenciones, sesiones, notas y soporte.
- Gestión de usuarios con roles, creación, edición de nombre/usuario, contraseña temporal, cambio de contraseña del cliente, suspensión, reactivación y eliminación protegida del administrador principal.
- Inicio de sesión mediante usuario único —DNI, RUC o alias—, sin autorregistro; las cuentas y empresas son creadas por administración.
- Control financiero por cliente con ingresos, costos, cobros, contribución y resumen de cartera.
- Versionado de planes, entitlements configurables y biblioteca con 34 recursos curriculares de las etapas 3 y 4.
- Soporte metodológico, técnico y de acompañamiento con privacidad, prioridad y SLA según plan.

## Flujo de una clase

Cada clase tiene dos checkpoints: **Clase vista** y **Actividad completada**. El segundo abre el registro de respuesta o evidencia y, cuando corresponde, pasa a revisión administrativa. La siguiente clase se habilita cuando se cumplen sus requisitos, salvo una excepción registrada por el equipo.

Los enlaces admitidos son URLs HTTPS de `youtube.com` o `youtu.be`. El reproductor usa el dominio de privacidad mejorada `youtube-nocookie.com` y carga de forma diferida.

## Supabase

El esquema versionado está en `supabase/migrations`:

1. Modelo multiempresa, planes, ruta, evidencia, KPIs y RLS.
2. Usuarios, módulos, archivos, finanzas y seguimientos.
3. Clases, enlaces de YouTube, avance, revisión y desbloqueos.
4. Checkpoints binarios para clase vista y actividad completada.
5. Usuarios únicos, creación de empresas y checkpoints de objetivos.
6. Metodología maestra, profundidad de acceso por plan, expediente empresarial, entregables y gates de fase.
7. Currículo de módulos 03–07, recursos versionados, soporte con SLA, sesiones y entitlements.
8. Foundation de CONTROL Business OS: workspace, permisos financieros por scope, clientes, servicios, ingresos, gastos e imputaciones, períodos, objetivos por checkpoints, procesos/SOP, snapshots, eventos, exportaciones, SSO one-time y RLS multiempresa.
9. Credenciales administradas: edición segura de clientes, contraseña temporal y obligación de reemplazarla después del acceso.

Consulta [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) para aplicarlo en orden y crear el primer administrador.

## Estado de integración

Las interfaces de CONTROL OS y Business OS conservan su estado en `localStorage` para permitir validación funcional. La edición de contraseña ya dispone de endpoints protegidos para Supabase Auth, pero requiere la sesión real y la variable privada `SUPABASE_SECRET_KEY`; el resto de pantallas todavía no escribe en REST ni Storage. Por ello no deben cargarse datos reales o confidenciales hasta completar la integración de servidor, verificar el aislamiento RLS y ejecutar pruebas de seguridad.

Los selectores de archivo conservan únicamente nombre, tipo y tamaño en el navegador; la carga real al bucket privado queda preparada en el esquema, pero requiere conectar la interfaz. El avance de clases y objetivos se mide por checkpoints completados, no mediante porcentajes ingresados por el usuario.

También siguen pendientes 2FA, invitaciones por correo, auditoría inmutable, backups verificados, email transaccional, pagos, facturación, políticas de retención y UAT con usuarios reales.

La decisión de arquitectura, límites de despliegue y secuencia de construcción están resumidos en [docs/ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md).

## Verificación

```powershell
node --test tests/domain.test.mjs
npx tsc --noEmit
npm run lint
npm run build
```

Las pruebas de dominio cubren evidencias, adjuntos, secuencia, planes, KPIs, aprobaciones, objetivos, intervenciones, módulos, usuarios, finanzas, seguimientos y clases de implementación. No sustituyen pruebas E2E, pruebas de permisos en servidor ni QA visual.

## Referencias principales

- Interfaz: `app/page.tsx`
- Reglas de dominio: `lib/control.ts`
- Estilos: `app/globals.css`
- Configuración de base de datos: `docs/SUPABASE_SETUP.md`
- Arquitectura de plataforma: `docs/ARCHITECTURE_V2.md`
