import { ref, watch, type Ref } from 'vue'
import type { SortRule, ExtensionConfig, APIResponse } from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'
import { i18n, getCurrentLocale } from '@/i18n'

interface UseTabOperationsOptions {
  showToast: (message: string, type: 'success' | 'error') => void
  config: Ref<ExtensionConfig | null>
  currentRule: Ref<SortRule>
  selectedTabIds: Ref<Set<number>>
  isLoadingTabs: Ref<boolean>
  refreshTabList: () => Promise<void>
  loadStats: () => Promise<void>
  clearSelection: () => void
}

export function useTabOperations(options: UseTabOperationsOptions) {
  const {
    showToast,
    config,
    currentRule,
    selectedTabIds,
    isLoadingTabs,
    refreshTabList,
    loadStats,
    clearSelection
  } = options

  const autoSortEnabled = ref(false)

  // 监听配置变化，同步自动排序状态
  watch(config, (newConfig) => {
    if (newConfig && !isToggling) {
      autoSortEnabled.value = newConfig.autoSortEnabled
    }
  }, { immediate: true })

  // 排序标签页
  const handleSort = async (rule: SortRule) => {
    if (isLoadingTabs.value) return

    isLoadingTabs.value = true

    try {
      const response: APIResponse = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SORT_TABS,
        payload: {
          rule,
          ascending: config.value?.sortOptions.ascending ?? true,
          caseSensitive: config.value?.sortOptions.caseSensitive ?? false
        }
      })

      if (response.success) {
        currentRule.value = rule
        await loadStats()
        await refreshTabList()

        const sortRules = [
          { value: 'domain' as SortRule, label: '按域名' },
          { value: 'title' as SortRule, label: '按标题' },
          { value: 'url' as SortRule, label: '按URL' },
          { value: 'lastAccessed' as SortRule, label: '按时间' }
        ]

        showToast(i18n.global.t('messages.sortSuccess'), 'success')
      } else {
        showToast(response.error || i18n.global.t('errors.sortFailed'), 'error')
      }
    } catch (err) {
      console.error('Sort error:', err)
      showToast(err instanceof Error ? err.message : i18n.global.t('errors.sortOperation'), 'error')
    } finally {
      isLoadingTabs.value = false
    }
  }

  // 分组标签页
  const handleGroup = async () => {
    if (isLoadingTabs.value) return

    isLoadingTabs.value = true

    try {
      const response: APIResponse = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.GROUP_TABS,
        payload: {
          minTabsPerGroup: config.value?.groupOptions.minTabsPerGroup ?? 2,
          maxGroupsPerWindow: config.value?.groupOptions.maxGroupsPerWindow ?? 10,
          colorStrategy: config.value?.groupOptions.colorStrategy ?? 'auto'
        }
      })

      if (response.success) {
        await Promise.all([loadStats(), refreshTabList()])
        const message = response.data?.message || `已创建 ${response.data?.groupCount ?? 0} 个标签组`
        showToast(message, 'success')
      } else {
        showToast(response.error || i18n.global.t('errors.groupFailed'), 'error')
      }
    } catch (err) {
      console.error('Group error:', err)
      showToast(err instanceof Error ? err.message : i18n.global.t('errors.groupOperation'), 'error')
    } finally {
      isLoadingTabs.value = false
    }
  }

  // 批量操作
  const closeBatchTabs = async () => {
    if (selectedTabIds.value.size === 0) return

    try {
      const tabIds = Array.from(selectedTabIds.value)
      await chrome.tabs.remove(tabIds)

      clearSelection()
      await refreshTabList()
      await loadStats()
      const currentLocale = getCurrentLocale()
      const count = tabIds.length
      const message = currentLocale === 'zh-CN'
        ? `已关闭 ${count} 个标签页`
        : `Closed ${count} tabs`
      showToast(message, 'success')
    } catch (err) {
      console.error('Batch close error:', err)
      showToast(i18n.global.t('errors.batchCloseFailed'), 'error')
    }
  }

  const groupBatchTabs = async () => {
    if (selectedTabIds.value.size === 0) return

    try {
      const tabIds = Array.from(selectedTabIds.value)

      // 验证tabIds数组
      const validTabIds = tabIds.filter(id => typeof id === 'number' && id > 0)
      if (validTabIds.length === 0) {
        showToast(i18n.global.t('errors.noValidTabsToGroup'), 'error')
        return
      }

      const groupId = await chrome.tabs.group({ tabIds: validTabIds })

      const currentLocale = getCurrentLocale()
      const title = currentLocale === 'zh-CN'
        ? `批量分组 (${validTabIds.length}个标签页)`
        : `Batch Group (${validTabIds.length} tabs)`

      await chrome.tabGroups.update(groupId, {
        title,
        color: 'blue'
      })

      clearSelection()
      await refreshTabList()
      const count = validTabIds.length
      const message = currentLocale === 'zh-CN'
        ? `已将 ${count} 个标签页分组`
        : `Grouped ${count} tabs`
      showToast(message, 'success')
    } catch (err) {
      console.error('Batch group error:', err)
      showToast(i18n.global.t('errors.batchGroupFailed'), 'error')
    }
  }

  // 防止重复调用的标志
  let isToggling = false

  // 切换自动排序
  const toggleAutoSort = async () => {
    if (isToggling) {
      return
    }

    const currentValue = autoSortEnabled.value
    const newValue = !currentValue

    isToggling = true

    try {
      const response: APIResponse = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.UPDATE_CONFIG,
        payload: {
          autoSortEnabled: newValue,
          defaultSortRule: currentRule.value
        }
      })

      if (response.success) {
        // 直接更新本地状态，不依赖config watch
        autoSortEnabled.value = newValue

        // 确保配置对象存在并更新，如果不存在则重新获取
        if (config.value) {
          config.value = { ...config.value, autoSortEnabled: newValue }
        } else {
          // 重新获取配置
          const configResponse: APIResponse = await chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.GET_CONFIG
          })
          if (configResponse.success) {
            config.value = configResponse.data
          }
        }

        const messageKey = newValue ? 'messages.autoSortEnabled' : 'messages.autoSortDisabled'
        const message = i18n.global.t(messageKey)
        showToast(message, 'success')
      } else {
        showToast(i18n.global.t('errors.settingsFailed'), 'error')
      }
    } catch (err) {
      console.error('Failed to toggle auto sort:', err)
      showToast(i18n.global.t('errors.settingsFailed'), 'error')
    } finally {
      isToggling = false
    }
  }

  return {
    // 状态
    autoSortEnabled,

    // 方法
    handleSort,
    handleGroup,
    closeBatchTabs,
    groupBatchTabs,
    toggleAutoSort
  }
}