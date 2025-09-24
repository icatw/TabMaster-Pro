<template>
  <div class="app">
    <!-- 头部 -->
    <AppHeader
      :stats="stats"
      :auto-sort-enabled="autoSortEnabled"
      :is-dark="isDark"
      @toggle-auto-sort="handleToggleAutoSort"
      @toggle-theme="toggleTheme"
      @open-settings="openOptions"
    />

    <!-- 搜索栏 -->
    <SearchSection
      v-model:search-query="searchQuery"
      :filters="filters"
      :active-filters="activeFilters"
      @search="handleSearch"
      @clear="clearSearch"
      @toggle-filter="toggleFilter"
    />

    <!-- 主内容区 -->
    <MainContent
      :search-query="searchQuery"
      :bookmark-results="bookmarkResults"
      :bookmark-groups="bookmarkGroups"
      :displayed-bookmark-groups="displayedBookmarkGroups"
      :collapsed-bookmark-groups="collapsedBookmarkGroups"
      :show-all-bookmarks="showAllBookmarks"
      :has-more-groups="hasMoreGroups"
      :hidden-groups-count="hiddenGroupsCount"
      :filtered-tabs="filteredTabs"
      :tab-groups="tabGroups"
      :is-loading-tabs="isLoadingTabs"
      :active-filters="activeFilters"
      :selected-tab-ids="selectedTabIds"
      :is-multi-select-mode="isMultiSelectMode"
      :keyboard-nav-index="keyboardNavIndex"
      :navigable-items="navigableItems"
      @toggle-bookmark-collapse="handleBookmarkGroupCollapse"
      @expand-all-groups="expandAllGroups"
      @collapse-groups="collapseGroups"
      @refresh-tabs="refreshTabList"
      @tab-hover="handleTabHover"
      @tab-leave="handleTabLeave"
      @tab-click="handleTabClickWrapper"
      @close-tab="closeTab"
      @toggle-tab-selection="toggleTabSelection"
      @select-all="selectAll"
      @clear-selection="clearSelection"
      @batch-close="closeBatchTabs"
      @batch-group="groupBatchTabs"
      @clear-search="clearSearch"
    />

    <!-- 底部工具栏 -->
    <Toolbar
      :show-sort-menu="showSortMenu"
      :current-rule="currentRule"
      :has-groups="hasGroups"
      :is-multi-select-mode="isMultiSelectMode"
      :sort-rules="sortRules"
      @toggle-sort-menu="showSortMenu = !showSortMenu"
      @sort="handleSort"
      @group="handleGroup"
      @ungroup="handleUngroup"
      @toggle-multi-select="isMultiSelectMode = !isMultiSelectMode"
    />

    <!-- 悬停详情 -->
    <TabHoverDetails
      :visible="hoverDetails.visible"
      :tab-info="hoverDetails.tabInfo"
      :position="hoverDetails.position"
    />

    <!-- Toast 提示 -->
    <Toast
      v-if="successMessage"
      type="success"
      :message="successMessage"
      :duration="2000"
      @close="successMessage = null"
    />

    <Toast
      v-if="errorMessage"
      type="error"
      :message="errorMessage"
      :duration="3000"
      @close="errorMessage = null"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { i18n } from '@/i18n'
import type { SortRule, ExtensionConfig, APIResponse, TabInfo } from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'
import { useTheme } from '@/composables/useTheme'
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'
import { useTabManagement } from '@/composables/useTabManagement'
import { useBookmarkSearch } from '@/composables/useBookmarkSearch'
import { useToast } from '@/composables/useToast'

// 组件导入
import AppHeader from './components/layout/AppHeader.vue'
import SearchSection from './components/layout/SearchSection.vue'
import MainContent from './components/layout/MainContent.vue'
import Toolbar from './components/layout/Toolbar.vue'
import TabHoverDetails from './components/TabHoverDetails.vue'
import Toast from './components/common/Toast.vue'

// 导入主题样式
import '@/styles/theme.css'

// 主题管理
const { isDark, toggleTheme } = useTheme()

// Toast 消息管理
const { successMessage, errorMessage, showSuccess, showError } = useToast()

// 配置管理
const config = ref<ExtensionConfig | null>(null)

// 标签页管理
const {
  tabList,
  tabGroups,
  isLoadingTabs,
  currentRule,
  activeFilters,
  selectedTabIds,
  isMultiSelectMode,
  autoSortEnabled,
  stats,
  hasGroups,
  filters,
  filteredTabs: baseFilteredTabs,
  loadStats,
  refreshTabList,
  toggleFilter,
  closeTab,
  handleSort,
  handleGroup,
  toggleTabSelection,
  clearSelection,
  selectAll,
  closeBatchTabs,
  groupBatchTabs,
  handleTabClick,
  toggleAutoSort
} = useTabManagement({
  showToast: (msg, type) => type === 'success' ? showSuccess(msg) : showError(msg),
  config
})

// 搜索状态
const searchQuery = ref('')
const searchMode = ref<'tabs' | 'bookmarks'>('tabs')

