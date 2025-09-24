import { ref, type Ref } from 'vue'
import type { TabInfo } from '@/shared/types'

export function useTabSelection(filteredTabs: Ref<TabInfo[]>) {
  const selectedTabIds = ref<Set<number>>(new Set())
  const isMultiSelectMode = ref(false)

  // 标签选择管理
  const toggleTabSelection = (tabId: number) => {
    if (selectedTabIds.value.has(tabId)) {
      selectedTabIds.value.delete(tabId)
      if (selectedTabIds.value.size === 0) {
        isMultiSelectMode.value = false
      }
    } else {
      selectedTabIds.value.add(tabId)
    }
  }

  const clearSelection = () => {
    selectedTabIds.value.clear()
    isMultiSelectMode.value = false
  }

  const selectAll = () => {
    isMultiSelectMode.value = true
    filteredTabs.value.forEach(tab => {
      selectedTabIds.value.add(tab.id)
    })
  }

  // 处理标签点击
  const handleTabClick = (tab: TabInfo, event: MouseEvent, switchToTab: (tabId: number) => void) => {
    // 安全检查：确保event对象存在
    if (!event) {
      console.warn('handleTabClick: event is undefined')
      if (isMultiSelectMode.value) {
        toggleTabSelection(tab.id)
      } else {
        switchToTab(tab.id)
      }
      return
    }

    if (event.ctrlKey || event.metaKey) {
      isMultiSelectMode.value = true
      toggleTabSelection(tab.id)
    } else if (isMultiSelectMode.value) {
      toggleTabSelection(tab.id)
    } else {
      switchToTab(tab.id)
    }
  }

  return {
    // 状态
    selectedTabIds,
    isMultiSelectMode,

    // 方法
    toggleTabSelection,
    clearSelection,
    selectAll,
    handleTabClick
  }
}