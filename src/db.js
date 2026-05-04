import Dexie from 'dexie'

const db = new Dexie('ListaCompraDB')

db.version(1).stores({
  lists: '++id, status, createdAt, closedAt',
  items: '++id, listId, name, category, completed, missing'
})

// Categories
export const CATEGORIES = [
  { id: 'general', name: 'General', emoji: '📦' },
  { id: 'frutas', name: 'Frutas y Verduras', emoji: '🍎' },
  { id: 'carnes', name: 'Carnes', emoji: '🥩' },
  { id: 'lacteos', name: 'Lácteos', emoji: '🧀' },
  { id: 'limpieza', name: 'Limpieza', emoji: '🧹' },
  { id: 'otros', name: 'Otros', emoji: '📝' }
]

// List operations
export async function createList() {
  const existingActive = await db.lists.where('status').equals('active').first()
  if (existingActive) return existingActive

  const id = await db.lists.add({
    status: 'active',
    createdAt: new Date().toISOString(),
    closedAt: null
  })
  return await db.lists.get(id)
}

export async function getActiveList() {
  return await db.lists.where('status').equals('active').first()
}

export async function closeList(listId, missingIds = []) {
  await db.lists.update(listId, {
    status: 'closed',
    closedAt: new Date().toISOString()
  })

  // Mark specified items as missing (user selection from modal)
  for (const itemId of missingIds) {
    await db.items.update(itemId, { missing: true })
  }
}

export async function reopenList(listId) {
  await db.lists.update(listId, {
    status: 'active',
    closedAt: null
  })

  // Clear missing flag
  const items = await db.items.where('listId').equals(listId).toArray()
  for (const item of items) {
    await db.items.update(item.id, { missing: false, completed: false })
  }
}

// Item operations
export async function addItem(listId, name, category = 'general') {
  return await db.items.add({
    listId,
    name,
    category,
    completed: false,
    missing: false
  })
}

export async function toggleItem(itemId) {
  const item = await db.items.get(itemId)
  await db.items.update(itemId, { completed: !item.completed })
}

export async function deleteItem(itemId) {
  await db.items.delete(itemId)
}

export async function getItemsByList(listId) {
  return await db.items.where('listId').equals(listId).toArray()
}

// Get all closed lists (history)
export async function getClosedLists(limit = 10) {
  return await db.lists
    .where('status')
    .equals('closed')
    .reverse()
    .limit(limit)
    .toArray()
}

// Get statistics: count how many times each item was bought
export async function getItemStats() {
  const closedLists = await db.lists.where('status').equals('closed').toArray()
  const allItems = await db.items.toArray()

  // Group items by name (normalized)
  const itemCounts = {}
  const categoryCounts = {}

  for (const item of allItems) {
    const list = closedLists.find(l => l.id === item.listId)
    if (!list) continue

    const name = item.name.toLowerCase().trim()

    if (!itemCounts[name]) {
      itemCounts[name] = {
        name: item.name,
        category: item.category,
        total: 0,
        completed: 0,
        missing: 0
      }
    }

    itemCounts[name].total++

    if (item.completed) {
      itemCounts[name].completed++
    }
    if (item.missing) {
      itemCounts[name].missing++
    }

    // Category stats
    if (!categoryCounts[item.category]) {
      categoryCounts[item.category] = { total: 0 }
    }
    categoryCounts[item.category].total++
  }

  // Convert to array and sort by total
  const sortedItems = Object.values(itemCounts)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return {
    items: sortedItems,
    categories: categoryCounts,
    totalPurchases: closedLists.length
  }
}

// Get history with items details
export async function getHistoryWithItems(limit = 10) {
  const lists = await getClosedLists(limit)

  const history = []
  for (const list of lists) {
    const items = await getItemsByList(list.id)
    const completed = items.filter(i => i.completed && !i.missing).length
    const missing = items.filter(i => i.missing).length

    history.push({
      ...list,
      itemCount: items.length,
      completed,
      missing
    })
  }

  return history
}

export default db