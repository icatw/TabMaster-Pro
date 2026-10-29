import type {
  SavedTabItem,
  SavedTabGroupSnapshot,
  SavedTabList,
  SavedTabsData,
  SavedWindowSnapshot,
  SavedWorkspace
} from '../types'
import { SAVED_TABS_SCHEMA_VERSION, SAVED_TABS_LEGACY_SCHEMA_VERSION } from '../constants'

export const DEFAULT_WORKSPACE_ID = 'workspace-inbox'

export const EMPTY_SAVED_TABS: SavedTabsData = {
  version: SAVED_TABS_SCHEMA_VERSION,
  lists: [],
  workspaces: [{
    id: DEFAULT_WORKSPACE_ID,
    name: 'Inbox',
    createdAt: 0,
    updatedAt: 0
  }]
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

export function normalizeSavedTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap(rawTag => {
    if (typeof rawTag !== 'string') return []
    const tag = rawTag.trim().slice(0, 32)
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) return []
    seen.add(key)
    return [tag]
  }).slice(0, 12)
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

function normalizeWindows(value: unknown): SavedWindowSnapshot[] {
  if (!Array.isArray(value)) return []
  const colors = new Set<chrome.tabGroups.ColorEnum>([
    'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'
  ])

  return value.flatMap((rawWindow, index) => {
    if (!isRecord(rawWindow)) return []
    const groups: SavedTabGroupSnapshot[] = Array.isArray(rawWindow.groups)
      ? rawWindow.groups.flatMap(rawGroup => {
        if (!isRecord(rawGroup) || typeof rawGroup.id !== 'number') return []
        return [{
          id: rawGroup.id,
          title: typeof rawGroup.title === 'string' ? rawGroup.title : '',
          color: colors.has(rawGroup.color as chrome.tabGroups.ColorEnum)
            ? rawGroup.color as chrome.tabGroups.ColorEnum
            : 'grey',
          collapsed: rawGroup.collapsed === true
        }]
      })
      : []

    return [{
      index: Number.isInteger(rawWindow.index) && (rawWindow.index as number) >= 0
        ? rawWindow.index as number
        : index,
      focused: rawWindow.focused === true,
      groups
    }]
  })
}

export interface FilteredSavedTabList {
  list: SavedTabList
  items: Array<{ item: SavedTabItem, index: number }>
}

export function filterSavedTabLists(
  lists: SavedTabList[],
  query: string
): FilteredSavedTabList[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return lists.flatMap(list => {
    if (!normalizedQuery) {
      return [{ list, items: list.items.map((item, index) => ({ item, index })) }]
    }

    const listMatches = list.name.toLocaleLowerCase().includes(normalizedQuery)
    const items = list.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => listMatches ||
        item.title.toLocaleLowerCase().includes(normalizedQuery) ||
        item.url.toLocaleLowerCase().includes(normalizedQuery) ||
        list.note?.toLocaleLowerCase().includes(normalizedQuery) ||
        list.tags?.some(tag => tag.toLocaleLowerCase().includes(normalizedQuery)) === true)

    return items.length > 0 ? [{ list, items }] : []
  })
}

