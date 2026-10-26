import type {
  BatchOperationResult,
  SavedTabItem,
  SavedTabList,
  SavedTabsData,
  SavedTabReference,
  SavedTabRestoreOptions,
  SavedTabGroupSnapshot,
  SavedWindowSnapshot
} from '../types'
import { SAVED_TABS_SCHEMA_VERSION, STORAGE_KEYS } from '../constants'
import {
  addSavedTabList,
  createSavedTabList,
  normalizeSavedTabsData,
  removeSavedTabList,
  renameSavedTabList,
  validateSavedTabsImport
} from '../utils/savedTabs'
import { getExpiredSavedLists } from '../utils/savedListStats'

interface SavedTabsStore {
  get: (key: string) => Promise<Record<string, unknown>>
  set: (items: Record<string, unknown>) => Promise<void>
}

const localStore: SavedTabsStore = {
  get: key => chrome.storage.local.get(key),
  set: items => chrome.storage.local.set(items)
}

function toSavedItem(tab: chrome.tabs.Tab, now = Date.now()): SavedTabItem | null {
  if (!tab.url?.trim() || !isRestorableUrl(tab.url)) return null
  return {
    title: tab.title?.trim() || tab.url,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    createdAt: now
  }
}

function isRestorableUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return ['http:', 'https:', 'file:', 'ftp:'].includes(protocol)
  } catch {
    return false
  }
}

function toSavedItems(tabs: chrome.tabs.Tab[], now = Date.now()): SavedTabItem[] {
  return tabs.flatMap(tab => {
    const item = toSavedItem(tab, now)
    return item ? [item] : []
  })
}

let storageMutationQueue = Promise.resolve()

async function withStorageMutation<T>(operation: () => Promise<T>): Promise<T> {
  const previousMutation = storageMutationQueue
  let releaseMutation!: () => void
  storageMutationQueue = new Promise<void>(resolve => {
    releaseMutation = resolve
  })

  await previousMutation
  try {
    return await operation()
  } finally {
    releaseMutation()
  }
}

export class SavedTabsService {
  static async getData(store: SavedTabsStore = localStore): Promise<SavedTabsData> {
    const result = await store.get(STORAGE_KEYS.SAVED_TABS)
    return normalizeSavedTabsData(result[STORAGE_KEYS.SAVED_TABS])
  }

  static async setData(
    data: SavedTabsData,
    store: SavedTabsStore = localStore
  ): Promise<SavedTabsData> {
    const normalized = normalizeSavedTabsData(data)
    await store.set({ [STORAGE_KEYS.SAVED_TABS]: normalized })
    return normalized
  }

  static async getLists(): Promise<SavedTabList[]> {
    return (await this.getData()).lists
  }

  static async importData(
    value: unknown,
    store: SavedTabsStore = localStore
  ): Promise<{ listCount: number, itemCount: number }> {
    return withStorageMutation(async () => {
      const imported = validateSavedTabsImport(value)
      const current = await this.getData(store)
      const existingIds = new Set(current.lists.map(list => list.id))
      const lists = imported.lists.map(list => {
        let id = list.id
        if (existingIds.has(id)) {
          id = globalThis.crypto?.randomUUID?.() ?? `import-${Date.now()}-${Math.random().toString(36).slice(2)}`
        }
        existingIds.add(id)
        return { ...list, id }
      })
      await this.setData({
        version: SAVED_TABS_SCHEMA_VERSION,
        lists: [...lists, ...current.lists]
      }, store)
      return {
        listCount: lists.length,
        itemCount: lists.reduce((total, list) => total + list.items.length, 0)
      }
    })
  }

  static async saveTabs(
    tabs: chrome.tabs.Tab[],
    name: string,
    store: SavedTabsStore = localStore,
    options: { preserveDuplicates?: boolean } = {}
  ): Promise<SavedTabList | null> {
    return withStorageMutation(async () => {
      const list = createSavedTabList(toSavedItems(tabs), name, Date.now(), undefined, {
        preserveDuplicates: options.preserveDuplicates
      })
      if (!list) return null

      const current = await this.getData(store)
      await this.setData(addSavedTabList(current, list), store)
      return list
    })
  }

  static async saveWindow(name?: string): Promise<SavedTabList> {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    const list = await this.saveTabs(
      tabs,
      name?.trim() || `Saved window (${tabs.length} tabs)`,
      localStore,
      { preserveDuplicates: true }
    )
    if (!list) throw new Error('No restorable tabs in this window')
    return list
  }

