import { type Ref } from 'vue'
import type { TabInfo, SortRule, ExtensionConfig, ComposableOptions } from '@/shared/types'
import { useTabData } from './useTabData'
import { useTabStats } from './useTabStats'
import { useTabFilters } from './useTabFilters'
import { useTabSelection } from './useTabSelection'
import { useTabOperations } from './useTabOperations'

interface UseTabManagementOptions extends ComposableOptions {
  config: Ref<ExtensionConfig | null>
}

export function useTabManagement(options: UseTabManagementOptions) {
  const { showToast, config } = options

  // 初始化核心数据管理
  const tabDataComposable = useTabData({ showToast, config })
  const { tabList, tabGroups, isLoadingTabs, currentRule, refreshTabList, switchToTab, closeTab } = tabDataComposable

  // 初始化统计管理
  const statsComposable = useTabStats()
  const { stats, hasGroups, loadStats } = statsComposable

  // 初始化筛选管理
  const filtersComposable = useTabFilters(tabList, stats)
  const {
    activeFilters,
    filters,
    filteredTabs,
    toggleFilter,
    getGroupedCount,
    getPinnedCount,
    getAudibleCount
  } = filtersComposable

  // 初始化选择管理
  const selectionComposable = useTabSelection(filteredTabs)
  const {
    selectedTabIds,
    isMultiSelectMode,
    toggleTabSelection,
    clearSelection,
    selectAll,
    handleTabClick: baseHandleTabClick
  } = selectionComposable

  // 初始化操作管理
  const operationsComposable = useTabOperations({
    showToast,
    config,
    currentRule,
    selectedTabIds,
    isLoadingTabs,
    refreshTabList,
    loadStats,
    clearSelection
  })
  const {
    autoSortEnabled,
    handleSort,
    handleGroup,
    closeBatchTabs,
    groupBatchTabs,
    toggleAutoSort
  } = operationsComposable

  // 处理标签点击 - 包装原始函数以传递 switchToTab
  const handleTabClick = (tab: TabInfo, event: MouseEvent) => {
    baseHandleTabClick(tab, event, switchToTab)
  }

  // 增强的关闭标签页函数，同时更新统计
  const enhancedCloseTab = async (tabId: number) => {
    await closeTab(tabId)
    await loadStats()
  }

  // 增强的刷新函数，同时更新统计
  const enhancedRefreshTabList = async () => {
    await refreshTabList()
    await loadStats()
  }

  return {
    // 状态
    tabList,
    tabGroups,
    isLoadingTabs,
    currentRule,
    activeFilters,
    selectedTabIds,
    isMultiSelectMode,
    autoSortEnabled,
    stats,

    // 计算属性
    hasGroups,
    filters,
    filteredTabs,

    // 方法
    loadStats,
    refreshTabList: enhancedRefreshTabList,
    toggleFilter,
    switchToTab,
    closeTab: enhancedCloseTab,
    handleSort,
    handleGroup,
    toggleTabSelection,
    clearSelection,
    selectAll,
    closeBatchTabs,
    groupBatchTabs,
    handleTabClick,
    toggleAutoSort,

    // 辅助函数
    getGroupedCount,
    getPinnedCount,
    getAudibleCount
  }
}