import { ref, computed, type Ref } from 'vue'
import { searchBookmarks, type BookmarkInfo } from '@/shared/utils/bookmarks'
import type { BookmarkGroup } from '@/shared/utils/bookmarkGrouping'
import { smartGroupBookmarks, getGroupDisplayName } from '@/shared/utils/bookmarkGrouping'

interface UseBookmarkSearchOptions {
  searchQuery: Ref<string>
}

export function useBookmarkSearch(options: UseBookmarkSearchOptions) {
  const { searchQuery } = options

  // 状态管理
  const bookmarkResults = ref<BookmarkInfo[]>([])
  const bookmarkGroups = ref<BookmarkGroup[]>([])
  const isSearchingBookmarks = ref(false)
  const showAllBookmarks = ref(false)
  const collapsedBookmarkGroups = ref<Set<string>>(new Set())

  // 计算属性
  const displayedBookmarkGroups = computed(() => {
    if (showAllBookmarks.value || bookmarkGroups.value.length <= 3) {
      return bookmarkGroups.value
    }
    return bookmarkGroups.value.slice(0, 3)
  })

  const hasMoreGroups = computed(() => {
    return bookmarkGroups.value.length > 3
  })

  const hiddenGroupsCount = computed(() => {
    return Math.max(0, bookmarkGroups.value.length - 3)
  })

  // 搜索书签
  const searchBookmarksAsync = async (query?: string) => {
    // 使用传入的query或当前的searchQuery
    const searchTerm = query !== undefined ? query : searchQuery.value
    if (query !== undefined) {
      searchQuery.value = query
    }

    if (searchTerm.trim().length >= 2) {
      isSearchingBookmarks.value = true
      try {
        const results = await searchBookmarks(searchTerm)
        bookmarkResults.value = results

        // 对书签进行文件夹分组
        if (results.length > 0) {
          bookmarkGroups.value = await smartGroupBookmarks(results, 'folder')
        } else {
          bookmarkGroups.value = []
        }
      } catch (error) {
        console.error('Bookmark search failed:', error)
        bookmarkResults.value = []
        bookmarkGroups.value = []
      } finally {
        isSearchingBookmarks.value = false
      }
    } else {
      bookmarkResults.value = []
      bookmarkGroups.value = []
    }
  }

  // 清除搜索
  const clearBookmarkSearch = () => {
    bookmarkResults.value = []
    bookmarkGroups.value = []
    showAllBookmarks.value = false
    collapsedBookmarkGroups.value.clear()
  }

  // 处理书签分组的展开/收起
  const handleBookmarkGroupCollapse = (groupName: string, collapsed: boolean) => {
    if (collapsed) {
      collapsedBookmarkGroups.value.add(groupName)
    } else {
      collapsedBookmarkGroups.value.delete(groupName)
    }
  }

  // 展开所有分组
  const expandAllGroups = () => {
    showAllBookmarks.value = true
  }

  // 收起多余分组
  const collapseGroups = () => {
    showAllBookmarks.value = false
  }

  // 判断分组是否收起
  const isGroupCollapsed = (groupName: string) => {
    return collapsedBookmarkGroups.value.has(groupName)
  }

  // 打开所有书签（分组内）
  const openAllBookmarksInGroup = async (group: BookmarkGroup) => {
    try {
      // 限制同时打开的书签数量，避免浏览器卡顿
      const maxTabs = 10
      const bookmarksToOpen = group.bookmarks.slice(0, maxTabs)

      for (const bookmark of bookmarksToOpen) {
        if (bookmark.url) {
          await chrome.tabs.create({ url: bookmark.url })
        }
      }

      if (group.bookmarks.length > maxTabs) {
        console.warn(`只打开了前 ${maxTabs} 个书签，共有 ${group.bookmarks.length} 个书签`)
      }
    } catch (error) {
      console.error('Failed to open bookmarks:', error)
      throw error
    }
  }

  // 获取分组的可见书签
  const getVisibleBookmarks = () => {
    const visibleBookmarks: BookmarkInfo[] = []
    const visibleGroups = showAllBookmarks.value ? bookmarkGroups.value : displayedBookmarkGroups.value

    visibleGroups.forEach(group => {
      if (!collapsedBookmarkGroups.value.has(group.name)) {
        visibleBookmarks.push(...group.bookmarks)
      }
    })

    return visibleBookmarks
  }

  return {
    // 状态
    bookmarkResults,
    bookmarkGroups,
    isSearchingBookmarks,
    showAllBookmarks,
    collapsedBookmarkGroups,

    // 计算属性
    displayedBookmarkGroups,
    hasMoreGroups,
    hiddenGroupsCount,

    // 方法
    searchBookmarksAsync,
    clearBookmarkSearch,
    handleBookmarkGroupCollapse,
    expandAllGroups,
    collapseGroups,
    isGroupCollapsed,
    openAllBookmarksInGroup,
    getVisibleBookmarks,
    getGroupDisplayName
  }
}