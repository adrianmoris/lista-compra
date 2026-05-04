import {
  createList,
  getActiveList,
  closeList,
  reopenList,
  addItem,
  toggleItem,
  deleteItem,
  getItemsByList,
  getItemStats,
  getHistoryWithItems,
  CATEGORIES
} from './db.js'
import { initVoice, startListening, parseCommand, isVoiceSupported } from './voice.js'

// State
let state = {
  list: null,
  items: [],
  isListening: false,
  showAddModal: false,
  showCloseModal: false,
  toast: null,
  activeTab: 'list', // 'list' | 'stats' | 'history'
  stats: null,
  history: null
}

// DOM Elements
const app = document.getElementById('app')

// Show toast
function showToast(message) {
  state.toast = message
  render()
  setTimeout(() => {
    state.toast = null
    render()
  }, 2500)
}

// Save to memory
function saveToMemory(listId, name, category) {
  addItem(listId, name, category)
}

// Render
function render() {
  // Render tabs navigation
  const tabsHtml = renderTabs()

  if (!state.list || state.activeTab === 'list') {
    if (!state.list) {
      app.innerHTML = tabsHtml + renderEmptyState()
    } else if (state.list.status === 'closed') {
      app.innerHTML = tabsHtml + renderClosedList()
    } else {
      app.innerHTML = tabsHtml + renderMain()
    }
  } else if (state.activeTab === 'stats') {
    app.innerHTML = tabsHtml + renderStats()
  } else if (state.activeTab === 'history') {
    app.innerHTML = tabsHtml + renderHistory()
  }

  attachEventListeners()
}

function renderTabs() {
  return `
    <div class="nav-tabs">
      <button class="nav-tab ${state.activeTab === 'list' ? 'active' : ''}" data-tab="list">Lista</button>
      <button class="nav-tab ${state.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">Estadísticas</button>
      <button class="nav-tab ${state.activeTab === 'history' ? 'active' : ''}" data-tab="history">Historial</button>
    </div>
  `
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>Tu lista de compras</h2>
      <p>Creá una nueva lista para empezar</p>
      <button id="create-list-btn">Crear Lista</button>
    </div>
  `
}

function renderClosedList() {
  const missingItems = state.items.filter(i => i.missing)
  const completedItems = state.items.filter(i => i.completed && !i.missing)

  return `
    <main>
      <div class="closed-list">
        <h2>Lista cerrada</h2>
        ${missingItems.length > 0 ? `
          <div style="text-align:left;margin:20px 0">
            <h4 style="color:var(--danger)">Faltantes:</h4>
            <ul style="color:var(--danger);margin:10px 0;padding-left:20px">
              ${missingItems.map(i => `<li>${i.name}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <button id="new-list-btn">Nueva Lista</button>
      </div>
    </main>
  `
}

function renderMain() {
  // Group items by category
  const itemsByCategory = {}
  CATEGORIES.forEach(c => itemsByCategory[c.id] = [])

  state.items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = []
    }
    itemsByCategory[item.category].push(item)
  })

  const categoriesHtml = CATEGORIES.map(cat => {
    const items = itemsByCategory[cat.id]
    if (items.length === 0) return ''

    return `
      <div class="category" data-category="${cat.id}">
        <div class="category-header">
          <h3>${cat.emoji} ${cat.name} <span class="count">${items.length}</span></h3>
          <span class="chevron">▼</span>
        </div>
        <div class="category-items">
          ${items.map(item => renderItem(item)).join('')}
        </div>
      </div>
    `
  }).join('')

  return `
    <header class="header">
      <h1>🛒 Mi Lista</h1>
      <div class="header-actions">
        <button class="add-btn" id="add-item-btn">+</button>
        <button class="close-btn" id="close-list-btn">Cerrar</button>
      </div>
    </header>
    <main>
      ${categoriesHtml}
    </main>
    <button class="mic-fab ${state.isListening ? 'listening' : ''}" id="mic-btn">
      ${state.isListening ? '🔴' : '🎤'}
    </button>
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
    ${state.showAddModal ? renderAddModal() : ''}
    ${state.showCloseModal ? renderCloseModal() : ''}
  `
}

async function renderStats() {
  if (!state.stats) {
    state.stats = await getItemStats()
  }

  const { items, totalPurchases } = state.stats

  if (!items || items.length === 0) {
    return `
      <header class="header">
        <h1>📊 Estadísticas</h1>
      </header>
      <main>
        <div class="empty-state">
          <span class="empty-state-icon">📊</span>
          <h2>Sin datos aún</h2>
          <p>Cerrá algunas listas para ver estadísticas</p>
        </div>
      </main>
    `
  }

  const maxCount = Math.max(...items.map(i => i.total))

  const itemsHtml = items.map(item => {
    const category = CATEGORIES.find(c => c.id === item.category)
    const percentage = Math.round((item.total / maxCount) * 100)

    return `
      <div class="chart-bar">
        <span class="chart-label">${item.name}</span>
        <div class="chart-bar-wrapper">
          <div class="chart-bar-fill" style="width: ${percentage}%">
            <span class="chart-bar-value">${item.total}</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <header class="header">
      <h1>📊 Estadísticas</h1>
    </header>
    <main>
      <div class="stats-section">
        <div class="stat-card">
          <h4>Total de compras</h4>
          <div class="value">${totalPurchases}</div>
        </div>
        <div class="stat-card">
          <h4>Items más comprados</h4>
        </div>
        <div class="chart-container">
          ${itemsHtml}
        </div>
      </div>
    </main>
  `
}

async function renderHistory() {
  if (!state.history) {
    state.history = await getHistoryWithItems(10)
  }

  if (!state.history || state.history.length === 0) {
    return `
      <header class="header">
        <h1>📜 Historial</h1>
      </header>
      <main>
        <div class="empty-state">
          <span class="empty-state-icon">📜</span>
          <h2>Sin historial</h2>
          <p>Cerrá tu primera lista para ver el historial</p>
        </div>
      </main>
    `
  }

  const historyHtml = state.history.map(list => {
    const date = new Date(list.closedAt).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
      <div class="history-item">
        <div class="history-item-header">
          <span class="history-item-date">${date}</span>
          <span class="history-item-count">${list.itemCount} items</span>
        </div>
        <div class="history-item-stats">
          <span class="history-stat completed">✅ ${list.completed} comprados</span>
          <span class="history-stat missing">❌ ${list.missing} faltantes</span>
        </div>
      </div>
    `
  }).join('')

  return `
    <header class="header">
      <h1>📜 Historial</h1>
    </header>
    <main>
      <div class="history-list">
        ${historyHtml}
      </div>
    </main>
  `
}

