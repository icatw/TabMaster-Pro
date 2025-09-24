import { ref, computed, type Ref } from 'vue'
import type { TabInfo } from '@/shared/types'
import type { BookmarkInfo } from '@/shared/utils/bookmarks'
import { openBookmark } from '@/shared/utils/bookmarks'

interface NavigationItem {
  type: 'tab' | 'bookmark'
  data: TabInfo | BookmarkInfo
  id: string
}

interface UseKeyboardNavigationOptions {
  tabList: Ref<TabInfo[]>
  filteredTabs: Ref<TabInfo[]>
  bookmarkResults: Ref<BookmarkInfo[]>
  searchQuery: Ref<string>
  showToast: (message: string, type: 'success' | 'error') => void
  loadTabs: () => Promise<void>
  clearSearch: () => void
  getVisibleBookmarks?: () => BookmarkInfo[]
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    filteredTabs,
    bookmarkResults,
    searchQuery,
    showToast,
    loadTabs,
    clearSearch,
    getVisibleBookmarks
  } = options

  // State
  const keyboardNavIndex = ref(-1)
  const keyboardNavItems = ref<NavigationItem[]>([])

  // Computed
  const activeTab = computed(() => {
    if (keyboardNavIndex.value === -1 || !keyboardNavItems.value.length) return null
    const item = keyboardNavItems.value[keyboardNavIndex.value]
    if (item?.type === 'tab') {
      return item.data as TabInfo
    }
    return null
  })

  const activeBookmark = computed(() => {
    if (keyboardNavIndex.value === -1 || !keyboardNavItems.value.length) return null
    const item = keyboardNavItems.value[keyboardNavIndex.value]
    if (item?.type === 'bookmark') {
      return item.data as BookmarkInfo
    }
    return null
  })

  // Methods
  const updateKeyboardNavItems = () => {
    const items: NavigationItem[] = []

    // 搜索模式下同时显示书签和标签页
    if (searchQuery.value) {
      // 先添加书签结果
      if (bookmarkResults.value.length > 0) {
        const visibleBookmarks = getVisibleBookmarks ? getVisibleBookmarks() : bookmarkResults.value
        const bookmarkItems = visibleBookmarks.map(bookmark => ({
          type: 'bookmark' as const,
          data: bookmark,
          id: `bookmark-${bookmark.id}`
        }))
        items.push(...bookmarkItems)
      }

      // 再添加标签页结果
      if (filteredTabs.value.length > 0) {
        const tabItems = filteredTabs.value.map(tab => ({
          type: 'tab' as const,
          data: tab,
          id: `tab-${tab.id}`
        }))
        items.push(...tabItems)
      }
    } else {
      // 非搜索模式下只显示标签页
      if (filteredTabs.value.length > 0) {
        const tabItems = filteredTabs.value.map(tab => ({
          type: 'tab' as const,
          data: tab,
          id: `tab-${tab.id}`
        }))
        items.push(...tabItems)
      }
    }

    keyboardNavItems.value = items

    // 如果没有可导航项，重置索引
    if (items.length === 0) {
      keyboardNavIndex.value = -1
    }
  }

  const scrollToActiveItem = () => {
    // 不再修改，保持最简单的方法
    setTimeout(() => {
      if (keyboardNavIndex.value === -1 || !keyboardNavItems.value.length) return

      const currentItem = keyboardNavItems.value[keyboardNavIndex.value]
      if (!currentItem) return

      const element = document.querySelector(`[data-nav-id="${currentItem.id}"]`) as HTMLElement
      if (!element) return

      // 处理折叠的书签组
      const bookmarkGroup = element.closest('.bookmark-group')
      if (bookmarkGroup) {
        const groupContent = bookmarkGroup.querySelector('.group-bookmarks')
        if (groupContent && groupContent.clientHeight === 0) {
          const expandButton = bookmarkGroup.querySelector('.collapse-icon') as HTMLElement
          if (expandButton) {
            expandButton.click()
            setTimeout(() => scrollToActiveItem(), 300)
            return
          }
        }
      }

      // 使用原生 scrollIntoView，不再自定义
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, 0)
  }

  const handleArrowUp = () => {
    if (!keyboardNavItems.value.length) return

    const itemCount = keyboardNavItems.value.length
    const previousIndex = keyboardNavIndex.value

    if (keyboardNavIndex.value === -1 || keyboardNavIndex.value === 0) {
      keyboardNavIndex.value = itemCount - 1
    } else {
      keyboardNavIndex.value--
    }

    if (previousIndex !== keyboardNavIndex.value) {
      scrollToActiveItem()
    }
  }

  const handleArrowDown = () => {
    if (!keyboardNavItems.value.length) return

    const itemCount = keyboardNavItems.value.length
    const previousIndex = keyboardNavIndex.value

    if (keyboardNavIndex.value === -1) {
      keyboardNavIndex.value = 0
    } else if (keyboardNavIndex.value === itemCount - 1) {
      keyboardNavIndex.value = 0
    } else {
      keyboardNavIndex.value++
    }

    if (previousIndex !== keyboardNavIndex.value) {
      scrollToActiveItem()
    }
  }

  const handleEnter = async () => {
    if (keyboardNavIndex.value === -1 || !keyboardNavItems.value.length) return

    const currentItem = keyboardNavItems.value[keyboardNavIndex.value]
    if (!currentItem) return

    if (currentItem.type === 'tab') {
      const tab = currentItem.data as TabInfo
      await chrome.tabs.update(tab.id, { active: true })
      window.close()
    } else if (currentItem.type === 'bookmark') {
      const bookmark = currentItem.data as BookmarkInfo
      if (bookmark.url) {
        await openBookmark(bookmark.url, false)
        window.close()
      }
    }
  }

  const handleDelete = async () => {
    if (keyboardNavIndex.value === -1 || !keyboardNavItems.value.length) return

    const currentItem = keyboardNavItems.value[keyboardNavIndex.value]
    if (!currentItem || currentItem.type !== 'tab') return

    const tab = currentItem.data as TabInfo
    const tabTitle = tab.title.length > 30
      ? tab.title.substring(0, 30) + '...'
      : tab.title

    try {
      await chrome.tabs.remove(tab.id)
      await loadTabs()
      showToast(`已关闭标签页: ${tabTitle}`, 'success')

      if (keyboardNavIndex.value >= filteredTabs.value.length) {
        keyboardNavIndex.value = filteredTabs.value.length - 1
      }
    } catch (error) {
      console.error('关闭标签页失败:', error)
      showToast('关闭标签页失败', 'error')
    }
  }

  const handleEscape = () => {
    if (searchQuery.value) {
      clearSearch()
    } else {
      keyboardNavIndex.value = -1
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const isInputFocused = document.activeElement?.tagName === 'INPUT'

    if (isInputFocused) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleEnter()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleEscape()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleArrowUp()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleArrowDown()
      }
      return
    }

    switch(e.key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault()
        handleArrowUp()
        break
      case 'ArrowDown':
      case 'j':
        e.preventDefault()
        handleArrowDown()
        break
      case 'Enter':
        e.preventDefault()
        handleEnter()
        break
      case 'Delete':
      case 'Backspace':
        if (!isInputFocused) {
          e.preventDefault()
          handleDelete()
        }
        break
      case 'Escape':
        e.preventDefault()
        handleEscape()
        break
      case '/':
        if (!isInputFocused) {
          e.preventDefault()
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
          searchInput?.focus()
        }
        break
    }
  }

  const resetNavigation = () => {
    keyboardNavIndex.value = -1
    keyboardNavItems.value = []
  }

  return {
    keyboardNavIndex,
    keyboardNavItems,
    activeTab,
    activeBookmark,
    updateKeyboardNavItems,
    handleKeyDown,
    resetNavigation,
    scrollToActiveItem
  }
}