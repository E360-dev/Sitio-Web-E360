# Prompt para Claude Code — Rediseño del Admin Dashboard E360

Copia todo lo que está debajo de la línea y pégalo en Claude Code dentro del repo `web-e360-limpio`.

---

## Contexto

Stack actual: React + Vite + Tailwind CSS + `@heroicons/react`. **No añadas dependencias nuevas.** Respeta el patrón existente (componentes funcionales, clases utilitarias de Tailwind, iconos de heroicons). Solo se tocan 3 archivos:

- `src/pages/AdminDashboard.jsx`
- `src/components/admin/ServerControlButton.jsx`
- `src/components/admin/AdminSidebar.jsx`

Paleta en uso: navy `#1a2f4e`, navy sidebar `#2e527f`, cian `#25c6e3`, rosa/rojo `#e80554`, rosa claro `#ff5b8f`.

Objetivo: pasar del estado actual al mockup objetivo. Cambios por archivo:

---

## 1. `src/components/admin/AdminSidebar.jsx` — sidebar blanco

Estado actual: `<aside>` con fondo `bg-[#2e527f]` y texto blanco, sin encabezado, logo invertido a blanco.

Cambiar a:

- **Fondo blanco** (`bg-white`), borde derecho sutil (`border-r border-gray-200`), sombra suave. Quitar `text-white`.
- **Encabezado nuevo** arriba del nav: título `PANEL DE CONTROL` en navy `#1a2f4e`, font-black, tracking amplio, tamaño pequeño/medio. Debajo, una **línea con degradado rosa→cian** (`bg-gradient-to-r from-[#e80554] to-[#25c6e3]`), ~`h-1 w-32 rounded-full`. Separado con padding (`px-6 pt-8 pb-6`).
- **Items de navegación** (Dashboard, Gestión de Documentos, Enviar Notificación):
  - Inactivo: texto gris (`text-gray-500`), icono gris (`text-gray-400`), hover `bg-gray-50 text-[#1a2f4e]`.
  - Activo: fondo azul claro (`bg-[#25c6e3]/10` o `bg-[#eef6fb]`), texto navy `#1a2f4e` font-bold, icono cian `#25c6e3`, borde/indicador izquierdo cian.
- **Separador** antes de "Abrir App UNC": `border-t border-gray-200`.
- **"Abrir App UNC"**: texto en **rojo/rosa `#e80554`**, con icono de subida/enlace (`ArrowUpTrayIcon` o `ArrowTopRightOnSquareIcon`) también en rojo. Mantener el `href="http://3.151.184.227:8501"`, `target="_blank"`, `rel="noopener noreferrer"`.
- **Footer / logo E360**: quitar las clases `brightness-0 invert` para que el logo se vea en su color original (navy) sobre fondo blanco. Footer con `border-t border-gray-200`, sin el fondo navy.

Mantener el ancho `w-72` y la estructura `flex flex-col`.

---

## 2. `src/pages/AdminDashboard.jsx` — banner, orden de tarjetas y KPI

### 2a. Banner superior (menú de 3 puntos)
Hoy hay 3 puntos horizontales de colores dentro de una píldora. Cambiarlo por un **menú de 3 puntos verticales** (`EllipsisVerticalIcon` de heroicons) en blanco/cian dentro del banner navy. Mantener el `<button aria-label="Opciones del panel">`.

### 2b. Texto de bienvenida
Actual: `Bienvenido, {userName}. Gestión estratégica del sistema E360.`
Cambiar a formato con guion y nombre capitalizado:
`Bienvenido {NombreCapitalizado} - Gestión estratégica del Sistema E360`
(capitaliza la primera letra de `userName`; mantén el color cian `#25c6e3`).

### 2c. Orden y layout de las tarjetas superiores (cambio principal)
Hoy el grid es: **Clientes Registrados** (izquierda, `col-span-1`) + **Estado del Sistema** (derecha, `col-span-2`).

