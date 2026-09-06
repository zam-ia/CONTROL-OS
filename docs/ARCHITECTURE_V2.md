# Arquitectura de CONTROL Platform v2

## Decisión

CONTROL OS y CONTROL Business OS forman una sola plataforma para el usuario, pero mantienen límites de dominio explícitos. En esta etapa viven en un único repositorio y un único proyecto Next.js para reducir costo operativo. Business OS se publica como ruta independiente, conserva su propio estado de interfaz y usa tablas `business_*` separadas. No se necesita un segundo repositorio para el MVP.

Esta estructura permite extraer Business OS a `apps/business-web` o a otro repositorio cuando exista un equipo, ritmo de despliegue, requisito contractual o necesidad de disponibilidad independiente. La extracción no debe cambiar `organization_id`, contratos, eventos ni ownership de datos.

## Límites

| Contexto            | Responsabilidad                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| CONTROL OS          | Metodología, clases, actividades, evidencias, gates, scores, sesiones, soporte y Command Center.                                   |
| CONTROL Business OS | Finanzas operativas, clientes, servicios, objetivos de negocio, tareas continuas, procesos, SOP, rentabilidad, alertas y reportes. |
| Identity Core       | Usuarios, organizaciones, membresías, planes y entitlements.                                                                       |
| Integración         | Deep links, contexto de actividad, referencias de evidencia, snapshots y eventos versionados.                                      |

Business OS no duplica entregables editables de CONTROL OS. Cuando una actividad produce información operativa, CONTROL OS conserva una referencia al recurso o snapshot de Business OS.

## Despliegue

- El frontend Next.js se despliega en Vercel y comparte design tokens, sesión y selector de organización.
- Supabase aporta PostgreSQL, Auth y Storage bajo RLS. Las claves secretas nunca se exponen al navegador.
- SSO usa códigos aleatorios de un solo uso, hash almacenado, TTL corto e intercambio server-to-server.
- Imports, generación de reportes, colas, recálculos y reintentos se ejecutarán en un backend persistente con workers. Vercel aloja el frontend; no se usa como sustituto de esos workers.
- Los ambientes deben mantener datos sintéticos en desarrollo y staging, y datos reales solo en producción.

## Seguridad

Toda tabla cliente resuelve `organization_id` desde la sesión. Las políticas RLS separan lectura general, gestión y finanzas. El acceso financiero del staff requiere assignment, scopes, consentimiento y expiración. Los snapshots son inmutables, los archivos son privados y los movimientos sensibles generan auditoría sin registrar importes ni nombres en logs.

## Estado de implementación

La ruta `/business` implementa el shell responsive y los principales flujos del MVP: dashboard, ledger, rentabilidad, checkpoints, tareas, procesos, reportes e importación preparada. La migración `20260905040000_business_os_foundation.sql` implementa el modelo de datos y las políticas base.

Antes de usar información real todavía se debe conectar la interfaz a Supabase Auth/REST/Storage, implementar el intercambio SSO en servidor, levantar workers persistentes, completar 2FA, probar IDOR/RLS y ejecutar UAT con una empresa piloto.