export function normalizeSavedTabsData(
  value: unknown,
  now = Date.now()
): SavedTabsData {
  if (!isRecord(value) || !Array.isArray(value.lists)) {
    return { ...EMPTY_SAVED_TABS, lists: [], workspaces: [...EMPTY_SAVED_TABS.workspaces] }
  }

  const seenWorkspaceIds = new Set<string>()
  const workspaces: SavedWorkspace[] = []
  if (Array.isArray(value.workspaces)) {
    for (const [workspaceIndex, rawWorkspace] of value.workspaces.entries()) {
      if (!isRecord(rawWorkspace)) continue
      const id = typeof rawWorkspace.id === 'string' ? rawWorkspace.id.trim() : ''
      const name = typeof rawWorkspace.name === 'string' ? rawWorkspace.name.trim().slice(0, 80) : ''
      if (!id || !name || seenWorkspaceIds.has(id)) continue
      seenWorkspaceIds.add(id)
      const createdAt = toTimestamp(rawWorkspace.createdAt, now + workspaceIndex)
      workspaces.push({
        id,
        name,
        createdAt,
        updatedAt: toTimestamp(rawWorkspace.updatedAt, createdAt)
      })
    }
  }
  if (!seenWorkspaceIds.has(DEFAULT_WORKSPACE_ID)) {
    workspaces.unshift({
      id: DEFAULT_WORKSPACE_ID,
      name: 'Inbox',
      createdAt: 0,
      updatedAt: 0
    })
    seenWorkspaceIds.add(DEFAULT_WORKSPACE_ID)
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

    const kind = rawList.kind === 'session' ? 'session' : 'links'
    const rawItems: SavedTabItem[] = []
    for (const rawItem of rawList.items) {
      if (!isRecord(rawItem) || typeof rawItem.url !== 'string') continue
      const url = normalizeUrl(rawItem.url)
      if (!url) continue

      const session = isRecord(rawItem.session) &&
        Number.isInteger(rawItem.session.windowIndex) &&
        Number.isInteger(rawItem.session.tabIndex)
        ? {
          windowIndex: rawItem.session.windowIndex as number,
          tabIndex: rawItem.session.tabIndex as number,
          active: rawItem.session.active === true,
          ...(Number.isInteger(rawItem.session.groupId)
            ? { groupId: rawItem.session.groupId as number }
            : {})
        }
        : undefined

      rawItems.push({
        title: typeof rawItem.title === 'string' ? rawItem.title : url,
        url,
        favIconUrl: typeof rawItem.favIconUrl === 'string' ? rawItem.favIconUrl : undefined,
        pinned: rawItem.pinned === true,
        ...(rawItem.favorite === true ? { favorite: true } : {}),
        createdAt: toTimestamp(rawItem.createdAt, now),
        ...(kind === 'session' && session ? { session } : {})
      })
    }

    const windows = kind === 'session' ? normalizeWindows(rawList.windows) : []
    const items = kind === 'session' ? rawItems : dedupeSavedItems(rawItems)
    if (items.length === 0) continue

    const createdAt = toTimestamp(rawList.createdAt, now)
    lists.push({
      id,
      name: typeof rawList.name === 'string' && rawList.name.trim()
        ? rawList.name.trim().slice(0, 120)
        : `Saved tabs (${items.length})`,
      createdAt,
      updatedAt: toTimestamp(rawList.updatedAt, createdAt),
      items,
      workspaceId: typeof rawList.workspaceId === 'string' && seenWorkspaceIds.has(rawList.workspaceId)
        ? rawList.workspaceId
        : DEFAULT_WORKSPACE_ID,
      ...(typeof rawList.note === 'string' && rawList.note.trim()
        ? { note: rawList.note.trim().slice(0, 1000) }
        : {}),
      ...(normalizeSavedTags(rawList.tags).length > 0
        ? { tags: normalizeSavedTags(rawList.tags) }
        : {}),
      ...(kind === 'session' && windows.length > 0 ? { kind, windows } : {})
    })
  }

  return {
    version: SAVED_TABS_SCHEMA_VERSION,
    lists: lists.sort((a, b) => b.updatedAt - a.updatedAt),
    workspaces: workspaces.sort((a, b) => a.createdAt - b.createdAt)
  }
}

export function validateSavedTabsImport(value: unknown): SavedTabsData {
  if (!isRecord(value) ||
    (value.version !== SAVED_TABS_SCHEMA_VERSION &&
      value.version !== SAVED_TABS_LEGACY_SCHEMA_VERSION && value.version !== 2) ||
    !Array.isArray(value.lists)) {
    throw new Error('Unsupported or invalid saved-tabs backup file')
  }
  if (value.lists.length > 500) throw new Error('Backup contains too many lists')

  for (const rawList of value.lists) {
    if (!isRecord(rawList) || typeof rawList.name !== 'string' || !Array.isArray(rawList.items)) {
      throw new Error('Backup contains an invalid list')
    }
    if (rawList.items.length > 5000) throw new Error('Backup list contains too many tabs')
    for (const rawItem of rawList.items) {
      if (!isRecord(rawItem) || typeof rawItem.url !== 'string' || !isRestorableSavedUrl(rawItem.url)) {
        throw new Error('Backup contains an invalid or unsupported URL')
      }
    }
  }

  const normalized = normalizeSavedTabsData(value)
  if (normalized.lists.length !== value.lists.length) {
    throw new Error('Backup contains empty or malformed lists')
  }
  return normalized
}

function isRestorableSavedUrl(value: string): boolean {
  try {
    return ['http:', 'https:', 'file:', 'ftp:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function createSavedTabList(
  items: SavedTabItem[],
  name: string,
  now = Date.now(),
  id: string = globalThis.crypto?.randomUUID?.() ?? `saved-${now}-${Math.random().toString(36).slice(2)}`,
  options: {
    kind?: 'links' | 'session'
    windows?: SavedWindowSnapshot[]
    preserveDuplicates?: boolean
    workspaceId?: string
    note?: string
    tags?: string[]
  } = {}
): SavedTabList | null {
  const normalizedItems = options.preserveDuplicates
    ? items.map(item => ({ ...item, url: normalizeUrl(item.url) })).filter(item => item.url)
    : dedupeSavedItems(items)
  if (normalizedItems.length === 0) return null

  return {
    id,
    name: name.trim().slice(0, 120) || `Saved tabs (${normalizedItems.length})`,
    createdAt: now,
    updatedAt: now,
    items: normalizedItems,
    workspaceId: options.workspaceId ?? DEFAULT_WORKSPACE_ID,
    ...(options.note?.trim() ? { note: options.note.trim().slice(0, 1000) } : {}),
    ...(normalizeSavedTags(options.tags).length > 0 ? { tags: normalizeSavedTags(options.tags) } : {}),
    ...(options.kind === 'session' ? { kind: 'session' as const, windows: options.windows ?? [] } : {})
  }
}

export function addSavedTabList(
  data: SavedTabsData,
  list: SavedTabList
): SavedTabsData {
  return {
    version: SAVED_TABS_SCHEMA_VERSION,
    lists: [list, ...data.lists.filter(existing => existing.id !== list.id)],
    workspaces: data.workspaces
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