// 书签搜索管理
const {
  bookmarkResults,
  bookmarkGroups,
  collapsedBookmarkGroups,
  displayedBookmarkGroups,
  showAllBookmarks,
  hasMoreGroups,
  hiddenGroupsCount,
  searchBookmarksAsync,
  clearBookmarkSearch,
  handleBookmarkGroupCollapse,
  expandAllGroups,
  collapseGroups,
  getVisibleBookmarks
} = useBookmarkSearch({ searchQuery })

// 计算属性
const filteredTabs = computed(() => {
  if (searchQuery.value) {
    return baseFilteredTabs.value.filter(tab =>
      tab.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tab.url.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  return baseFilteredTabs.value
})

// 初始化键盘导航
const {
  keyboardNavIndex,
  keyboardNavItems,
  handleKeyDown,
  updateKeyboardNavItems
} = useKeyboardNavigation({
  tabList,
  filteredTabs,
  bookmarkResults,
  searchQuery,
  showToast: (msg, type) => type === 'success' ? showSuccess(msg) : showError(msg),
  loadTabs: refreshTabList,
  clearSearch: () => {
    searchQuery.value = ''
    clearBookmarkSearch()
  },
  getVisibleBookmarks
})

// 创建 navigableItems 计算属性 (兼容现有组件接口)
const navigableItems = computed(() => keyboardNavItems.value)

// 工具栏状态
const showSortMenu = ref(false)
const sortRules = computed(() => [
  { value: 'domain' as SortRule, label: i18n.global.t('toolbar.sortBy.domain'), icon: '🌐' },
  { value: 'title' as SortRule, label: i18n.global.t('toolbar.sortBy.title'), icon: '📄' },
  { value: 'url' as SortRule, label: i18n.global.t('toolbar.sortBy.url'), icon: '🔗' },
  { value: 'lastAccessed' as SortRule, label: i18n.global.t('toolbar.sortBy.lastAccessed'), icon: '⏰' },
  { value: 'index' as SortRule, label: i18n.global.t('toolbar.sortBy.index'), icon: '📍' }
])

// 悬停详情
const hoverDetails = ref({
  visible: false,
  tabInfo: null as TabInfo | null,
  position: { x: 0, y: 0 }
})

// 事件处理函数
const handleSearch = async (query: string) => {
  searchQuery.value = query
  if (query) {
    searchMode.value = 'bookmarks'
    await searchBookmarksAsync(query)
  } else {
    clearBookmarkSearch()
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  clearBookmarkSearch()
  keyboardNavIndex.value = -1
}

const handleTabHover = (data: { tab: TabInfo, event: MouseEvent }) => {
  // 检查事件对象是否存在
  if (!data?.event || !data?.tab) {
    console.warn('handleTabHover: 缺少必要的事件参数', data)
    return
  }

  hoverDetails.value = {
    visible: true,
    tabInfo: data.tab,
    position: { x: data.event.clientX, y: data.event.clientY }
  }
}

const handleTabLeave = () => {
  hoverDetails.value.visible = false
}

// 修复事件传递 - 解构从 MainContent 传来的对象
const handleTabClickWrapper = (data: { tab: TabInfo, event: MouseEvent }) => {
  if (!data?.event || !data?.tab) {
    console.warn('handleTabClickWrapper: 缺少必要的事件参数', data)
    return
  }
  handleTabClick(data.tab, data.event)
}

const handleToggleAutoSort = () => {
  toggleAutoSort()
}

const openOptions = () => {
  chrome.runtime.openOptionsPage()
}

const handleUngroup = async () => {
  try {
    const response: APIResponse = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UNGROUP_TABS
    })

    if (response.success) {
      await Promise.all([loadStats(), refreshTabList()])
      showSuccess(response.data?.message || i18n.global.t('groups.ungroupSuccess'))
    } else {
      showError(response.error || i18n.global.t('groups.ungroupError'))
    }
  } catch (err) {
    console.error('取消分组失败:', err)
    showError(i18n.global.t('groups.ungroupError'))
  }
}

// 配置加载
const loadConfig = async () => {
  try {
    const response: APIResponse = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_CONFIG
    })
    if (response.success) {
      config.value = response.data
    }
  } catch (err) {
    console.error('Failed to load config:', err)
  }
}

// 配置更新监听
const handleConfigUpdate = (message: any) => {
  if (message.type === MESSAGE_TYPES.CONFIG_UPDATED) {
    config.value = message.config
  }
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  handleKeyDown(e)
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadStats(), refreshTabList()])
  chrome.runtime.onMessage.addListener(handleConfigUpdate)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(handleConfigUpdate)
  window.removeEventListener('keydown', handleKeydown)
})


// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (newQuery) {
    searchBookmarksAsync(newQuery)
  } else {
    clearBookmarkSearch()
  }
})

// 监听导航数据变化，更新键盘导航项
watch([filteredTabs, bookmarkResults, displayedBookmarkGroups, collapsedBookmarkGroups], () => {
  updateKeyboardNavItems()
}, { immediate: true })
</script>

<style scoped>
.app {
  width: 620px;
  min-height: 400px;
  max-height: 600px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
}


</style>