  static async saveSession(name?: string): Promise<SavedTabList> {
    return withStorageMutation(async () => {
      const browserWindows = await chrome.windows.getAll({
        populate: true,
        windowTypes: ['normal']
      })
      const items: SavedTabItem[] = []
      const windows: SavedWindowSnapshot[] = []
      const now = Date.now()

      for (const browserWindow of browserWindows) {
        if (browserWindow.id === undefined) continue
        const [groups, ...rest] = await Promise.all([
          chrome.tabGroups.query({ windowId: browserWindow.id }),
          Promise.resolve(browserWindow.tabs ?? [])
        ])
        const tabs = rest[0] as chrome.tabs.Tab[]
        const savedGroupIds = new Set<number>()
        const savedItems = tabs.flatMap((tab, fallbackIndex) => {
          const item = toSavedItem(tab, now)
          if (!item) return []
          const groupId = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ? tab.groupId
            : undefined
          if (groupId !== undefined) savedGroupIds.add(groupId)
          return [{
            ...item,
            session: {
              windowIndex: windows.length,
              tabIndex: Number.isInteger(tab.index) ? tab.index : fallbackIndex,
              active: tab.active === true,
              ...(groupId === undefined ? {} : { groupId })
            }
          }]
        })
        if (savedItems.length === 0) continue

        const savedGroups: SavedTabGroupSnapshot[] = groups
          .filter(group => savedGroupIds.has(group.id))
          .map(group => ({
            id: group.id,
            title: group.title ?? '',
            color: group.color,
            collapsed: group.collapsed
          }))

        windows.push({
          index: windows.length,
          focused: browserWindow.focused === true,
          groups: savedGroups
        })
        items.push(...savedItems.map(item => ({
          ...item,
          session: { ...item.session, windowIndex: windows.length - 1 }
        })))
      }

      const list = createSavedTabList(
        items,
        name?.trim() || `Saved session (${windows.length} windows, ${items.length} tabs)`,
        now,
        undefined,
        { kind: 'session', windows, preserveDuplicates: true }
      )
      if (!list) throw new Error('No restorable tabs in the open windows')

      const current = await this.getData()
      await this.setData(addSavedTabList(current, list))
      return list
    })
  }

  static async saveAndCloseTabs(
    tabIds: number[],
    name?: string
  ): Promise<BatchOperationResult> {
    const uniqueIds = [...new Set(tabIds.filter(id => Number.isInteger(id) && id > 0))]
    if (uniqueIds.length === 0) {
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: ['No tabs selected']
      }
    }

    const tabs = await Promise.all(uniqueIds.map(async tabId => {
      try {
        return await chrome.tabs.get(tabId)
      } catch {
        return null
      }
    }))
    const availableTabs = tabs.filter((tab): tab is chrome.tabs.Tab => tab !== null)
    const restorableTabs = availableTabs.filter(tab => toSavedItem(tab) !== null)

    if (restorableTabs.length === 0) {
      return {
        success: false,
        totalOperations: uniqueIds.length,
        successfulOperations: 0,
        failedOperations: uniqueIds.length,
        errors: ['Selected tabs no longer exist or have no saved URL']
      }
    }

    const errors: string[] = []
    for (const [index, tab] of tabs.entries()) {
      if (tab === null) {
        errors.push(`Selected tab ${uniqueIds[index]} no longer exists`)
      } else if (toSavedItem(tab) === null) {
        errors.push(`Selected tab ${uniqueIds[index]} has no saved URL and was left open`)
      }
    }

    const list = await this.saveTabs(
      restorableTabs,
      name?.trim() || `Closed tabs (${restorableTabs.length})`,
      localStore,
      { preserveDuplicates: true }
    )
    if (!list) {
      return {
        success: false,
        totalOperations: uniqueIds.length,
        successfulOperations: 0,
        failedOperations: uniqueIds.length,
        errors: ['Selected tabs could not be saved; nothing was closed']
      }
    }

    let closed = 0
    for (const tab of restorableTabs) {
      try {
        await chrome.tabs.remove(tab.id!)
        closed++
      } catch (error) {
        errors.push(`Failed to close tab ${tab.id}: ${String(error)}`)
      }
    }

