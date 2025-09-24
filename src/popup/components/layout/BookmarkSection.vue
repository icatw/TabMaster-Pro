<template>
  <div v-if="searchQuery && bookmarkResults.length > 0" class="bookmark-results">
    <div class="results-header">
      <svg class="results-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
      </svg>
      <span class="results-title">{{ $t('bookmarks.searchResults') }}</span>
      <span class="results-count">{{ bookmarkResults.length }}</span>
    </div>

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
    <div v-if="displayedBookmarkGroups.length > 3 && !showAllBookmarks" class="expand-results">
      <button @click="showAllBookmarks = true" class="show-more-btn">
        <svg class="expand-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        <span>{{ $t('bookmarks.showMore', { count: displayedBookmarkGroups.length - 3 }) }}</span>
      </button>
    </div>

    <div v-if="displayedBookmarkGroups.length > 3 && showAllBookmarks" class="collapse-results">
      <button @click="showAllBookmarks = false" class="show-less-btn">
        <svg class="collapse-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        <span>{{ $t('bookmarks.showLess') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BookmarkGroup from '@/popup/components/BookmarkGroup.vue'
import type { BookmarkInfo } from '@/shared/utils/bookmarks'
import type { BookmarkGroup as BookmarkGroupData } from '@/shared/utils/bookmarkGrouping'

interface NavigationItem {
  type: 'tab' | 'bookmark'
  data: any
  id: string
}

interface Props {
  searchQuery: string
  bookmarkResults: BookmarkInfo[]
  bookmarkGroups: BookmarkGroupData[]
  displayedBookmarkGroups: BookmarkGroupData[]
  collapsedBookmarkGroups: Set<string>
  keyboardNavIndex: number
  navigableItems: NavigationItem[]
}

interface Emits {
  (e: 'toggle-collapse', groupName: string): void
  (e: 'update:showAllBookmarks', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const showAllBookmarks = ref(false)

const handleBookmarkGroupCollapse = (groupName: string) => {
  emit('toggle-collapse', groupName)
}

const getGroupDisplayName = (group: BookmarkGroupData) => {
  // 保持原有的显示名称逻辑
  return group.name
}
</script>

<style scoped>
.bookmark-results {
  margin-bottom: 24px;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid var(--border-primary);
}

.results-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.results-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.results-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--border-primary);
  min-width: 20px;
  text-align: center;
}

.bookmark-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expand-results, .collapse-results {
  display: flex;
  justify-content: center;
  margin-top: 12px;
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
</style>