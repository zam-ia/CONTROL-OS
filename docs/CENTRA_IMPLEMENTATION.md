# CENTRA · implementación del PRD v2

Este documento registra la implementación realizada a partir de la especificación funcional y la guía visual suministradas. El documento de producto se trató como fuente de requisitos; no se ejecutaron como órdenes los textos internos del archivo.

## Fase 1 · Identidad y sistema visual

Estado: implementada.

- Marca CENTRA, isotipo, favicon y logotipo horizontal en SVG.
- Tokens de color: negro, bone, amarillo oro, petrol y arena clara.
- Tipografía Inter, radios, sombras, estados y comportamiento responsive alineados con la guía.
- Metadata, acceso y superficies públicas renombradas a CENTRA.

## Fase 2 · Arquitectura de experiencia

Estado: implementada con compatibilidad incremental.

- Experiencia cliente consolidada en Inicio, Mi Ruta, Mi Empresa y Biblioteca.
- Experiencia administrativa consolidada en Portafolio, Programa, Rentabilidad de cartera y Configuración.
- Rutas nuevas resueltas mediante redirecciones; las rutas heredadas permanecen disponibles para evitar pérdida funcional.
- Inicio orientado a “qué hago hoy”, con una acción dominante, prioridades, agenda, alertas y acceso a Mi Empresa.

## Fase 3 · Programa de 13 semanas

Estado: arquitectura y presentación implementadas; la persistencia remota queda detrás de feature flag.

- Semana 0 y semanas 1–13 agrupadas en seis fases del PRD.
- Reglas para seleccionar la siguiente acción y clasificar salud del programa.
- Pruebas unitarias para calendario, prioridad de acción y umbrales de salud.
- El currículo heredado de 12 semanas se conserva hasta validar la migración de datos reales.

## Fase 4 · Mi Empresa

Estado: interfaz funcional implementada.

- Finanzas, clientes, servicios, equipo, cargos, checklists, agenda, tareas, procesos y reportes.
- Equipo ampliado con responsables, cargos, funciones y rutinas recurrentes.
- Estado local normalizado de forma retrocompatible para no romper workspaces existentes.

## Fase 5 · Datos, seguridad y operación

Estado: migración versionada y ejecución remota confirmada por el operador el 21 de septiembre de 2026.

- Migración aditiva `20260922020102_centra_v2_product_architecture.sql`.
- Tareas canónicas con origen `program`, `company`, `process`, `recurring_checklist` o `intervention`.
- Entregables, evidencias versionadas, revisiones, intervenciones, snapshots de score, calendario y notificaciones.
- Finanzas operativas, equipo, cargos, checklists y pasos de procesos.
- Índices de claves foráneas y consultas principales, RLS multiempresa y permisos explícitos para el Data API.
- Feature flags para marca, navegación, tareas unificadas y datos Supabase en vivo.

La migración no elimina tablas ni historial. La activación de tareas unificadas y persistencia en vivo permanece bajo feature flags hasta ejecutar pruebas RLS con al menos dos organizaciones y validar las credenciales del entorno de despliegue.

## Fase 6 · Verificación

Estado: completada para el entorno local disponible.

- Pruebas de dominio y CENTRA.
- TypeScript sin emisión, lint, build de producción y `git diff --check`.
- QA visual del acceso y la barrera autenticada de Mi Empresa en navegador real.
- Comprobación de errores de consola y desborde horizontal en viewport móvil.

La aplicación remota de la migración fue confirmada por el operador. No se declara validada la navegación autenticada completa ni el aislamiento remoto sin credenciales de prueba y acceso de diagnóstico al proyecto Supabase.
