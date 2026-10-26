import type {
  APIResponse,
  ExtensionConfig,
  GroupOptions,
  SortOptions
} from '@/shared/types'
import {
  DEFAULT_CONFIG,
  ERROR_CODES,
  MESSAGE_TYPES
} from '@/shared/constants'
import { SavedTabsService } from '@/shared/services/SavedTabsService'
import { GroupService } from '@/shared/utils/groups'
import { StorageService } from '@/shared/utils/storage'
import { TabService } from '@/shared/utils/tabs'

interface SaveAndClosePayload {
  tabIds?: number[]
  name?: string
}

interface SaveWindowPayload {
  name?: string
}

interface RestoreListPayload {
  id: string
}

interface RestoreSavedItemPayload {
  id: string
  itemIndex: number
}

interface UpdateListPayload {
  id: string
  name: string
}

function response<T>(data: T, success = true, error?: string): APIResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: Date.now()
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  try {
    if (reason === 'install') {
      await StorageService.setConfig(DEFAULT_CONFIG)
      return
    }

    if (reason === 'update') {
      const currentConfig = await StorageService.getConfig()
      const mergedConfig: ExtensionConfig = {
        ...DEFAULT_CONFIG,
        ...currentConfig,
        sortOptions: {
          ...DEFAULT_CONFIG.sortOptions,
          ...currentConfig.sortOptions
        },
        groupOptions: {
          ...DEFAULT_CONFIG.groupOptions,
          ...currentConfig.groupOptions
        }
      }
      await StorageService.setConfig(mergedConfig)
    }
  } catch (error) {
    console.error('Failed to initialize extension:', error)
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => {
      console.error('Message handling error:', error)
      sendResponse(response(
        undefined,
        false,
        error instanceof Error ? error.message : '未知错误'
      ))
    })

  return true
})

chrome.commands.onCommand.addListener(async command => {
  try {
    const config = await StorageService.getConfig()
    switch (command) {
    case 'sort-tabs':
      await handleSortTabs(config.sortOptions)
      break
    case 'group-tabs':
      await handleGroupTabs(config.groupOptions)
      break
    case 'ungroup-tabs':
      await handleUngroupTabs()
      break
    default:
      console.warn('Unknown command:', command)
    }
  } catch (error) {
    console.error('Failed to execute keyboard shortcut:', error)
  }
})

async function handleMessage(message: {
  type?: string
  payload?: unknown
}): Promise<APIResponse> {
  const { type, payload } = message

  switch (type) {
  case MESSAGE_TYPES.SORT_TABS:
    return handleSortTabs(payload as SortOptions)
  case MESSAGE_TYPES.GROUP_TABS:
    return handleGroupTabs(payload as GroupOptions)
  case MESSAGE_TYPES.UNGROUP_TABS:
    return handleUngroupTabs()
  case MESSAGE_TYPES.UPDATE_CONFIG:
    return handleUpdateConfig(payload as Partial<ExtensionConfig>)
  case MESSAGE_TYPES.GET_CONFIG:
    return handleGetConfig()
  case MESSAGE_TYPES.GET_STATS:
    return handleGetStats()
  case MESSAGE_TYPES.SAVE_WINDOW:
    return handleSaveWindow(payload as SaveWindowPayload)
  case MESSAGE_TYPES.SAVE_AND_CLOSE_TABS:
    return handleSaveAndCloseTabs(payload as SaveAndClosePayload)
  case MESSAGE_TYPES.GET_SAVED_LISTS:
    return response(await SavedTabsService.getLists())
  case MESSAGE_TYPES.RESTORE_LIST:
    return handleRestoreList(payload as RestoreListPayload)
  case MESSAGE_TYPES.RESTORE_SAVED_ITEM:
    return handleRestoreSavedItem(payload as RestoreSavedItemPayload)
  case MESSAGE_TYPES.UPDATE_LIST:
    return handleUpdateList(payload as UpdateListPayload)
  case MESSAGE_TYPES.DELETE_LIST:
    return handleDeleteList(payload as RestoreListPayload)
  default:
    return response(undefined, false, `Unknown message type: ${type}`)
  }
}

async function handleSortTabs(payload: SortOptions): Promise<APIResponse> {
  try {
    const result = await TabService.sortCurrentWindow(payload)
    return response(result, result.success, result.errors?.[0])
  } catch (error) {
    return response(undefined, false, `标签排序失败: ${toErrorMessage(error)}`)
  }
}

async function handleGroupTabs(payload: GroupOptions = {}): Promise<APIResponse> {
  try {
    const tabs = await TabService.getAllTabs()
    const result = await GroupService.groupTabsByDomain(tabs, payload)
    return response(result, result.success, result.error)
  } catch (error) {
    return response(undefined, false, `标签分组失败: ${toErrorMessage(error)}`)
  }
}

