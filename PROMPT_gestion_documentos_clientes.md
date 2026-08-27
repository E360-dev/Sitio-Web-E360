# Prompt para Claude Code — Capa de selección de clientes en Gestión de Documentos

Copia todo lo que está debajo de la línea y pégalo en Claude Code dentro del repo `web-e360-limpio`.

---

## Contexto

Editar **solo** `src/components/admin/GestionDocumentos.jsx`. Stack: React + Vite + Tailwind + heroicons. **No añadas dependencias ni cambies la lógica de datos.**

La lógica de filtrado por cliente ya existe (`filtroCliente`, `documentosPorCliente`, `documentosPorAño`, la vista de acordeón por años). La idea es **reutilizarla**, no reescribirla: agregar una capa visual de tarjetas de cliente como punto de entrada moderno. Nada de lo que ya funciona debe desaparecer.

## Comportamiento objetivo

1. **Vista por defecto (sin cliente seleccionado, `filtroCliente === ''`):**
   - En lugar de mostrar la tabla con TODOS los documentos, mostrar una **cuadrícula de tarjetas**, una por cada cliente de `clientes`.
   - Al hacer click en una tarjeta → `setFiltroCliente(String(cliente.id))` (y resetear `setFiltroAño('')`, `setExpandedYears({})`). Esto dispara la vista de lista por años que YA existe para ese cliente.
   - El `<select>` "Filtrar por cliente" se mantiene como alternativa y debe seguir sincronizado (seleccionar en el dropdown o en una tarjeta deben producir el mismo resultado).

2. **Vista con cliente seleccionado (`filtroCliente` con valor):**
   - Mantener exactamente la vista actual (acordeón de documentos por año con la tabla, estados, menú ⋮, etc.). **No tocar esa parte.**
   - Añadir arriba un botón **"← Volver a clientes"** que haga `setFiltroCliente('')` (y resetee año/expanded) para regresar a la cuadrícula de tarjetas.

## Diseño de las tarjetas de cliente

- Cuadrícula responsive: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Cada tarjeta:
  - **Recuadro azul SÓLIDO, sin imagen de fondo.** Usar un fondo azul de la paleta del proyecto (ej. degradado `bg-gradient-to-br from-[#1a2f4e] to-[#2e527f]`, o `bg-[#1a2f4e]`).
  - `rounded-2xl`, `shadow-md`, padding generoso, altura cómoda (ej. `aspect-[16/9]` o `min-h-[150px]`), contenido centrado.
  - Texto: nombre del cliente en blanco, font-black/bold, centrado: `cliente.nombre` y debajo, más pequeño y con opacidad, `cliente.empresa` si existe (`(empresa)`).
  - Cursor pointer y hover: `hover:scale-[1.03] hover:shadow-xl transition-all duration-300`, opcional un borde/acento cian `#25c6e3` al hover.
  - `key={cliente.id}`, `onClick` como se indicó arriba.
- Encabezado de esta sección: un título "Clientes" (estilo coherente con la página) sobre la cuadrícula.
- Si `isLoading`, mostrar un estado de carga; si `clientes` está vacío, un mensaje "No hay clientes registrados.".

## Botón "+ Crear Nuevo Documento"

Cambiar su color de `bg-blue-500 hover:bg-blue-700` a **`bg-[#E80554] hover:bg-[#c50447]`** (mantener texto blanco, padding, rounded y la acción `onClick={() => setIsModalOpen(true)}`). Mantener el texto "+ Crear Nuevo Documento" (o "+ Nuevo documento" si se prefiere acortar, a tu criterio).

## Restricciones

- No cambies la lógica de `cargarDatos`, Supabase, `documentosPorAño`, `handleEliminar`, `handleRowClick`, ni el modal de creación.
- No elimines la tabla/acordeón existente: solo se muestra cuando hay `filtroCliente`.
- Mantén responsive (1 columna en móvil).
- Al terminar, corre `npm run dev` y verifica: (a) por defecto se ven las tarjetas, (b) click en tarjeta filtra y muestra la lista por años de ese cliente, (c) el botón "Volver a clientes" regresa a la cuadrícula, (d) el botón de crear es `#E80554`.
