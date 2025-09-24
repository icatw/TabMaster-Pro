import { ref, computed, watch, type Ref } from 'vue'
import type { TabInfo } from '@/shared/types'
import { debounce, PerformanceMonitor, memoize } from '@/shared/utils/performance'

interface UseOptimizedSearchOptions {
  tabList: Ref<TabInfo[]>
  debounceMs?: number
}

export function useOptimizedSearch(options: UseOptimizedSearchOptions) {
  const { tabList, debounceMs = 300 } = options

  const searchQuery = ref('')
  const debouncedQuery = ref('')
  const isSearching = ref(false)

  // Memoized search function for better performance
  const searchTabs = memoize((query: string, tabs: TabInfo[]) => {
    if (!query.trim()) return tabs

    const lowercaseQuery = query.toLowerCase()
    return tabs.filter(tab =>
      tab.title.toLowerCase().includes(lowercaseQuery) ||
      tab.url.toLowerCase().includes(lowercaseQuery) ||
      tab.domain.toLowerCase().includes(lowercaseQuery)
    )
  }, (query, tabs) => `${query}_${tabs.length}_${tabs.map(t => t.id).join(',')}`)

  // Debounced search to avoid excessive filtering
  const debouncedSearch = debounce((query: string) => {
    PerformanceMonitor.start('tab-search', { query, tabCount: tabList.value.length })

    isSearching.value = true
    debouncedQuery.value = query

    // Use requestAnimationFrame to ensure smooth UI updates
    requestAnimationFrame(() => {
      isSearching.value = false
      PerformanceMonitor.end('tab-search')
    })
  }, debounceMs)

  // Watch for search query changes
  watch(searchQuery, (newQuery) => {
    if (newQuery !== debouncedQuery.value) {
      isSearching.value = true
      debouncedSearch(newQuery)
    }
  }, { immediate: true })

  // Computed filtered tabs with performance monitoring
  const filteredTabs = computed(() => {
    return PerformanceMonitor.timeSync(
      'tab-filter-computation',
      () => searchTabs(debouncedQuery.value, tabList.value),
      {
        query: debouncedQuery.value,
        tabCount: tabList.value.length
      }
    )
  })

  // Search statistics
  const searchStats = computed(() => ({
    totalTabs: tabList.value.length,
    filteredTabs: filteredTabs.value.length,
    hasQuery: !!debouncedQuery.value.trim(),
    isSearching: isSearching.value
  }))

  const clearSearch = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    isSearching.value = false
  }

  return {
    // State
    searchQuery,
    debouncedQuery,
    isSearching,

    // Computed
    filteredTabs,
    searchStats,

    // Methods
    clearSearch
  }
}