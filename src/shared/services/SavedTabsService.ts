import type {
  BatchOperationResult,
  SavedTabItem,
  SavedTabList,
  SavedTabsData
} from '../types'
import { SAVED_TABS_SCHEMA_VERSION, STORAGE_KEYS } from '../constants'
import {
  addSavedTabList,
  createSavedTabList,
  normalizeSavedTabsData,
  removeSavedTabList,
  renameSavedTabList
} from '../utils/savedTabs'

interface SavedTabsStore {
  get: (key: string) => Promise<Record<string, unknown>>
  set: (items: Record<string, unknown>) => Promise<void>
}

const localStore: SavedTabsStore = {
  get: key => chrome.storage.local.get(key),
  set: items => chrome.storage.local.set(items)
}

function toSavedItem(tab: chrome.tabs.Tab, now = Date.now()): SavedTabItem | null {
  if (!tab.url?.trim()) return null
  return {
    title: tab.title?.trim() || tab.url,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    createdAt: now
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

  static async saveTabs(
    tabs: chrome.tabs.Tab[],
    name: string,
    store: SavedTabsStore = localStore
  ): Promise<SavedTabList | null> {
    return withStorageMutation(async () => {
      const list = createSavedTabList(toSavedItems(tabs), name)
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
      name?.trim() || `Saved window (${tabs.length} tabs)`
    )
    if (!list) throw new Error('No restorable tabs in this window')
    return list
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
      name?.trim() || `Closed tabs (${restorableTabs.length})`
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

  private static async restoreItems(items: SavedTabItem[]): Promise<BatchOperationResult> {
    if (items.length === 0) {
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: ['Saved item not found']
      }
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const windowId = activeTab?.windowId
    let restored = 0
    const errors: string[] = []
    const createdTabIds: number[] = []

    for (const item of items) {
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

    if (createdTabIds.length > 0) {
      await chrome.tabs.update(createdTabIds[0], { active: true }).catch(() => undefined)
    }

    return {
      success: errors.length === 0,
      totalOperations: items.length,
      successfulOperations: restored,
      failedOperations: items.length - restored,
      errors: errors.length > 0 ? errors : undefined,
      message: `Restored ${restored} of ${items.length} tabs`
    }
  }

  static async restoreList(id: string): Promise<BatchOperationResult> {
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
    return this.restoreItems(list.items)
  }

  static async restoreSavedItem(id: string, itemIndex: number): Promise<BatchOperationResult> {
    const list = (await this.getData()).lists.find(candidate => candidate.id === id)
    const item = list?.items[itemIndex]
    return this.restoreItems(item ? [item] : [])
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
}

export const savedTabsService = SavedTabsService
