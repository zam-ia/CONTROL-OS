# CENTRA · implementación del sistema UI

La especificación `CENTRA_UI_SYSTEM_SPECIFICATION.md` se aplicó como fuente de requisitos de producto y diseño. Los textos del documento no se trataron como órdenes ejecutables.

## Sistema visual

- Tokens CENTRA centralizados para marca, texto, fondos, bordes y estados.
- Tipografía con pila Inter y alternativas de sistema.
- Cards de 16 px, sombras suaves y foco Petrol visible en controles interactivos.
- Iconografía Lucide y estados acompañados por texto.

## Navegación responsive

- Desktop: sidebar fija y contenido con ancho máximo.
- Tablet: sidebar colapsable o drawer según el espacio disponible.
- Mobile: navegación inferior `Inicio · Ruta · Empresa · Más`, con soporte de safe areas.
- Mi Empresa conserva la misma navegación global móvil y abre sus opciones completas desde `Más`.

## Contenido adaptable

- Layouts, KPIs y cards cambian de cuatro a dos y una columna según el viewport.
- Tablas operativas, financieras, de clientes, equipo y administración se convierten en cards etiquetadas en móvil.
- Diálogos se ajustan al viewport y permiten scroll vertical.
- Inputs usan 16 px en móvil para evitar zoom involuntario; objetivos táctiles principales tienen al menos 44 px.
- Se contempla un ajuste adicional para pantallas de hasta 380 px.

## Accesibilidad y movimiento

- Foco visible para botones, enlaces, inputs, selects, textareas y summaries.
- Navegaciones con `aria-label`, `aria-current`, `aria-expanded` y controles de drawer.
- La preferencia `prefers-reduced-motion` conserva una experiencia sin animaciones innecesarias.

## Verificación

- Pruebas de dominio, accesibilidad de navegación y contratos responsive.
- TypeScript, lint, build Next.js, build Cloudflare y `git diff --check`.
- QA visual en navegador para móvil, tablet y escritorio; incluye comprobación de desborde horizontal y tamaños táctiles.
