import { ref, computed, type Ref } from 'vue'
import type { TabInfo } from '@/shared/types'
import { i18n } from '@/i18n'

export function useTabFilters(tabList: Ref<TabInfo[]>, stats: Ref<{ tabCount: number; groupCount: number }>) {
  const activeFilters = ref<string[]>(['all'])

  // 辅助函数
  const getGroupedCount = () => {
    return tabList.value.filter(tab => tab.groupId !== -1).length
  }

  const getPinnedCount = () => {
    return tabList.value.filter(tab => tab.pinned).length
  }

  const getAudibleCount = () => {
    return tabList.value.filter(tab => tab.audible).length
  }

  // 筛选器配置
  const filters = computed(() => [
    { id: 'all', label: i18n.global.t('search.filters.all'), icon: '📋', count: stats.value.tabCount },
    { id: 'grouped', label: i18n.global.t('search.filters.grouped'), icon: '📁', count: getGroupedCount() },
    { id: 'pinned', label: i18n.global.t('search.filters.pinned'), icon: '📌', count: getPinnedCount() },
    { id: 'audible', label: i18n.global.t('search.filters.audible'), icon: '🔊', count: getAudibleCount() }
  ])

  // 过滤后的标签列表
  const filteredTabs = computed(() => {
    let tabs = [...tabList.value]

    // 标签过滤
    if (!activeFilters.value.includes('all')) {
      tabs = tabs.filter(tab => {
        if (activeFilters.value.includes('grouped') && tab.groupId === -1) return false
        if (activeFilters.value.includes('pinned') && !tab.pinned) return false
        if (activeFilters.value.includes('audible') && !tab.audible) return false
        return true
      })
    }

    return tabs
  })

  // 切换筛选器
  const toggleFilter = (filterId: string) => {
    if (filterId === 'all') {
      activeFilters.value = ['all']
    } else {
      const filters = activeFilters.value.filter(f => f !== 'all')
      if (filters.includes(filterId)) {
        const newFilters = filters.filter(f => f !== filterId)
        activeFilters.value = newFilters.length > 0 ? newFilters : ['all']
      } else {
        activeFilters.value = [...filters, filterId]
      }
    }
  }

  return {
    // 状态
    activeFilters,

    // 计算属性
    filters,
    filteredTabs,

    // 方法
    toggleFilter,

    // 辅助函数
    getGroupedCount,
    getPinnedCount,
    getAudibleCount
  }
}
