import { ref, type Ref } from 'vue'
import type { TabInfo, SortRule, ExtensionConfig, APIResponse, ComposableOptions } from '@/shared/types'
import { TabService } from '@/shared/utils/tabs'
import { MESSAGE_TYPES } from '@/shared/constants'
import { ErrorHandler, ErrorCode } from '@/shared/utils/errorHandler'

interface UseTabDataOptions extends ComposableOptions {
  config: Ref<ExtensionConfig | null>
}

export function useTabData(options: UseTabDataOptions) {
  const { showToast, config } = options

  // 状态管理
  const tabList = ref<TabInfo[]>([])
  const tabGroups = ref<Map<number, chrome.tabGroups.TabGroup>>(new Map())
  const isLoadingTabs = ref(false)
  const currentRule = ref<SortRule>('domain')

  // 刷新标签列表
  const refreshTabList = async () => {
    // 修复状态死锁：如果loading状态被卡住，强制重置
    if (isLoadingTabs.value) {
      console.log('⚠️ refreshTabList 检测到loading状态卡住，强制重置')
      isLoadingTabs.value = false
    }

    const result = await ErrorHandler.safeExecute(
      async () => {
        isLoadingTabs.value = true

        // 获取标签页
        const tabs = await TabService.getAllTabs(undefined, true)
        const sortResult = TabService.sortTabs(tabs, {
          rule: currentRule.value,
          ascending: config.value?.sortOptions.ascending ?? true,
          caseSensitive: config.value?.sortOptions.caseSensitive ?? false
        })
        tabList.value = sortResult.tabs

        // 获取所有分组信息
        if (chrome.tabGroups) {
          const groups = await chrome.tabGroups.query({})
          const groupsMap = new Map<number, chrome.tabGroups.TabGroup>()
          groups.forEach(group => {
            groupsMap.set(group.id, group)
          })
          tabGroups.value = groupsMap
        }


        return { tabCount: tabs.length, groupCount: tabGroups.value.size }
      },
      ErrorCode.CHROME_API_ERROR,
      'Failed to refresh tab list',
      { currentRule: currentRule.value }
    )

    if (!result.success && result.error) {
      ErrorHandler.logError(result.error, 'Tab Data')
      showToast?.(ErrorHandler.getUserMessage(result.error), 'error')
    }

    isLoadingTabs.value = false
  }

  // 切换到标签页
  const switchToTab = async (tabId: number) => {
    const result = await ErrorHandler.safeExecute(
      async () => {
        await chrome.tabs.update(tabId, { active: true })
        window.close()
      },
      ErrorCode.TAB_ACCESS_DENIED,
      'Failed to switch tab',
      { tabId }
    )

    if (!result.success && result.error) {
      ErrorHandler.logError(result.error, 'Tab Switch')
      showToast?.(ErrorHandler.getUserMessage(result.error), 'error')
    }
  }

  // 关闭标签页
  const closeTab = async (tabId: number) => {
    const result = await ErrorHandler.safeExecute(
      async () => {
        await chrome.tabs.remove(tabId)
        await refreshTabList()
        return { closedTabId: tabId }
      },
      ErrorCode.TAB_ACCESS_DENIED,
      'Failed to close tab',
      { tabId }
    )

    if (!result.success && result.error) {
      ErrorHandler.logError(result.error, 'Tab Close')
      showToast?.(ErrorHandler.getUserMessage(result.error), 'error')
    }
  }

  return {
    // 状态
    tabList,
    tabGroups,
    isLoadingTabs,
    currentRule,

    // 方法
    refreshTabList,
    switchToTab,
    closeTab
  }
}