<template>
  <div class="optimized-tab-list">
    <!-- Performance indicator for development -->
    <div v-if="showPerformanceInfo" class="performance-info">
      <span>{{ tabs.length }} tabs</span>
      <span v-if="searchStats.hasQuery">
        ({{ searchStats.filteredTabs }} filtered)
      </span>
      <span v-if="searchStats.isSearching" class="searching">🔍</span>
    </div>

    <!-- Virtual scrolling for large lists -->
    <VirtualList
      v-if="tabs.length > virtualThreshold"
      :items="tabs"
      :item-height="tabItemHeight"
      :container-height="containerHeight"
      :overscan="5"
      key-field="id"
      ref="virtualListRef"
      class="tab-virtual-list"
    >
      <template #default="{ item: tab, index }">
        <LazyComponent
          :component="TabItem"
          :component-props="{
            tab,
            isSelected: selectedIds.has(tab.id),
            isMultiSelect: isMultiSelect,
            searchQuery,
            isKeyboardActive: keyboardNavIndex === getTabNavIndex(tab.id)
          }"
          :component-events="{
            click: (event) => handleTabClick(tab, event),
            hover: (event) => handleTabHover(tab, event),
            leave: handleTabLeave,
            close: () => handleTabClose(tab.id),
            'toggle-select': () => handleToggleSelect(tab.id)
          }"
          :delay="index * 10"
          class="virtual-tab-item"
        />
      </template>
    </VirtualList>

    <!-- Regular rendering for smaller lists -->
    <div v-else class="tab-regular-list">
      <TransitionGroup name="tab-list" tag="div">
        <TabItem
          v-for="(tab, index) in tabs"
          :key="tab.id"
          :tab="tab"
          :is-selected="selectedIds.has(tab.id)"
          :is-multi-select="isMultiSelect"
          :search-query="searchQuery"
          :is-keyboard-active="keyboardNavIndex === getTabNavIndex(tab.id)"
          @click="(event) => handleTabClick(tab, event)"
          @hover="(event) => handleTabHover(tab, event)"
          @leave="handleTabLeave"
          @close="handleTabClose(tab.id)"
          @toggle-select="handleToggleSelect(tab.id)"
          class="tab-list-item"
          :style="{ 'animation-delay': `${index * 20}ms` }"
        />
      </TransitionGroup>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载标签页...</span>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && tabs.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>{{ searchQuery ? '没有找到匹配的标签页' : '暂无标签页' }}</p>
      <button v-if="searchQuery" @click="$emit('clear-search')" class="clear-search-btn">
        清除搜索
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { PerformanceMonitor } from '@/shared/utils/performance'
import type { TabInfo, NavigationItem } from '@/shared/types'
import VirtualList from './common/VirtualList.vue'
import LazyComponent from './common/LazyComponent.vue'
import TabItem from './TabItem.vue'

interface Props {
  tabs: TabInfo[]
  loading?: boolean
  selectedIds: Set<number>
  isMultiSelect: boolean
  searchQuery: string
  keyboardNavIndex: number
  keyboardNavItems: NavigationItem[]
  searchStats?: {
    totalTabs: number
    filteredTabs: number
    hasQuery: boolean
    isSearching: boolean
  }
}

interface Emits {
  (e: 'tab-click', tab: TabInfo, event: MouseEvent): void
  (e: 'tab-hover', tab: TabInfo, event: MouseEvent): void
  (e: 'tab-leave'): void
  (e: 'tab-close', tabId: number): void
  (e: 'toggle-select', tabId: number): void
  (e: 'clear-search'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchStats: () => ({
    totalTabs: 0,
    filteredTabs: 0,
    hasQuery: false,
    isSearching: false
  })
})

const emit = defineEmits<Emits>()

// Configuration
const virtualThreshold = 50 // Use virtual scrolling for lists with more than 50 items
const tabItemHeight = 60 // Height of each tab item in pixels
const containerHeight = 400 // Max height of the container
const showPerformanceInfo = process.env.NODE_ENV === 'development'

const virtualListRef = ref<InstanceType<typeof VirtualList>>()

// Get navigation index for a tab
const getTabNavIndex = (tabId: number) => {
  return props.keyboardNavItems.findIndex(item =>
    item.type === 'tab' && item.data.id === tabId
  )
}

// Event handlers with performance monitoring
const handleTabClick = (tab: TabInfo, event: MouseEvent) => {
  PerformanceMonitor.start('tab-click', { tabId: tab.id })
  emit('tab-click', tab, event)
  PerformanceMonitor.end('tab-click')
}

const handleTabHover = (tab: TabInfo, event: MouseEvent) => {
  emit('tab-hover', tab, event)
}

const handleTabLeave = () => {
  emit('tab-leave')
}

const handleTabClose = (tabId: number) => {
  PerformanceMonitor.start('tab-close', { tabId })
  emit('tab-close', tabId)
  PerformanceMonitor.end('tab-close')
}

const handleToggleSelect = (tabId: number) => {
  emit('toggle-select', tabId)
}

// Scroll to specific tab (for keyboard navigation)
const scrollToTab = async (tabId: number) => {
  if (props.tabs.length <= virtualThreshold) return

  const index = props.tabs.findIndex(tab => tab.id === tabId)
  if (index !== -1 && virtualListRef.value) {
    await nextTick()
    virtualListRef.value.scrollToIndex(index)
  }
}

// Expose methods
defineExpose({
  scrollToTab
})
</script>

<style scoped>
.optimized-tab-list {
  position: relative;
  height: 100%;
}

.performance-info {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
  display: flex;
  gap: 4px;
  align-items: center;
}

.searching {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.tab-virtual-list {
  height: 100%;
}

.virtual-tab-item {
  border-bottom: 1px solid var(--border-primary);
}

.tab-regular-list {
  height: 100%;
  overflow-y: auto;
}

.tab-list-item {
  opacity: 0;
  animation: fadeInUp 0.3s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transition animations */
.tab-list-enter-active,
.tab-list-leave-active {
  transition: all 0.3s ease;
}

.tab-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.tab-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.tab-list-move {
  transition: transform 0.3s ease;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  gap: 12px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-primary);
  border-top: 2px solid var(--text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.clear-search-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: var(--bg-hover);
}
</style>