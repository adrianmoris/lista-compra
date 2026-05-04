# DESIGN - ListaCompra PWA

## Stack

- **Framework**: Vanilla JS (mantiene simple, sin overhead)
- **Build**: Vite (dev server rápido, PWA plugin)
- **Storage**: IndexedDB (Dexie.js wrapper)
- **Voice**: Web Speech API (SpeechRecognition)
- **PWA**: vite-plugin-pwa

## Estructura

```
/src
  /components
    Header.js        - título + botón cerrar
    ItemList.js      - lista de items por categoría
    Category.js     - grupo collapsible de items
    Item.js          - checkbox + nombre + badge + delete
    MicButton.js     - botón flotante micrófono
    AddItemModal.js  - input manual para agregar
    CloseListModal.js- confirmación de faltantes
  /services
    db.js            - IndexedDB con Dexie
    voice.js         - SpeechRecognition wrapper
  /styles
    main.css         - CSS custom properties
  app.js             - inicialización
  main.js            - entry point
/public
  manifest.json
  icons/
index.html
vite.config.js
```

## Decisiones Técnicas

### IndexedDB Schema (Dexie)

```js
db.version(1).stores({
  lists: '++id, status, createdAt, closedAt',
  items: '++id, listId, name, category, completed, missing'
});
```

### Voice Flow

1. Always listening cuando la app está abierta (con consentimiento)
2. Detecta "ok lista" → entra en modo comando
3. Parseo: "agregar [item] [categoría]" o "marcar [item]"
4. Feedback visual: toast "Agregado: leche"

### UI State

```js
state = {
  currentList: null,    // lista activa
  isListening: false,
  isCommandMode: false,
  showAddModal: false,
  showCloseModal: false
}
```

## Componentes UI

- **Header**: sticky, fondo blanco, shadow
- **Category**: collapse/expand con count
- **Item**: swipe-left revela delete, tap toggles completo
- **Mic**: pulse animation cuando escuchando

## PWA

- manifest.json con `display: "standalone"`
- Service worker con cache-first para assets
- Iconos: 192x192, 512x512

## Colors CSS Variables

```css
:root {
  --primary: #2563EB;
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --text: #1E293B;
  --text-light: #64748B;
  --success: #10B981;
  --danger: #EF4444;
  --border: #E2E8F0;
}
```

## Siguiente

1. Inicializar proyecto Vite
2. Instalar Dexie + vite-plugin-pwa
3. Implementar db.js y voice.js
4. Componentes UI
5. PWA config