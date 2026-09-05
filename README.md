# CONTROL OS — demo funcional

Primera implementación navegable basada en **CONTROL_OS_Especificacion_Funcional_Tecnica_v1.0.pdf** (44 páginas). No es el MVP productivo completo.

## Ejecutar

Requiere Node.js 24 y npm.

```powershell
npm ci
npm run dev
```

Abre la dirección local que muestre el servidor. El script **INICIAR.cmd** arranca la demo cuando las dependencias ya están instaladas.

## Recorrido recomendado

1. Selecciona **Estudio Norte** y **Vista cliente**.
2. En **Mi Ruta → Semana 1**, marca el contenido revisado.
3. Abre las tres microacciones y envía evidencia de texto (al menos 10 caracteres).
4. Confirma el checklist y registra un KPI con fuente y fecha. Un indicador/período no se puede duplicar.
5. Envía el cierre a revisión. Tener 100% ejecutado **no** aprueba la semana.
6. Cambia a **Vista admin → Revisiones**. Abre cada tarea y acepta su evidencia.
7. Aprueba el cierre con comentario. Regresa al cliente: la semana 2 queda disponible.
8. Prueba **Portafolio → Cliente 360 → Intervenir** para registrar causa, acción, responsable y plazo.
9. En administración revisa **Módulos**, **Finanzas** y **Configuración → Usuarios y accesos**.

La pantalla de acceso y el selector de vista son simulaciones locales, NO autenticación real. Las tres empresas son ficticias.

## Implementado

- Portal cliente y Command Center adaptables a escritorio y móvil.
- Tres empresas demo, una por plan; ruta de 12 semanas con objetivos, tres microacciones por semana y requisitos.
- Evidencia versionada con descripción y metadatos de PDF, Word o Excel, bloqueos, devolución con comentarios y aprobación.
- Cierre híbrido, restricciones de secuencia y acceso por etapas del plan en la lógica local.
- Registro y validación manual de KPIs; objetivos ascendentes y descendentes.
- CONTROL Score resumido por dimensión, Execution Score y Health Score separados, con fórmulas demo explícitas.
- Portafolio filtrable, Cliente 360 con resumen operativo, bitácora de seguimiento, intervenciones, notas compartidas y soporte local.
- Administración de módulos por plan y semana, con archivos de apoyo visibles en la biblioteca del cliente.
- Control financiero demo por cliente: ingresos, costos, estados de cobro, contribución y resumen de cartera.
- Gestión local de usuarios con roles, alta, suspensión/reactivación y eliminación protegida del administrador principal.
- Pantallas ligeras y adaptables de inicio de sesión y registro para validar la experiencia de acceso.
- Sesión ilustrativa, asistencia y conversión de acuerdos en tareas.
- Biblioteca con cinco plantillas CSV de ejemplo.
- Versiones de planes que no migran automáticamente contratos existentes.
- Umbrales de salud editables y timeline local de acciones.
- Persistencia en localStorage, aviso si falla el guardado y exportación JSON desde administración.

## Límites importantes

No cargar datos reales ni confidenciales. **Todo el estado, incluidas notas e información de las tres empresas, está en el navegador.** Los filtros y validaciones de esta demo no constituyen seguridad.

Incluye una base inicial de PostgreSQL/Supabase versionada en `supabase/migrations`, con RLS multiempresa y bucket privado de evidencias. La interfaz demo todavía usa `localStorage`: aún no está conectada a Auth, REST ni Storage y las políticas requieren pruebas de aislamiento antes de producción.

No incluye autenticación real, cuentas e invitaciones de servidor, 2FA, API de aplicación, cifrado adicional, auditoría automática inmutable, backups verificados, envío de email, jobs, integraciones, CMS completo, importación de KPIs, procesamiento de pagos, facturación ni contratos. Los archivos seleccionados no se suben: únicamente se conserva nombre, tipo y tamaño en `localStorage`.

Los videos y materiales originales no se proporcionaron. Se incluyen textos y plantillas de ejemplo, no una migración del campus.

Los scores son demostrativos: CONTROL acepta cuatro totales de dimensión (no los 20 criterios completos); Execution es acumulado hasta la semana actual; Health usa señales simplificadas y evaluación manual neutral. No usar estos cálculos para decisiones comerciales reales. El umbral de 80% del dataset crítico del PDF no se evalúa: el gate demo comprueba tres entregables, contenido, checklist y un KPI reportado.

Las fechas demo se generan al iniciar un navegador nuevo. Se muestra America/Lima y PEN; no existe configuración internacional por tenant.

Los consentimientos, onboarding, elegibilidad Partnership, revisión legal, versiones CMS y políticas de retención siguen pendientes. No se ha aprobado ninguna propuesta comercial del PDF.

## Verificación

Comprobado durante esta entrega: pruebas de dominio, TypeScript y lint del código de aplicación sin errores, compilación de producción completada. Esto no certifica seguridad de aplicación ni sustituye pruebas manuales.

```powershell
node --test tests/domain.test.mjs
npx tsc --noEmit
npm run build
```

Las pruebas de dominio cubren evidencias y adjuntos, conservación de versiones, secuencia, plan, KPIs inválidos/duplicados, aprobación, inmutabilidad, objetivos, intervenciones, módulos, usuarios, finanzas y seguimientos.

Estas pruebas no sustituyen E2E, pruebas de permisos servidor ni QA visual. No se realizó interacción automatizada de navegador. WebMCP se registra si existe document.modelContext; su contrato no se verificó en un contexto de navegador compatible.

## Trazabilidad al PDF

| Entrega demo                 | Secciones de referencia |
| ---------------------------- | ----------------------- |
| Ruta y microacciones         | 2, 6.3–6.5, 19          |
| Gates y evidencia            | 8.1–8.2, 8.8, 15.2      |
| Objetivos e indicadores      | 6.6, 6.10, 8.3–8.5      |
| Portafolio e intervenciones  | 7.1–7.3                 |
| Planes y versionado parcial  | 3, 7.6                  |
| Diseño y estados             | 11                      |
| Trabajo productivo pendiente | 12, 16–17, 23–24        |

## Siguiente fase productiva

1. Aprobar entitlements, rúbrica de 20 criterios, KPIs obligatorios, datos Owner-only y políticas de retención.
2. Conectar la interfaz a Supabase Auth/API y completar pruebas de aislamiento de tenant.
3. Conectar storage privado y email, implantar auditoría y recuperación de backups.
4. Cargar materiales originales y ejecutar UAT con un cliente y un consultor piloto.

Código de interfaz: `app/page.tsx`. Reglas demo: `lib/control.ts`. Estilos: `app/globals.css`. Guía de base de datos: `docs/SUPABASE_SETUP.md`.
