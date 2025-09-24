<template>
  <div class="tab-list">
    <!-- 批量操作栏 -->
    <div v-if="selectedIds.size > 0" class="batch-actions">
      <span class="selected-count">{{ selectedCountText }}</span>
      <div class="actions">
        <button class="batch-btn" @click="$emit('select-all')">{{ $t('selection.selectAll') }}</button>
        <button class="batch-btn" @click="$emit('clear-selection')">{{ $t('selection.clearSelection') }}</button>
        <button class="batch-btn danger" @click="$emit('batch-close')">{{ $t('selection.batchClose') }}</button>
        <button class="batch-btn" @click="$emit('batch-group')">{{ $t('selection.batchGroup') }}</button>
      </div>
    </div>

    <!-- 标签页列表 -->
    <div class="list-container" ref="listContainer">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- 标签列表内容 -->
      <template v-else>
        <!-- 分组的标签 -->
        <div v-for="group in groupedTabs.groups" :key="group.id" class="tab-group" :style="{ '--group-color': getGroupColor(group.color) }">
          <!-- 分组标题 -->
          <div class="group-header">
            <div class="group-header-content">
              <svg
                class="collapse-icon"
                :class="{ collapsed: collapsedGroups.has(group.id) }"
                viewBox="0 0 16 16"
                fill="currentColor"
                @click="toggleGroupCollapse(group.id)"
              >
                <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>
              </svg>
              <span class="group-indicator" :style="{ backgroundColor: getGroupColor(group.color) }"></span>

              <!-- 分组标题 - 可编辑 -->
              <input
                v-if="editingGroupId === group.id"
                v-model="editingGroupTitle"
                @keyup.enter="saveGroupTitle(group.id)"
                @keyup.esc="cancelEditGroupTitle"
                @blur="saveGroupTitle(group.id)"
                class="group-title-input"
                :placeholder="`分组 ${group.id}`"
                ref="titleInput"
              />
              <span
                v-else
                class="group-title"
                @dblclick="startEditGroupTitle(group)"
                :title="'双击重命名'"
              >
                {{ group.title || `分组 ${group.id}` }}
              </span>

              <span class="group-count">{{ group.tabs.length }}</span>

              <!-- 分组操作按钮 -->
              <div class="group-actions">
                <button
                  class="group-action-btn"
                  @click="startEditGroupTitle(group)"
                  title="重命名"
                  v-if="editingGroupId !== group.id"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146 0.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 分组内的标签 -->
          <div v-if="!collapsedGroups.has(group.id)" class="group-tabs">
            <TabItem
              v-for="tab in group.tabs"
              :key="tab.id"
              :tab="tab"
              :is-selected="selectedIds.has(tab.id)"
              :is-multi-select="isMultiSelect"
              :is-keyboard-active="isTabActive(tab)"
              :nav-id="`tab-${tab.id}`"
              :group-color="getGroupColor(group.color)"
              @hover="(e: MouseEvent) => $emit('hover', tab, e)"
              @leave="$emit('leave')"
              @click="(e: MouseEvent) => $emit('click', tab, e)"
              @close="$emit('close', tab.id)"
              @toggle-select="$emit('toggle-select', tab.id)"
            />
          </div>
        </div>

        <!-- 未分组的标签 -->
        <div v-if="groupedTabs.ungrouped.length > 0" class="ungrouped-section">
          <TabItem
            v-for="tab in groupedTabs.ungrouped"
            :key="tab.id"
            :tab="tab"
            :is-selected="selectedIds.has(tab.id)"
            :is-multi-select="isMultiSelect"
            :is-keyboard-active="isTabActive(tab)"
            :nav-id="`tab-${tab.id}`"
            @hover="(e: MouseEvent) => $emit('hover', tab, e)"
            @leave="$emit('leave')"
            @click="(e: MouseEvent) => $emit('click', tab, e)"
            @close="$emit('close', tab.id)"
            @toggle-select="$emit('toggle-select', tab.id)"
          />
        </div>

        <!-- 空状态 - 已在主App组件中处理 -->
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { TabInfo } from '@/shared/types'
import TabItem from './TabItem.vue'
import { getCurrentLocale } from '@/i18n'

// Props
interface Props {
  tabs: TabInfo[]
  tabGroups: Map<number, chrome.tabGroups.TabGroup>
  loading?: boolean
  activeFilters?: string[]
  selectedIds?: Set<number>
  isMultiSelect?: boolean
  searchQuery?: string
  keyboardNavIndex?: number
  keyboardNavItems?: Array<{type: 'bookmark' | 'tab', data: any, id: string}>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  activeFilters: () => ['all'],
  selectedIds: () => new Set(),
  isMultiSelect: false,
  searchQuery: '',
  keyboardNavIndex: -1
})

// Emits
const emit = defineEmits<{
  'refresh': []
  'hover': [tab: TabInfo, event: MouseEvent]
  'leave': []
  'click': [tab: TabInfo, event: MouseEvent]
  'close': [tabId: number]
  'toggle-select': [tabId: number]
  'select-all': []
  'clear-selection': []
  'batch-close': []
  'batch-group': []
}>()

