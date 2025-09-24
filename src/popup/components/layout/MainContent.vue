<template>
  <main class="app-main">
    <!-- 搜索时的优化布局 -->
    <div v-if="searchQuery" :class="searchLayoutClasses">
      <!-- 标签页结果放在前面，更重要 -->
      <div v-if="filteredTabs.length > 0" class="tabs-section">
        <TabList
          :tabs="filteredTabs"
          :tab-groups="tabGroups"
          :loading="isLoadingTabs"
          :active-filters="activeFilters"
          :selected-ids="selectedTabIds"
          :is-multi-select="isMultiSelectMode"
          :search-query="searchQuery"
          :keyboard-nav-index="keyboardNavIndex"
          :keyboard-nav-items="navigableItems"
          @refresh="refreshTabList"
          @hover="handleTabHover"
          @leave="handleTabLeave"
          @click="handleTabClick"
          @close="closeTab"
          @toggle-select="toggleTabSelection"
          @select-all="selectAll"
          @clear-selection="clearSelection"
          @batch-close="closeBatchTabs"
          @batch-group="groupBatchTabs"
        />
      </div>

      <!-- 分割线 -->
      <div v-if="filteredTabs.length > 0 && bookmarkResults.length > 0" class="search-divider">
        <div class="divider-line"></div>
        <span class="divider-text">{{ $t('common.bookmarks') }}</span>
        <div class="divider-line"></div>
      </div>

      <!-- 书签结果在下方，可折叠 -->
      <div v-if="bookmarkResults.length > 0" class="bookmarks-section">
        <div class="bookmarks-content">
          <!-- 书签分组列表 -->
          <div class="bookmark-groups">
            <BookmarkGroup
              v-for="group in displayedBookmarkGroups"
              :key="group.name"
              :group-name="getGroupDisplayName(group)"
              :bookmarks="group.bookmarks"
              :group-type="group.type"
              :collapsed="collapsedBookmarkGroups.has(group.name)"
              :keyboard-nav-index="keyboardNavIndex"
              :keyboard-nav-items="navigableItems"
              @toggle-collapse="handleBookmarkGroupCollapse"
            />
          </div>

          <!-- 展开/收起更多分组 -->
          <div v-if="hasMoreGroups && !showAllBookmarks" class="expand-results">
            <button @click="expandAllGroups" class="show-more-btn">
              <svg class="expand-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              <span>{{ showMoreText }}</span>
            </button>
          </div>

          <div v-if="hasMoreGroups && showAllBookmarks" class="collapse-results">
            <button @click="collapseGroups" class="show-less-btn">
              <svg class="collapse-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              <span>{{ $t('bookmarks.showLess') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 非搜索时的正常布局 -->
    <TabList
      v-else
      :tabs="filteredTabs"
      :tab-groups="tabGroups"
      :loading="isLoadingTabs"
      :active-filters="activeFilters"
      :selected-ids="selectedTabIds"
      :is-multi-select="isMultiSelectMode"
      :search-query="searchQuery"
      :keyboard-nav-index="keyboardNavIndex"
      :keyboard-nav-items="navigableItems"
      @refresh="refreshTabList"
      @hover="handleTabHover"
      @leave="handleTabLeave"
      @click="handleTabClick"
      @close="closeTab"
      @toggle-select="toggleTabSelection"
      @select-all="selectAll"
      @clear-selection="clearSelection"
      @batch-close="closeBatchTabs"
      @batch-group="groupBatchTabs"
    />

    <!-- 空状态提示 -->
    <EmptyState
      v-if="!isLoadingTabs && filteredTabs.length === 0 && bookmarkResults.length === 0"
      :message="searchQuery ? $t('search.noResults') : $t('tabs.noTabs')"
      :show-action="!!searchQuery"
      :action-text="$t('common.clear')"
      @action="clearSearch"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentLocale } from '@/i18n'
import BookmarkGroup from '@/popup/components/BookmarkGroup.vue'
import TabList from '@/popup/components/TabList.vue'
import EmptyState from '@/popup/components/common/EmptyState.vue'
import type { TabInfo } from '@/shared/types'
import type { BookmarkInfo } from '@/shared/utils/bookmarks'
import type { BookmarkGroup as BookmarkGroupData } from '@/shared/utils/bookmarkGrouping'
import { getGroupDisplayName } from '@/shared/utils/bookmarkGrouping'

interface NavigationItem {
  type: 'tab' | 'bookmark'
  data: any
  id: string
}

interface Props {
  // 搜索相关
  searchQuery: string

  // 书签相关
  bookmarkResults: BookmarkInfo[]
  bookmarkGroups: BookmarkGroupData[]
  displayedBookmarkGroups: BookmarkGroupData[]
  collapsedBookmarkGroups: Set<string>
  showAllBookmarks: boolean
  hasMoreGroups: boolean
  hiddenGroupsCount: number

