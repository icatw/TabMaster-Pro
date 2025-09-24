/**
 * 书签搜索工具
 */

export interface BookmarkInfo {
  id: string
  title: string
  url?: string
  dateAdded?: number
  parentId?: string
  index?: number
  children?: BookmarkInfo[]
  isFolder?: boolean
}

/**
 * 搜索书签
 * @param query 搜索关键词
 * @param limit 最大返回数量
 * @returns 匹配的书签列表
 */
export async function searchBookmarks(query: string, limit = 20): Promise<BookmarkInfo[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    // 使用 Chrome bookmarks API 搜索
    const results = await chrome.bookmarks.search(query)

    // 过滤掉文件夹，只保留有 URL 的书签，并限制数量
    const bookmarks = results
      .filter(item => item.url)
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        dateAdded: item.dateAdded,
        parentId: item.parentId,
        index: item.index,
        isFolder: false
      }))

    return bookmarks
  } catch (error) {
    console.error('Failed to search bookmarks:', error)
    return []
  }
}

/**
 * 获取书签的完整路径（面包屑）
 * @param bookmarkId 书签ID
 * @returns 路径数组
 */
export async function getBookmarkPath(bookmarkId: string): Promise<string[]> {
  const path: string[] = []
  let currentId = bookmarkId

  try {
    while (currentId) {
      const bookmarks = await chrome.bookmarks.get(currentId)
      if (bookmarks.length > 0) {
        const bookmark = bookmarks[0]
        if (bookmark.title) {
          path.unshift(bookmark.title)
        }
        currentId = bookmark.parentId || ''

        // 避免根节点
        if (currentId === '0') {
          break
        }
      } else {
        break
      }
    }
  } catch (error) {
    console.error('Failed to get bookmark path:', error)
  }

  return path
}

/**
 * 获取书签的父文件夹名称
 * @param parentId 父文件夹ID
 * @returns 文件夹名称
 */
export async function getBookmarkFolderName(parentId?: string): Promise<string> {
  if (!parentId || parentId === '0') {
    return '书签栏'
  }

  try {
    const folders = await chrome.bookmarks.get(parentId)
    if (folders.length > 0) {
      return folders[0].title || '未知文件夹'
    }
  } catch (error) {
    console.error('Failed to get bookmark folder:', error)
  }

  return '未知文件夹'
}

/**
 * 打开书签
 * @param url 书签URL
 * @param newTab 是否在新标签页打开
 */
export async function openBookmark(url: string, newTab = true): Promise<void> {
  if (!url) return

  try {
    if (newTab) {
      await chrome.tabs.create({ url })
    } else {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (activeTab?.id) {
        await chrome.tabs.update(activeTab.id, { url })
      }
    }
  } catch (error) {
    console.error('Failed to open bookmark:', error)
  }
}

/**
 * 获取常用书签（根据访问频率）
 * @param limit 限制数量
 * @returns 常用书签列表
 */
export async function getFrequentBookmarks(limit = 10): Promise<BookmarkInfo[]> {
  try {
    // 获取所有书签
    const tree = await chrome.bookmarks.getTree()
    const allBookmarks: BookmarkInfo[] = []

    // 递归遍历书签树
    const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
      for (const node of nodes) {
        if (node.url) {
          allBookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            dateAdded: node.dateAdded,
            parentId: node.parentId,
            index: node.index,
            isFolder: false
          })
        }
        if (node.children) {
          traverse(node.children)
        }
      }
    }

    traverse(tree)

    // 按添加时间排序（最近添加的优先）
    return allBookmarks
      .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to get frequent bookmarks:', error)
    return []
  }
}