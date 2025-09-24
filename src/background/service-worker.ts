/**
 * Chrome Extension Service Worker
 * 处理扩展的后台逻辑和消息传递
 */

import type { ExtensionConfig, SortOptions, GroupOptions, APIResponse, BatchOperationResult } from '@/shared/types'
import { MESSAGE_TYPES, ERROR_CODES, DEFAULT_CONFIG } from '@/shared/constants'
import { StorageService } from '@/shared/utils/storage'
import { TabService } from '@/shared/utils/tabs'
import { GroupService } from '@/shared/utils/groups'

// Service Worker 安装事件
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason)
  
  try {
    // 初始化默认配置
    if (details.reason === 'install') {
      await StorageService.setConfig(DEFAULT_CONFIG)
      console.log('Default configuration initialized')
    } else if (details.reason === 'update') {
      // 更新时合并新的默认配置
      const currentConfig = await StorageService.getConfig()
      const mergedConfig = { ...DEFAULT_CONFIG, ...currentConfig }
      await StorageService.setConfig(mergedConfig)
      console.log('Configuration updated after extension update')
    }
  } catch (error) {
    console.error('Failed to initialize configuration:', error)
  }
})

// Service Worker 启动事件
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup')
  
  // 验证配置完整性
  StorageService.getConfig().then(config => {
    console.log('Current configuration:', config)
  }).catch(error => {
    console.error('Failed to load configuration on startup:', error)
  })
})

// 处理来自 popup 和 options 页面的消息
chrome.runtime.onMessage.addListener((
  message,
  sender,
  sendResponse
) => {
  console.log('Received message:', message, 'from:', sender)
  
  // 异步处理消息
    handleMessage(message, sender)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Message handling error:', error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: Date.now()
        })
      })
  
  // 返回 true 表示异步响应
  return true
})

// 处理键盘快捷键
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Keyboard shortcut triggered:', command)
  
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

/**
 * 处理消息的主要函数
 */
async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender
): Promise<APIResponse> {
  const { type, payload } = message
  
  switch (type) {
    case MESSAGE_TYPES.SORT_TABS:
      return await handleSortTabs(payload)
      
    case MESSAGE_TYPES.GROUP_TABS:
      return await handleGroupTabs(payload)
    case MESSAGE_TYPES.UNGROUP_TABS:
      return await handleUngroupTabs()
    case MESSAGE_TYPES.UPDATE_CONFIG:
      return await handleUpdateConfig(payload)

    case MESSAGE_TYPES.GET_CONFIG:
      return await handleGetConfig()

    case MESSAGE_TYPES.GET_STATS:
      return await handleGetStats()

    default:
      throw new Error(`Unknown message type: ${type}`)
  }
}

/**
 * 处理标签页排序请求
 */
