import type {
  SavedTabItem,
  SavedTabList,
  SavedTabsData
} from '../types'
import { SAVED_TABS_SCHEMA_VERSION } from '../constants'

export const EMPTY_SAVED_TABS: SavedTabsData = {
  version: SAVED_TABS_SCHEMA_VERSION,
  lists: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeUrl(url: string): string {
  return url.trim()
}

export function dedupeSavedItems(items: SavedTabItem[]): SavedTabItem[] {
  const seen = new Set<string>()

  return items.filter(item => {
    const url = normalizeUrl(item.url)
    if (!url || seen.has(url)) return false
    seen.add(url)
    return true
  }).map(item => ({ ...item, url: normalizeUrl(item.url) }))
}

export function normalizeSavedTabsData(
  value: unknown,
  now = Date.now()
): SavedTabsData {
  if (!isRecord(value) || !Array.isArray(value.lists)) {
    return { ...EMPTY_SAVED_TABS, lists: [] }
  }

  const seenListIds = new Set<string>()
  const lists: SavedTabList[] = []

  for (const [listIndex, rawList] of value.lists.entries()) {
    if (!isRecord(rawList) || !Array.isArray(rawList.items)) continue

    let id = typeof rawList.id === 'string' ? rawList.id.trim() : ''
    if (!id || seenListIds.has(id)) {
      let suffix = listIndex
      do {
        id = `migrated-${now}-${suffix++}`
      } while (seenListIds.has(id))
    }
    seenListIds.add(id)

    const rawItems: SavedTabItem[] = []
    for (const rawItem of rawList.items) {
      if (!isRecord(rawItem) || typeof rawItem.url !== 'string') continue
      const url = normalizeUrl(rawItem.url)
      if (!url) continue

      rawItems.push({
        title: typeof rawItem.title === 'string' ? rawItem.title : url,
        url,
        favIconUrl: typeof rawItem.favIconUrl === 'string' ? rawItem.favIconUrl : undefined,
        pinned: rawItem.pinned === true,
        createdAt: toTimestamp(rawItem.createdAt, now)
      })
    }

    const items = dedupeSavedItems(rawItems)
    if (items.length === 0) continue

    const createdAt = toTimestamp(rawList.createdAt, now)
    lists.push({
      id,
      name: typeof rawList.name === 'string' && rawList.name.trim()
        ? rawList.name.trim().slice(0, 120)
        : `Saved tabs (${items.length})`,
      createdAt,
      updatedAt: toTimestamp(rawList.updatedAt, createdAt),
      items
    })
  }

  return {
    version: SAVED_TABS_SCHEMA_VERSION,
    lists: lists.sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

export function createSavedTabList(
  items: SavedTabItem[],
  name: string,
  now = Date.now(),
  id: string = globalThis.crypto?.randomUUID?.() ?? `saved-${now}-${Math.random().toString(36).slice(2)}`
): SavedTabList | null {
  const uniqueItems = dedupeSavedItems(items)
  if (uniqueItems.length === 0) return null

  return {
    id,
    name: name.trim().slice(0, 120) || `Saved tabs (${uniqueItems.length})`,
    createdAt: now,
    updatedAt: now,
    items: uniqueItems
  }
}

export function addSavedTabList(
  data: SavedTabsData,
  list: SavedTabList
): SavedTabsData {
  return {
    version: SAVED_TABS_SCHEMA_VERSION,
    lists: [list, ...data.lists.filter(existing => existing.id !== list.id)]
  }
}

export function renameSavedTabList(
  data: SavedTabsData,
  id: string,
  name: string,
  now = Date.now()
): SavedTabsData {
  const normalizedName = name.trim().slice(0, 120)
  if (!normalizedName) throw new Error('Saved list name cannot be empty')

  let found = false
  const lists = data.lists.map(list => {
    if (list.id !== id) return list
    found = true
    return { ...list, name: normalizedName, updatedAt: now }
  })

  if (!found) throw new Error('Saved list not found')
  return { ...data, lists: lists.sort((a, b) => b.updatedAt - a.updatedAt) }
}

export function removeSavedTabList(
  data: SavedTabsData,
  id: string
): SavedTabsData {
  const lists = data.lists.filter(list => list.id !== id)
  if (lists.length === data.lists.length) throw new Error('Saved list not found')
  return { ...data, lists }
}