    return {
      success: closed === uniqueIds.length,
      totalOperations: uniqueIds.length,
      successfulOperations: closed,
      failedOperations: uniqueIds.length - closed,
      errors: errors.length > 0 ? errors : undefined,
      message: closed > 0 ? `Saved ${list.items.length} tabs before closing ${closed}` : undefined
    }
  }

  private static async restoreItems(
    items: SavedTabItem[],
    options: SavedTabRestoreOptions = {}
  ): Promise<BatchOperationResult> {
    if (items.length === 0) {
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: ['Saved item not found']
      }
    }

    const [activeTab] = options.target === 'new'
      ? []
      : await chrome.tabs.query({ active: true, currentWindow: true })
    const windowId = activeTab?.windowId
    const openUrls = options.skipAlreadyOpen
      ? new Set((await chrome.tabs.query({})).flatMap(tab => tab.url ? [tab.url] : []))
      : new Set<string>()
    const toRestore = items.filter(item => !openUrls.has(item.url))
    const skipped = items.length - toRestore.length
    let restored = 0
    const errors: string[] = []
    const createdTabIds: number[] = []

    if (options.target === 'new' && toRestore.length > 0) {
      try {
        const window = await chrome.windows.create({
          url: toRestore[0].url,
          focused: true,
          type: 'normal'
        })
        if (window.id === undefined) {
          throw new Error('New window did not return an ID')
        }
        const [firstTab] = await chrome.tabs.query({ windowId: window.id })
        if (firstTab?.id === undefined) {
          throw new Error('New window did not return its initial tab')
        }
        createdTabIds.push(firstTab.id)
        restored++
        await chrome.tabs.update(firstTab.id, { pinned: toRestore[0].pinned }).catch(error => {
          errors.push(`Failed to restore pinned state for ${toRestore[0].url}: ${String(error)}`)
        })

        for (const [index, item] of toRestore.slice(1).entries()) {
          try {
            const tab = await chrome.tabs.create({
              url: item.url,
              pinned: item.pinned,
              active: false,
              windowId: window.id,
              index: index + 1
            })
            if (tab.id !== undefined) createdTabIds.push(tab.id)
            restored++
          } catch (error) {
            errors.push(`Failed to restore ${item.url}: ${String(error)}`)
          }
        }
      } catch (error) {
        errors.push(`Failed to create a new window: ${String(error)}`)
      }
    } else if (options.target !== 'new') {
      for (const item of toRestore) {
        try {
          const tab = await chrome.tabs.create({
            url: item.url,
            pinned: item.pinned,
            active: false,
            ...(windowId === undefined ? {} : { windowId })
          })
          if (tab.id !== undefined) createdTabIds.push(tab.id)
          restored++
        } catch (error) {
          errors.push(`Failed to restore ${item.url}: ${String(error)}`)
        }
      }
    }

    if (createdTabIds.length > 0) {
      await chrome.tabs.update(createdTabIds[0], { active: true }).catch(() => undefined)
    }

    return {
      success: errors.length === 0,
      totalOperations: items.length,
      successfulOperations: restored,
      failedOperations: items.length - restored - skipped,
      skippedOperations: skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Restored ${restored} of ${items.length} tabs; skipped ${skipped}`
    }
  }

  static async restoreList(
    id: string,
    options?: SavedTabRestoreOptions
  ): Promise<BatchOperationResult> {
    const list = (await this.getData()).lists.find(candidate => candidate.id === id)
    if (!list) {
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: ['Saved list not found']
      }
    }
    if (list.kind === 'session' && list.windows?.length) {
      return this.restoreSession(list, options)
    }
    return this.restoreItems(list.items, options)
  }

  private static async restoreSession(
    list: SavedTabList,
    options: SavedTabRestoreOptions = {}
  ): Promise<BatchOperationResult> {
    const windows = [...(list.windows ?? [])].sort((a, b) => a.index - b.index)
    const errors: string[] = []
    const restoredIds: number[] = []
    let restored = 0
    let skipped = 0
    let focusedWindowId: number | undefined
    const openUrls = options.skipAlreadyOpen
      ? new Set((await chrome.tabs.query({})).flatMap(tab => tab.url ? [tab.url] : []))
      : new Set<string>()

    for (const savedWindow of windows) {
      const items = list.items
        .filter(item => item.session?.windowIndex === savedWindow.index)
        .sort((a, b) => (a.session?.tabIndex ?? 0) - (b.session?.tabIndex ?? 0))
        .filter(item => {
          if (!openUrls.has(item.url)) return true
          skipped++
          return false
        })
      if (items.length === 0) continue

      let window: chrome.windows.Window
      try {
        window = await chrome.windows.create({
          url: items[0].url,
          focused: false,
          type: 'normal'
        })
      } catch (error) {
        errors.push(`Failed to create saved window ${savedWindow.index + 1}: ${String(error)}`)
        continue
      }

      if (window.id === undefined) {
        errors.push(`Saved window ${savedWindow.index + 1} did not return its initial tab`)
        continue
      }

      const [initialTab] = await chrome.tabs.query({ windowId: window.id })
      if (initialTab?.id === undefined) {
        errors.push(`Saved window ${savedWindow.index + 1} did not return its initial tab`)
        continue
      }

      const restoredByGroup = new Map<number, number[]>()
      const initialTabId = initialTab.id
      restoredIds.push(initialTabId)
      restored++
      const createdForWindow: Array<{ item: SavedTabItem, tabId: number }> = [
        { item: items[0], tabId: initialTabId }
      ]
      await chrome.tabs.update(initialTabId, { pinned: items[0].pinned }).catch(error => {
        errors.push(`Failed to restore pinned state for ${items[0].url}: ${String(error)}`)
      })

      for (const item of items.slice(1)) {
        try {
          const tab = await chrome.tabs.create({
            url: item.url,
            pinned: item.pinned,
            active: false,
            windowId: window.id,
            index: item.session?.tabIndex
          })
          if (tab.id === undefined) throw new Error('Restored tab did not return an ID')
          restoredIds.push(tab.id)
          createdForWindow.push({ item, tabId: tab.id })
          restored++
        } catch (error) {
          errors.push(`Failed to restore ${item.url}: ${String(error)}`)
        }
      }

      for (const { item, tabId } of createdForWindow) {
        const groupId = item.session?.groupId
        if (groupId === undefined) continue
        const groupTabs = restoredByGroup.get(groupId) ?? []
        groupTabs.push(tabId)
        restoredByGroup.set(groupId, groupTabs)
      }

      for (const [groupId, tabIds] of restoredByGroup) {
        const groupSnapshot = savedWindow.groups.find(group => group.id === groupId)
        if (!groupSnapshot || tabIds.length === 0) continue
        try {
          const newGroupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: window.id } })
          await chrome.tabGroups.update(newGroupId, {
            title: groupSnapshot.title,
            color: groupSnapshot.color,
            collapsed: groupSnapshot.collapsed
          })
        } catch (error) {
          errors.push(`Failed to restore group "${groupSnapshot.title}": ${String(error)}`)
        }
      }

      const activeTabId = createdForWindow.find(({ item }) => item.session?.active)?.tabId
      if (activeTabId !== undefined) {
        await chrome.tabs.update(activeTabId, { active: true }).catch(error => {
          errors.push(`Failed to restore active tab: ${String(error)}`)
        })
      }

      if (savedWindow.focused) focusedWindowId = window.id
    }

    if (focusedWindowId !== undefined) {
      await chrome.windows.update(focusedWindowId, { focused: true }).catch(error => {
        errors.push(`Failed to focus the restored window: ${String(error)}`)
      })
    }

    return {
      success: errors.length === 0,
      totalOperations: list.items.length,
      successfulOperations: restored,
      failedOperations: list.items.length - restored - skipped,
      skippedOperations: skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Restored ${restored} of ${list.items.length} tabs`
    }
  }

  static async restoreSavedItem(
    id: string,
    itemIndex: number,
    options?: SavedTabRestoreOptions
  ): Promise<BatchOperationResult> {
    const list = (await this.getData()).lists.find(candidate => candidate.id === id)
    const item = list?.items[itemIndex]
    return this.restoreItems(item ? [item] : [], options)
  }

  static async restoreSelectedItems(
    references: SavedTabReference[],
    options?: SavedTabRestoreOptions
  ): Promise<BatchOperationResult> {
    const data = await this.getData()
    const lists = new Map(data.lists.map(list => [list.id, list]))
    const seen = new Set<string>()
    const items: SavedTabItem[] = []

    for (const reference of references) {
      const key = `${reference.listId}:${reference.itemIndex}`
      if (seen.has(key)) continue
      seen.add(key)
      const item = lists.get(reference.listId)?.items[reference.itemIndex]
      if (item) items.push(item)
    }

    return this.restoreItems(items, options)
  }

  static async renameList(id: string, name: string): Promise<SavedTabList> {
    return withStorageMutation(async () => {
      const updated = renameSavedTabList(await this.getData(), id, name)
      await this.setData(updated)
      const list = updated.lists.find(candidate => candidate.id === id)
      if (!list) throw new Error('Saved list not found')
      return list
    })
  }

  static async deleteList(id: string): Promise<SavedTabsData> {
    return withStorageMutation(async () => {
      const updated = removeSavedTabList(await this.getData(), id)
      return this.setData({
        version: SAVED_TABS_SCHEMA_VERSION,
        lists: updated.lists
      })
    })
  }

  static async cleanupLists(
    ids: string[],
    olderThan: number,
    store: SavedTabsStore = localStore
  ): Promise<{ listCount: number, itemCount: number }> {
    return withStorageMutation(async () => {
      const selectedIds = new Set(ids.filter(id => typeof id === 'string'))
      const current = await this.getData(store)
      const expired = getExpiredSavedLists(current.lists, olderThan)
        .filter(list => selectedIds.has(list.id))
      const expiredIds = new Set(expired.map(list => list.id))
      const itemCount = expired.reduce((total, list) => total + list.items.length, 0)
      await this.setData({
        version: SAVED_TABS_SCHEMA_VERSION,
        lists: current.lists.filter(list => !expiredIds.has(list.id))
      }, store)
      return { listCount: expired.length, itemCount }
    })
  }
}

export const savedTabsService = SavedTabsService
