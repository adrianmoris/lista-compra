# SPEC - Lista de Compras PWA

## 1. Overview

- **Nombre**: ListaCompra
- **Tipo**: PWA offline-first
- **Core**: Lista de compras con activación por voz "Ok lista", categorías, y cierre manual
- **Target**: Usuarios móviles que olvidan hacer la lista

## 2. UX/UI

### Layout
- **Mobile-first**: 100% width, no desktop
- **Header**: Título + botón cerrar lista (si hay lista activa)
- **Main**: Lista de items agrupados por categoría
- **Footer**: Botón micrófono flotante

### Colores
- **Primary**: `#2563EB` (azul)
- **Background**: `#F8FAFC` (gris muy claro)
- **Surface**: `#FFFFFF` (blanco)
- **Text**: `#1E293B` (gris oscuro)
- **Success**: `#10B981` (verde - item comprado)
- **Danger**: `#EF4444` (rojo - item faltante)

### Components
- **Item**: checkbox + nombre + categoría (badge) + botón eliminar
- **Categoría header**: collapsible, muestra total de items
- **Floating mic**: círculo fijo abajo derecha
- **Modal cerrar**: confirmar faltantes al cerrar

## 3. Funcionalidad

### Activación por voz
- Keyword: "Ok lista" activa la app (usando Web Speech API o fallback)
- Después del keyword, escuchar item y opcionalmente categoría
- Ejemplo: "Ok lista agregar leche" → item "leche" a categoría "general"
- Ejemplo: "Ok lista agregar manzanas frutas" → item "manzanas" a "frutas"

### Gestión de items
- **Agregar**: por voz o manual (botón + input)
- **Marcar**: tap en checkbox = comprado
- **Faltante**: al cerrar, items no marcados se marcan como faltantes
- **Eliminar**: swipe o botón X

### Categorías predefinidas
- General
- Frutas y Verduras
- Carnes
- Lacteos
- Limpieza
- Otros

### Estados de lista
- **Sin lista**: solo opción crear nueva
- **Lista activa**: muestra items, puede agregar
- **Lista cerrada**: vista solo lectura + opción re-abrir o nueva

### Persistencia
- IndexedDB para estructura
- Guardar automáticamente en cada cambio
- Una sola lista activa a la vez

## 4. Technical

- **PWA**: manifest.json + service worker para offline
- **Storage**: IndexedDB (Dexie.js o raw)
- **Voz**: Web Speech API (SpeechRecognition)
- **Build**: Vite o similar

## 5. Acceptance Criteria

- [ ] Keyword "Ok lista" detecta voz y permite agregar
- [ ] Items seagrupan por categoría visible
- [ ] Checkbox marca como comprado
- [ ] Botón cerrar pregunta cuáles faltaron
- [ ] Persiste offline y carga al abrir sin conexión
- [ ] Instalable como PWA