async function handleUngroupTabs(): Promise<APIResponse> {
  try {
    const result = await GroupService.ungroupAllTabs()
    return response(result, result.success, result.errors?.[0])
  } catch (error) {
    return response(undefined, false, `取消分组失败: ${toErrorMessage(error)}`)
  }
}

async function handleUpdateConfig(
  payload: Partial<ExtensionConfig>
): Promise<APIResponse> {
  try {
    const success = await StorageService.updateConfig(payload)
    if (!success) throw new Error(ERROR_CODES.CONFIG_UPDATE_FAILED)

    const config = await StorageService.getConfig()
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CONFIG_UPDATED,
      data: config
    }).catch(() => undefined)

    return response(config)
  } catch (error) {
    return response(undefined, false, `配置更新失败: ${toErrorMessage(error)}`)
  }
}

async function handleGetConfig(): Promise<APIResponse> {
  try {
    return response(await StorageService.getConfig())
  } catch (error) {
    return response(undefined, false, `获取配置失败: ${toErrorMessage(error)}`)
  }
}

async function handleGetStats(): Promise<APIResponse> {
  try {
    const [tabs, groups, storage, config] = await Promise.all([
      TabService.getTabStats(),
      GroupService.getGroupStats(),
      StorageService.getStorageInfo(),
      StorageService.getConfig()
    ])
    return response({ tabs, groups, storage, config, timestamp: Date.now() })
  } catch (error) {
    return response(undefined, false, `获取统计信息失败: ${toErrorMessage(error)}`)
  }
}

async function handleSaveWindow(payload: SaveWindowPayload = {}): Promise<APIResponse> {
  try {
    return response(await SavedTabsService.saveWindow(payload.name))
  } catch (error) {
    return response(undefined, false, `保存窗口失败: ${toErrorMessage(error)}`)
  }
}

async function handleSaveAndCloseTabs(
  payload: SaveAndClosePayload = {}
): Promise<APIResponse> {
  try {
    let tabIds = payload.tabIds
    if (tabIds === undefined) {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      tabIds = tabs.flatMap(tab => tab.id === undefined ? [] : [tab.id])
    }

    const result = await SavedTabsService.saveAndCloseTabs(tabIds, payload.name)
    return response(result, result.success, result.errors?.[0])
  } catch (error) {
    return response(undefined, false, `保存并关闭失败: ${toErrorMessage(error)}`)
  }
}

async function handleRestoreList(payload: RestoreListPayload): Promise<APIResponse> {
  try {
    const result = await SavedTabsService.restoreList(payload.id)
    return response(result, result.success, result.errors?.[0])
  } catch (error) {
    return response(undefined, false, `恢复标签页失败: ${toErrorMessage(error)}`)
  }
}

async function handleRestoreSavedItem(
  payload: RestoreSavedItemPayload
): Promise<APIResponse> {
  try {
    const result = await SavedTabsService.restoreSavedItem(payload.id, payload.itemIndex)
    return response(result, result.success, result.errors?.[0])
  } catch (error) {
    return response(undefined, false, `恢复标签页失败: ${toErrorMessage(error)}`)
  }
}

async function handleUpdateList(payload: UpdateListPayload): Promise<APIResponse> {
  try {
    return response(await SavedTabsService.renameList(payload.id, payload.name))
  } catch (error) {
    return response(undefined, false, `重命名失败: ${toErrorMessage(error)}`)
  }
}

async function handleDeleteList(payload: RestoreListPayload): Promise<APIResponse> {
  try {
    return response(await SavedTabsService.deleteList(payload.id))
  } catch (error) {
    return response(undefined, false, `删除失败: ${toErrorMessage(error)}`)
  }
}

async function afterNavigation(tab: chrome.tabs.Tab): Promise<void> {
  const config = await StorageService.getConfig()

  if (config.autoSortEnabled && !tab.pinned) {
    await TabService.sortCurrentWindow({
      rule: config.defaultSortRule,
      ascending: config.sortOptions.ascending,
      caseSensitive: config.sortOptions.caseSensitive
    })
  }

  if (config.autoGroupEnabled && tab.url && !tab.pinned) {
    const tabs = await TabService.getAllTabs(tab.windowId)
    await GroupService.groupTabsByDomain(tabs, config.groupOptions)
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && !changeInfo.url) return
  void afterNavigation(tab).catch(error => {
    console.error('Failed to organize tabs after navigation:', error)
  })
})

chrome.tabs.onRemoved.addListener(async () => {
  try {
    const config = await StorageService.getConfig()
    if (!config.autoSortEnabled) return
    await TabService.sortCurrentWindow({
      rule: config.defaultSortRule,
      ascending: config.sortOptions.ascending,
      caseSensitive: config.sortOptions.caseSensitive
    })
  } catch (error) {
    console.error('Failed to auto-sort after tab removal:', error)
  }
})

self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error)
})

self.addEventListener('unhandledrejection', event => {
  console.error('Unhandled service worker rejection:', event.reason)
  event.preventDefault()
})
