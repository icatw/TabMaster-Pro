<template>
  <footer class="toolbar">
    <!-- 排序按钮 -->
    <div class="tool-item">
      <button
        @click="handleToggleSortMenu"
        class="tool-btn"
        :class="{ active: showSortMenu }"
      >
        <svg class="tool-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z"/>
        </svg>
        <span class="tool-label">{{ $t('toolbar.sort') }}</span>
      </button>

      <!-- 排序菜单 -->
      <Transition name="menu">
        <div v-if="showSortMenu" class="tool-menu sort-menu">
          <button
            v-for="rule in sortRules"
            :key="rule.value"
            @click="handleSort(rule.value)"
            class="menu-item"
            :class="{ active: currentRule === rule.value }"
          >
            <span class="menu-icon">{{ rule.icon }}</span>
            <span class="menu-label">{{ rule.label }}</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- 分组按钮 -->
    <button
      @click="handleGroup"
      class="tool-btn"
      :disabled="hasGroups"
    >
      <svg class="tool-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v10a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 13V3z"/>
        <path fill="#fff" d="M5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z"/>
      </svg>
      <span class="tool-label">{{ $t('toolbar.group') }}</span>
    </button>

    <!-- 取消分组 -->
    <button
      v-if="hasGroups"
      @click="handleUngroup"
      class="tool-btn"
    >
      <svg class="tool-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
      </svg>
      <span class="tool-label">{{ $t('toolbar.ungroup') }}</span>
    </button>

    <!-- 批量操作 -->
    <button
      @click="handleToggleMultiSelect"
      class="tool-btn"
      :class="{ active: isMultiSelectMode }"
    >
      <svg class="tool-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
        <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z"/>
      </svg>
      <span class="tool-label">{{ $t('toolbar.multiSelect') }}</span>
    </button>
  </footer>
</template>

<script setup lang="ts">
import type { SortRule } from '@/shared/types'

// Props定义
interface Props {
  showSortMenu: boolean
  currentRule: SortRule
  hasGroups: boolean
  isMultiSelectMode: boolean
  sortRules: Array<{
    value: SortRule
    label: string
    icon: string
  }>
}

defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  'toggle-sort-menu': []
  'sort': [rule: SortRule]
  'group': []
  'ungroup': []
  'toggle-multi-select': []
}>()

// 方法
const handleToggleSortMenu = () => {
  emit('toggle-sort-menu')
}

const handleSort = (rule: SortRule) => {
  emit('sort', rule)
}

const handleGroup = () => {
  emit('group')
}

const handleUngroup = () => {
  emit('ungroup')
}

const handleToggleMultiSelect = () => {
  emit('toggle-multi-select')
}
</script>

<style scoped>
/* 底部工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 24px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary);
  flex-shrink: 0;
  z-index: 1000;
  overflow-x: auto;
  min-height: 48px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

/* 工具栏滚动条样式 */
.toolbar::-webkit-scrollbar {
  height: 4px;
}

.toolbar::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 2px;
}

.toolbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.tool-item {
  position: relative;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tool-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.active {
  background: var(--primary-light);
  color: var(--primary-color);
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-icon {
  width: 16px;
  height: 16px;
}

.tool-label {
  font-weight: 500;
}

/* 排序菜单 */
.tool-menu {
  position: fixed;
  bottom: 60px;
  left: 24px;
  margin-bottom: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 10000;
  min-width: 140px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.menu-item:first-child {
  border-radius: 8px 8px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 8px 8px;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
}

.menu-icon {
  font-size: 14px;
}

/* 过渡动画 */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>