// 分组折叠状态
const collapsedGroups = ref<Set<number>>(new Set())

// 编辑分组标题
const editingGroupId = ref<number | null>(null)
const editingGroupTitle = ref('')

// 分组接口
interface TabGroup {
  id: number
  title: string
  color: chrome.tabGroups.ColorEnum
  tabs: TabInfo[]
}

// 选择计数文本
const selectedCountText = computed(() => {
  const count = props.selectedIds.size
  const currentLocale = getCurrentLocale()

  if (currentLocale === 'zh-CN') {
    return `已选择 ${count} 个`
  } else {
    return `${count} selected`
  }
})

// 计算分组的标签页
const groupedTabs = computed(() => {
  const groups = new Map<number, TabGroup>()
  const ungrouped: TabInfo[] = []

  props.tabs.forEach(tab => {
    if (tab.groupId !== -1) {
      if (!groups.has(tab.groupId)) {
        const chromeGroup = props.tabGroups.get(tab.groupId)
        groups.set(tab.groupId, {
          id: tab.groupId,
          title: chromeGroup?.title || '',
          color: chromeGroup?.color || 'grey',
          tabs: []
        })
      }
      groups.get(tab.groupId)!.tabs.push(tab)
    } else {
      ungrouped.push(tab)
    }
  })

  return {
    groups: Array.from(groups.values()),
    ungrouped
  }
})

// 方法
const isTabActive = (tab: TabInfo) => {
  if (props.keyboardNavIndex === -1 || !props.keyboardNavItems) return false
  const currentItem = props.keyboardNavItems[props.keyboardNavIndex]
  return currentItem?.id === `tab-${tab.id}`
}

// 获取分组颜色
const getGroupColor = (color: chrome.tabGroups.ColorEnum) => {
  const colors: Record<chrome.tabGroups.ColorEnum, string> = {
    grey: '#5F6368',
    blue: '#1A73E8',
    red: '#EA4335',
    yellow: '#FBBC04',
    green: '#34A853',
    pink: '#FF6D93',
    purple: '#9E69AF',
    cyan: '#00BCD4',
    orange: '#FF9800'
  }
  return colors[color] || colors.grey
}

// 切换分组折叠状态
const toggleGroupCollapse = (groupId: number) => {
  const newCollapsed = new Set(collapsedGroups.value)
  if (newCollapsed.has(groupId)) {
    newCollapsed.delete(groupId)
  } else {
    newCollapsed.add(groupId)
  }
  collapsedGroups.value = newCollapsed
}

// 开始编辑分组标题
const startEditGroupTitle = async (group: TabGroup) => {
  editingGroupId.value = group.id
  editingGroupTitle.value = group.title || ''

  await nextTick()
  const input = document.querySelector('.group-title-input') as HTMLInputElement
  if (input) {
    input.focus()
    input.select()
  }
}

// 保存分组标题
const saveGroupTitle = async (groupId: number) => {
  if (editingGroupId.value !== groupId) return

  const newTitle = editingGroupTitle.value.trim()

  try {
    await chrome.tabGroups.update(groupId, { title: newTitle })
  } catch (error) {
    console.error('Failed to update group title:', error)
  }

  cancelEditGroupTitle()
}

// 取消编辑分组标题
const cancelEditGroupTitle = () => {
  editingGroupId.value = null
  editingGroupTitle.value = ''
}
</script>

<style scoped>
.tab-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--primary-light);
  border-bottom: 1px solid var(--border-primary);
  flex-shrink: 0;
}

.selected-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
}

.actions {
  display: flex;
  gap: 6px;
}

.batch-btn {
  padding: 4px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.batch-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-btn.danger {
  color: var(--danger-color);
  border-color: var(--danger-color);
  opacity: 0.8;
}

.batch-btn.danger:hover {
  background: var(--danger-color);
  color: var(--bg-primary);
  opacity: 1;
}

/* 列表容器 */
.list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  padding: 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分组样式 */
.tab-group {
  border-left: 3px solid var(--group-color);
  background: linear-gradient(90deg, rgba(var(--group-color), 0.05) 0%, transparent 100%);
  margin: 4px 0;
  border-radius: 4px;
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
}

.group-header-content {
  display: flex;
  align-items: center;
  padding: 8px 12px 8px 8px;
  gap: 8px;
  user-select: none;
  transition: all 0.15s;
}

.group-header-content:hover {
  background: rgba(74, 144, 226, 0.05);
}

.collapse-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: transform 0.2s;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: text;
}

.group-title-input {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
}

.group-count {
  padding: 2px 8px;
  background: var(--primary-color);
  border-radius: 10px;
  font-size: 11px;
  color: white;
  font-weight: 500;
}

.group-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.group-header-content:hover .group-actions {
  opacity: 1;
}

.group-action-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.group-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.group-action-btn svg {
  width: 12px;
  height: 12px;
}

.group-tabs {
  padding-left: 32px;
}

/* 未分组区域 */
.ungrouped-section {
  padding-top: 4px;
}

/* 滚动条样式 */
.list-container::-webkit-scrollbar {
  width: 6px;
}

.list-container::-webkit-scrollbar-track {
  background: transparent;
}

.list-container::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}

.list-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>