function renderItem(item) {
  const category = CATEGORIES.find(c => c.id === item.category)
  const classes = ['item']
  if (item.completed) classes.push('completed')
  if (item.missing) classes.push('missing')

  return `
    <div class="${classes.join(' ')}" data-id="${item.id}">
      <input type="checkbox" ${item.completed ? 'checked' : ''} />
      <span class="item-name">${item.name}</span>
      ${category ? `<span class="item-category">${category.emoji}</span>` : ''}
      <button class="item-delete" data-delete="${item.id}">×</button>
    </div>
  `
}

function renderAddModal() {
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <h3>Agregar item</h3>
        <input type="text" id="add-item-input" placeholder="Qué necesitas?" />
        <select id="add-category-select">
          ${CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}
        </select>
        <div class="modal-buttons">
          <button class="secondary" id="cancel-add">Cancelar</button>
          <button class="primary" id="confirm-add">Agregar</button>
        </div>
      </div>
    </div>
  `
}

function renderCloseModal() {
  const uncompleted = state.items.filter(i => !i.completed)
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <h3>Cerrar lista</h3>
        <p>¿Faltó algo de lo que no marcaste?</p>
        <div style="max-height:150px;overflow-y:auto;margin-bottom:16px">
          ${uncompleted.length > 0 ? uncompleted.map(i => `
            <label style="display:block;padding:8px 0">
              <input type="checkbox" checked data-missing="${i.id}" /> ${i.name}
            </label>
          `).join('') : 'Todos los items están marcados'}
        </div>
        <div class="modal-buttons">
          <button class="secondary" id="cancel-close">Cancelar</button>
          <button class="primary" id="confirm-close">Cerrar Lista</button>
        </div>
      </div>
    </div>
  `
}

function attachEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const tabName = tab.dataset.tab
      state.activeTab = tabName

      if (tabName === 'stats') {
        state.stats = await getItemStats()
      } else if (tabName === 'history') {
        state.history = await getHistoryWithItems(10)
      } else if (tabName === 'list') {
        state.list = await getActiveList()
        state.items = state.list ? await getItemsByList(state.list.id) : []
      }

      render()
    })
  })

  // Create list
  const createBtn = document.getElementById('create-list-btn')
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      state.list = await createList()
      state.items = await getItemsByList(state.list.id)
      state.activeTab = 'list'
      initVoice(handleVoiceResult, handleVoiceError, handleVoiceEnd)
      render()
    })
  }

  // Add item button (+)
  const addItemBtn = document.getElementById('add-item-btn')
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      state.showAddModal = true
      render()
    })
  }

  // Close list button
  const closeListBtn = document.getElementById('close-list-btn')
  if (closeListBtn) {
    closeListBtn.addEventListener('click', () => {
      state.showCloseModal = true
      render()
    })
  }

  // New list from closed view
  const newListBtn = document.getElementById('new-list-btn')
  if (newListBtn) {
    newListBtn.addEventListener('click', async () => {
      state.list = await createList()
      state.items = await getItemsByList(state.list.id)
      state.activeTab = 'list'
      initVoice(handleVoiceResult, handleVoiceError, handleVoiceEnd)
      render()
    })
  }

  // Mic button
  const micBtn = document.getElementById('mic-btn')
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (state.isListening) {
        // Stop listening handled by speech API
      } else {
        startListening()
        state.isListening = true
        render()
      }
    })
  }

  // Item checkboxes
  document.querySelectorAll('.item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const itemEl = e.target.closest('.item')
      const itemId = parseInt(itemEl.dataset.id)
      await toggleItem(itemId)
      state.items = await getItemsByList(state.list.id)
      render()
    })
  })

  // Item delete
  document.querySelectorAll('.item-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const itemId = parseInt(btn.dataset.delete)
      await deleteItem(itemId)
      state.items = await getItemsByList(state.list.id)
      render()
    })
  })

  // Category collapse
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed')
    })
  })

  // Add modal
  const modalOverlay = document.getElementById('modal-overlay')
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        state.showAddModal = false
        render()
      }
    })
  }

  const cancelAdd = document.getElementById('cancel-add')
  if (cancelAdd) {
    cancelAdd.addEventListener('click', () => {
      state.showAddModal = false
      render()
    })
  }

  const confirmAdd = document.getElementById('confirm-add')
  if (confirmAdd) {
    confirmAdd.addEventListener('click', async () => {
      const input = document.getElementById('add-item-input')
      const select = document.getElementById('add-category-select')
      if (input.value.trim()) {
        await addItem(state.list.id, input.value.trim(), select.value)
        state.items = await getItemsByList(state.list.id)
        state.showAddModal = false
        showToast(`Agregado: ${input.value}`)
        render()
      }
    })
  }

  // Close modal
  const cancelClose = document.getElementById('cancel-close')
  if (cancelClose) {
    cancelClose.addEventListener('click', () => {
      state.showCloseModal = false
      render()
    })
  }

  const confirmClose = document.getElementById('confirm-close')
  if (confirmClose) {
    confirmClose.addEventListener('click', async () => {
      // Get missing items from checkboxes
      const missingCheckboxes = document.querySelectorAll('[data-missing]:checked')
      const missingIds = Array.from(missingCheckboxes).map(cb => parseInt(cb.dataset.missing))

      await closeList(state.list.id, missingIds)
      state.list = await getActiveList()
      state.items = state.list ? await getItemsByList(state.list.id) : []
      state.showCloseModal = false
      render()
    })
  }
}

// Voice handlers
async function handleVoiceResult(transcript) {
  console.log('Voice input:', transcript)
  const cmd = parseCommand(transcript)

  if (!cmd || !cmd.item) {
    showToast('No entendí. Decí "ok lista agregar [item]"')
    return
  }

  // PRD: si no existe lista, crear una nueva y agregar el item
  if (!state.list || state.list.status === 'closed') {
    state.list = await createList()
    state.items = []
    initVoice(handleVoiceResult, handleVoiceError, handleVoiceEnd)
    setTimeout(() => {
      startListening()
      state.isListening = true
    }, 500)
  }

  if (cmd.action === 'add') {
    const category = cmd.category || 'general'
    await saveToMemory(state.list.id, cmd.item, category)
    showToast(`Agregado: ${cmd.item}`)
  } else if (cmd.action === 'mark') {
    const item = state.items.find(i => i.name.toLowerCase().includes(cmd.item.toLowerCase()))
    if (item) {
      await toggleItem(item.id)
      showToast(`Marcado: ${item.name}`)
    } else {
      showToast(`No encontré: ${cmd.item}`)
    }
  }

  state.items = await getItemsByList(state.list.id)
  render()
}

function handleVoiceError(error) {
  console.error('Voice error:', error)
  state.isListening = false
  render()
}

function handleVoiceEnd() {
  state.isListening = false
  render()
  // Auto-restart listening
  setTimeout(() => {
    if (state.list && state.list.status === 'active') {
      startListening()
      state.isListening = true
    }
  }, 500)
}

// Init
export async function init() {
  state.list = await getActiveList()

  if (state.list) {
    state.items = await getItemsByList(state.list.id)
    if (state.list.status === 'active') {
      initVoice(handleVoiceResult, handleVoiceError, handleVoiceEnd)
      // Start listening on init
      setTimeout(() => {
        startListening()
        state.isListening = true
        render()
      }, 500)
    }
  }

  render()
}