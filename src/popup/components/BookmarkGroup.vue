<template>
  <div class="bookmark-group" :style="{ '--group-color': groupColor }">
    <!-- 分组标题 -->
    <div class="group-header">
      <div class="group-header-content">
        <svg
          class="collapse-icon"
          :class="{ collapsed: isCollapsed }"
          viewBox="0 0 16 16"
          fill="currentColor"
          @click="toggleCollapse"
        >
          <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>
        </svg>
        
        <div class="group-icon">
          <!-- 文件夹图标 -->
          <svg v-if="groupType === 'folder'" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z"/>
          </svg>
          <!-- 域名图标 -->
          <svg v-else-if="groupType === 'domain'" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
          </svg>
          <!-- 最近访问图标 -->
          <svg v-else-if="groupType === 'recent'" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
          </svg>
          <!-- 常用图标 -->
          <svg v-else viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
          </svg>
        </div>

        <span class="group-title">{{ groupName }}</span>
        <span class="group-count">{{ bookmarks.length }}</span>

        <!-- 分组操作按钮 -->
        <div class="group-actions">
          <button
            class="group-action-btn"
            @click="openAllBookmarks"
            title="打开所有书签"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
              <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分组内的书签 -->
    <div v-if="!isCollapsed" class="group-bookmarks">
      <BookmarkItem
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        :bookmark="bookmark"
        :is-keyboard-active="isBookmarkActive(bookmark)"
        :nav-id="`bookmark-${bookmark.id}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BookmarkItem from './BookmarkItem.vue'
import type { BookmarkInfo } from '@/shared/utils/bookmarks'
import { openBookmark } from '@/shared/utils/bookmarks'

// Props
interface Props {
  groupName: string
  bookmarks: BookmarkInfo[]
  groupType: 'domain' | 'folder' | 'recent' | 'frequent'
  collapsed?: boolean
  keyboardNavIndex?: number
  keyboardNavItems?: Array<{type: 'bookmark' | 'tab', data: any, id: string}>
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  keyboardNavIndex: -1
})

// Emits
const emit = defineEmits<{
  toggleCollapse: [groupName: string, collapsed: boolean]
}>()

// 状态
const isCollapsed = ref(props.collapsed)

// 方法
const isBookmarkActive = (bookmark: BookmarkInfo) => {
  if (props.keyboardNavIndex === -1 || !props.keyboardNavItems) return false
  const currentItem = props.keyboardNavItems[props.keyboardNavIndex]
  return currentItem?.id === `bookmark-${bookmark.id}`
}

// 计算属性
const groupColor = computed(() => {
  // 根据分组类型返回不同颜色（更柔和的配色）
  const colors = {
    domain: '91, 156, 122',     // 绿色 - 域名分组
    folder: '100, 116, 139',    // 灰蓝色 - 文件夹分组
    recent: '147, 197, 253',    // 浅蓝色 - 最近书签
    frequent: '251, 146, 60'    // 橙色 - 常用书签
  }
  return colors[props.groupType] || colors.folder
})

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggleCollapse', props.groupName, isCollapsed.value)
}

const openAllBookmarks = async () => {
  try {
    // 限制同时打开的书签数量，避免浏览器卡顿
    const maxTabs = 10
    const bookmarksToOpen = props.bookmarks.slice(0, maxTabs)
    
    for (const bookmark of bookmarksToOpen) {
      if (bookmark.url) {
        await openBookmark(bookmark.url, true)
      }
    }
    
    if (props.bookmarks.length > maxTabs) {
      console.warn(`只打开了前 ${maxTabs} 个书签，共有 ${props.bookmarks.length} 个书签`)
    }
  } catch (error) {
    console.error('Failed to open bookmarks:', error)
  }
}
</script>

<style scoped>
/* 分组样式 */
.bookmark-group {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
}

.group-header-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 10px;
  user-select: none;
  transition: all 0.15s;
  cursor: pointer;
}

.group-header-content:hover {
  background: var(--bg-hover);
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

.group-icon {
  width: 18px;
  height: 18px;
  color: rgb(var(--group-color));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.group-icon svg {
  width: 14px;
  height: 14px;
}

.group-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.group-count {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-secondary);
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
  background: rgba(var(--group-color), 0.1);
  color: rgb(var(--group-color));
}

.group-action-btn svg {
  width: 12px;
  height: 12px;
}

/* 分组内容 */
.group-bookmarks {
  padding: 0 12px 8px 32px;
  position: relative;
}

/* 更好的视觉层级 */
.group-bookmarks::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border-secondary);
  opacity: 0.5;
}
</style>