async function handleSortTabs(payload: SortOptions): Promise<APIResponse> {
  try {
    
    // 获取当前窗口的所有标签
    const tabs = await TabService.getAllTabs()
    
    if (tabs.length === 0) {
      return {
        success: true,
        data: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0
        },
        timestamp: Date.now()
      }
    }
    
    // 执行排序
    const result = await TabService.sortCurrentWindow(payload)
    
    return {
      success: true,
      data: result,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`标签排序失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 处理标签页分组请求
 */
async function handleGroupTabs(payload: GroupOptions): Promise<APIResponse> {
  try {
    
    // 获取当前窗口的所有标签
    const tabs = await TabService.getAllTabs()
    
    if (tabs.length === 0) {
      return {
        success: true,
        data: {
          groupCount: 0,
          tabCount: 0,
          duration: 0
        },
        timestamp: Date.now()
      }
    }
    
    // 执行分组
    const result = await GroupService.groupTabsByDomain(tabs, payload)
    
    return {
      success: true,
      data: result,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`标签分组失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 处理取消分组请求
 */
async function handleUngroupTabs(): Promise<APIResponse> {
  try {
    
    // 取消当前窗口的所有分组
    const result = await GroupService.ungroupAllTabs()
    
    return {
      success: result.success,
      data: result,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`取消分组失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 处理配置更新请求
 */
async function handleUpdateConfig(payload: Partial<ExtensionConfig>): Promise<APIResponse> {
  try {
    
    const success = await StorageService.updateConfig(payload)
    
    if (success) {
      // 广播配置变化事件
      chrome.runtime.sendMessage({
        type: 'CONFIG_UPDATED',
        data: await StorageService.getConfig()
      }).catch(() => {
        // 忽略没有监听器的错误
      })
    } else {
      throw new Error('配置保存失败')
    }
    
    return {
      success: true,
      data: success,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`配置更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 处理获取配置请求
 */
async function handleGetConfig(): Promise<APIResponse> {
  try {

    const config = await StorageService.getConfig()

    return {
      success: true,
      data: config,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 处理统计信息请求
 */
async function handleGetStats(): Promise<APIResponse> {
  try {
    
    const [tabStats, groupStats, storageInfo, config] = await Promise.all([
      TabService.getTabStats(),
      GroupService.getGroupStats(),
      StorageService.getStorageInfo(),
      StorageService.getConfig()
    ])
    
    const stats = {
      tabs: tabStats,
      groups: groupStats,
      storage: storageInfo,
      config: config, // 返回完整的配置对象
      timestamp: Date.now()
    }
    
    return {
      success: true,
      data: stats,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new Error(`获取统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 标签页更新事件监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && changeInfo.url) {

    // 检查是否需要自动排序
    StorageService.getConfig().then(config => {
      if (config.autoSortEnabled && !tab.pinned) {
        scheduleAutoSort(config)
      }
    }).catch(error => {
      console.error('获取配置失败:', error)
    })
  }
})

// 自动排序节流器
let autoSortTimer: NodeJS.Timeout | null = null

// 执行自动排序
async function performAutoSort(config: ExtensionConfig) {
  if (!config.autoSortEnabled) return

  try {
    const sortOptions: SortOptions = {
      rule: config.defaultSortRule,
      ascending: config.sortOptions.ascending,
      caseSensitive: config.sortOptions.caseSensitive
    }

    console.log('执行自动排序:', sortOptions)
    const result = await TabService.sortCurrentWindow(sortOptions)
  } catch (error) {
    console.error('自动排序失败:', error)
  }
}

// 设置自动排序定时器
function scheduleAutoSort(config: ExtensionConfig) {
  // 清除现有定时器
  if (autoSortTimer) {
    clearTimeout(autoSortTimer)
    autoSortTimer = null
  }

  // 如果启用了自动排序，设置新的定时器
  if (config.autoSortEnabled) {
    const delay = config.autoSortDelay || 1000 // 默认1秒延迟
    autoSortTimer = setTimeout(() => {
      performAutoSort(config)
    }, delay)
  }
}

// 标签页创建事件监听
chrome.tabs.onCreated.addListener((tab) => {

  StorageService.getConfig().then(config => {
    // 自动排序
    if (config.autoSortEnabled && !tab.pinned) {
      scheduleAutoSort(config)
    }

    // 自动分组
    if (config.autoGroupEnabled && tab.url && !tab.pinned) {
      // 延迟执行，等待标签完全加载
      setTimeout(async () => {
        try {
          const tabs = await TabService.getAllTabs()
          const newTab = tabs.find(t => t.id === tab.id)
          if (newTab && newTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            // 检查是否有相同域名的分组
            const groups = await GroupService.getAllGroups()
            const matchingGroup = groups.find(g => g.domains?.includes(newTab.domain))

            if (matchingGroup) {
              // 将标签添加到现有分组
              await chrome.tabs.group({ tabIds: [tab.id!], groupId: matchingGroup.id })
              console.log(`标签 ${tab.id} 自动添加到分组 ${matchingGroup.id}`)
            }
          }
        } catch (error) {
          console.error('自动分组失败:', error)
        }
      }, 1000)
    }
  }).catch(error => {
    console.error('获取配置失败:', error)
  })
})

// 标签页移除事件监听
chrome.tabs.onRemoved.addListener((tabId) => {

  // 检查是否需要自动排序
  StorageService.getConfig().then(config => {
    if (config.autoSortEnabled) {
      scheduleAutoSort(config)
    }
  }).catch(error => {
    console.error('获取配置失败:', error)
  })
})

// 标签页组事件监听（如果支持）
if (chrome.tabGroups) {
  chrome.tabGroups.onCreated.addListener((group) => {
  })
  
  chrome.tabGroups.onUpdated.addListener((group) => {
  })
  
  chrome.tabGroups.onRemoved.addListener((group) => {
  })
}

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker 错误:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
  event.preventDefault()
})

console.log('Tab Chrome Extension Service Worker 已加载')