Invertir el orden y proporciones para que quede como el mockup:

- **Estado del Sistema a la IZQUIERDA y más ancho** (`md:col-span-2`): contenedor navy `#1a2f4e`, header con `CpuChipIcon` cian + título `Estado del Sistema`, y dentro el `<ServerControlButton />`.
- **Clientes Registrados a la DERECHA, como tarjeta cuadrada** (`md:col-span-1`).

### 2d. Rediseñar la tarjeta de Clientes (KpiCard) a layout vertical centrado
Actual: layout horizontal (icono a la izquierda, texto a la derecha).
Cambiar a **vertical y centrado** como en el mockup:
- Icono `UserGroupIcon` cian arriba, centrado, dentro de un círculo `bg-white/10`.
- Debajo, label `Clientes Registrados` (uppercase, tracking, `text-white/60`).
- Debajo, el número grande `5` (`text-4xl/5xl font-black text-white`).
- Todo con `flex flex-col items-center justify-center text-center`.

Mantener el fondo `bg-[#1a2f4e]`, `rounded-2xl`, borde `border-white/10`. Conservar la prop `isLoading` (muestra `...`).

### 2e. Accesos Directos
- Junto al título `Accesos Directos`, añadir un icono de mano/puntero (`CursorArrowRaysIcon` o `HandRaisedIcon`) en cian, y extender la línea/regla horizontal hacia la derecha (`flex-1 h-px bg-white/10`) junto al subrayado cian actual.
- Tarjeta **Notificaciones Manuales**: cambiar el icono de sobre (`EnvelopeIcon`) por una **campana con punto de notificación** (`BellAlertIcon` o `BellIcon`), en cian. Mantener título y descripción.
- Tarjeta **Gestión de Documentos**: mantener `DocumentDuplicateIcon`.

Conservar los enlaces (`/admin/documentos`, `/admin/enviar-correo`), el hover scale y el círculo decorativo.

---

## 3. `src/components/admin/ServerControlButton.jsx` — botón EC2 compacto

Reestilizar la tarjeta del estado del servidor para que coincida con el mockup, **sin tocar la lógica** (fetch, polling, `handleAction`, estados `status`/`loading`/`error` se mantienen idénticos). Solo cambia el JSX/estilos del bloque visible:

- Tarjeta blanca compacta, `rounded-xl`, sombra suave. Quitar el borde grueso azul a la izquierda (`border-l-4 border-blue-500`) o suavizarlo.
- Icono de servidor (`ServerIcon`) en círculo azul claro a la izquierda.
- Texto **`Control del servidor EC2`** en dos líneas / navy, y estado en **MAYÚSCULAS**: `● APAGADO` (punto rojo + texto rojo en mayúscula). Aplica el mismo patrón a `ENCENDIDO`, etc. usando `getStatusDisplay` (pon el label en `uppercase` vía clase, no cambies la lógica).
- **Botón de acción tipo píldora**: `rounded-full`, verde (`bg-green-500 hover:bg-green-600`), texto corto **`ENCENDER`** (en lugar de "Encender Servidor") con `PlayIcon`. Para el estado encendido, botón rojo píldora con texto **`APAGAR`**.
- **Icono de refrescar** (`ArrowPathIcon`) a la derecha del botón, como botón circular sutil.
- Mantener el spinner durante `actionLoading`, el bloque de `error` y el texto "Actualizando automáticamente..." para estados `pending`/`stopping`.

---

## Restricciones

- No cambies rutas, lógica de Supabase, ni nombres de props/componentes exportados.
- No agregues librerías; usa solo iconos ya disponibles en `@heroicons/react`.
- Mantén el diseño responsive (los `grid` deben colapsar a 1 columna en móvil).
- Al terminar, ejecuta el build/dev (`npm run dev`) para verificar que no hay errores y que el layout coincide con el mockup.