  // 标签页相关
  filteredTabs: TabInfo[]
  tabGroups: Map<number, chrome.tabGroups.TabGroup>
  isLoadingTabs: boolean
  activeFilters: string[]
  selectedTabIds: Set<number>
  isMultiSelectMode: boolean

  // 键盘导航
  keyboardNavIndex: number
  navigableItems: NavigationItem[]
}

interface Emits {
  // 书签事件
  (e: 'toggle-bookmark-collapse', groupName: string): void
  (e: 'expand-all-groups'): void
  (e: 'collapse-groups'): void

  // 标签页事件
  (e: 'refresh-tabs'): void
  (e: 'tab-hover', data: { tab: TabInfo; event: MouseEvent }): void
  (e: 'tab-leave'): void
  (e: 'tab-click', data: { tab: TabInfo; event: MouseEvent }): void
  (e: 'close-tab', tabId: number): void
  (e: 'toggle-tab-selection', tabId: number): void
  (e: 'select-all'): void
  (e: 'clear-selection'): void
  (e: 'batch-close'): void
  (e: 'batch-group'): void

  // 搜索事件
  (e: 'clear-search'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算展开按钮文字
const showMoreText = computed(() => {
  const count = props.hiddenGroupsCount
  const currentLocale = getCurrentLocale()

  if (currentLocale === 'zh-CN') {
    return `展开更多分组 (${count})`
  } else {
    return `Show more groups (${count})`
  }
})

// 计算搜索布局的CSS类
const searchLayoutClasses = computed(() => {
  const hasBookmarks = props.bookmarkResults.length > 0
  const hasTabs = props.filteredTabs.length > 0

  return {
    'search-layout': true,
    'search-layout--only-bookmarks': hasBookmarks && !hasTabs,
    'search-layout--only-tabs': hasTabs && !hasBookmarks,
    'search-layout--mixed': hasBookmarks && hasTabs
  }
})

// 事件处理函数
const handleBookmarkGroupCollapse = (groupName: string) => {
  emit('toggle-bookmark-collapse', groupName)
}

const refreshTabList = () => {
  emit('refresh-tabs')
}

const handleTabHover = (tab: TabInfo, event: MouseEvent) => {
  emit('tab-hover', { tab, event })
}

const handleTabLeave = () => {
  emit('tab-leave')
}

const handleTabClick = (tab: TabInfo, event: MouseEvent) => {
  emit('tab-click', { tab, event })
}

const closeTab = (tabId: number) => {
  emit('close-tab', tabId)
}

const toggleTabSelection = (tabId: number) => {
  emit('toggle-tab-selection', tabId)
}

const selectAll = () => {
  emit('select-all')
}

const clearSelection = () => {
  emit('clear-selection')
}

const closeBatchTabs = () => {
  emit('batch-close')
}

const groupBatchTabs = () => {
  emit('batch-group')
}

const clearSearch = () => {
  emit('clear-search')
}

const expandAllGroups = () => {
  emit('expand-all-groups')
}

const collapseGroups = () => {
  emit('collapse-groups')
}
</script>

<style scoped>
.app-main {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  position: relative;
  padding-bottom: 4px;
}

.search-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 只有书签时：减少底部间距 */
.search-layout--only-bookmarks {
  padding-bottom: 0px;
}

/* 只有标签时：最小间距 */
.search-layout--only-tabs {
  padding-bottom: 2px;
}

/* 混合模式（标签+书签）：需要更多间距来容纳分割线 */
.search-layout--mixed {
  padding-bottom: 8px;
}

.tabs-section {
  flex-shrink: 0;
}

.search-divider {
  display: flex;
  align-items: center;
  margin: 2px 16px;
  gap: 8px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-primary);
}

.divider-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  padding: 0 4px;
}

.bookmarks-section {
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 8px;
}

.bookmarks-section::-webkit-scrollbar {
  width: 4px;
}

.bookmarks-section::-webkit-scrollbar-track {
  background: transparent;
}

.bookmarks-section::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 2px;
}

.bookmarks-section::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.bookmarks-content {
  padding: 8px 16px 16px 16px;
}

.bookmark-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expand-results, .collapse-results {
  display: flex;
  justify-content: center;
  margin: 8px 0 8px 0;
  padding-bottom: 4px;
}

/* 在混合模式下给展开按钮更多空间 */
.search-layout--mixed .expand-results,
.search-layout--mixed .collapse-results {
  margin: 12px 0 8px 0;
  padding-bottom: 8px;
}

/* 在纯书签模式下减少展开按钮间距 */
.search-layout--only-bookmarks .expand-results,
.search-layout--only-bookmarks .collapse-results {
  margin: 6px 0 4px 0;
  padding-bottom: 0px;
}

.show-more-btn, .show-less-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover, .show-less-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.expand-icon, .collapse-icon {
  width: 12px;
  height: 12px;
}

/* 滚动条样式 */
.app-main::-webkit-scrollbar {
  width: 6px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>