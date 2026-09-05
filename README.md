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
- Etapa 00 de onboarding con ocho clases, desbloqueo progresivo y regla **aprender → aplicar → entregar → recibir feedback → avanzar**.
- Clases reproducidas desde enlaces de YouTube, sin almacenar archivos de video en CONTROL OS.
- Seguimiento separado de aprendizaje, ejecución y validación; alerta ante alto consumo y baja aplicación.
- Constructor administrativo de clases con objetivo, aprendizajes, acción, recurso, actividad, entregable, puntuación, revisión y asignación por plan o cliente.
- Controles administrativos para desbloquear, omitir requisito, reabrir y ampliar vencimientos.
- Ruta de 12 semanas con microacciones, evidencia versionada, revisión y aprobación de cierres.
- Adjuntos PDF, Word y Excel como sustento de evidencias y como materiales de módulos.
- Registro y validación de KPIs, CONTROL Score, Execution Score y Health Score.
- Cliente 360 con seguimiento operativo, intervenciones, sesiones, notas y soporte.
- Gestión de usuarios con roles, creación, suspensión, reactivación y eliminación protegida del administrador principal.
- Control financiero por cliente con ingresos, costos, cobros, contribución y resumen de cartera.
- Versionado de planes, biblioteca de recursos y exportación administrativa en JSON.

## Flujo de una clase

Una clase no se completa únicamente por reproducir el video. El cierre requiere al menos 90% confirmado, la actividad enviada y, cuando corresponde, aprobación administrativa. La siguiente clase se habilita cuando se cumplen sus requisitos, salvo una excepción registrada por el equipo.

Los enlaces admitidos son URLs HTTPS de `youtube.com` o `youtu.be`. El reproductor usa el dominio de privacidad mejorada `youtube-nocookie.com` y carga de forma diferida.

## Supabase

El esquema versionado está en `supabase/migrations`:

1. Modelo multiempresa, planes, ruta, evidencia, KPIs y RLS.
2. Usuarios, módulos, archivos, finanzas y seguimientos.
3. Clases, enlaces de YouTube, avance, revisión y desbloqueos.

Consulta [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) para aplicarlo en orden y crear el primer administrador.

## Estado de integración

La interfaz actual conserva su estado en `localStorage` para permitir validación funcional. Todavía no está conectada a Supabase Auth, REST ni Storage. Por ello no deben cargarse datos reales o confidenciales hasta completar la integración, verificar el aislamiento RLS y ejecutar pruebas de seguridad.

Los selectores de archivo conservan únicamente nombre, tipo y tamaño en el navegador; la carga real al bucket privado queda preparada en el esquema, pero requiere conectar la interfaz. La medición del video usa confirmaciones por hitos; en producción debe integrarse YouTube IFrame Player API y validar los eventos en el servidor.

También siguen pendientes 2FA, invitaciones por correo, auditoría inmutable, backups verificados, email transaccional, pagos, facturación, políticas de retención y UAT con usuarios reales.

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
