/**
 * 书签分组工具
 */

import type { BookmarkInfo } from './bookmarks'

export interface BookmarkGroup {
  name: string
  type: 'domain' | 'folder' | 'recent' | 'frequent'
  bookmarks: BookmarkInfo[]
  count: number
}

/**
 * 从URL提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
}

/**
 * 按域名分组书签
 */
export function groupBookmarksByDomain(bookmarks: BookmarkInfo[]): BookmarkGroup[] {
  const domainMap = new Map<string, BookmarkInfo[]>()
  
  bookmarks.forEach(bookmark => {
    if (bookmark.url) {
      const domain = extractDomain(bookmark.url)
      if (!domainMap.has(domain)) {
        domainMap.set(domain, [])
      }
      domainMap.get(domain)!.push(bookmark)
    }
  })

  // 按书签数量排序，数量多的在前
  return Array.from(domainMap.entries())
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([domain, bookmarks]) => ({
      name: domain,
      type: 'domain' as const,
      bookmarks,
      count: bookmarks.length
    }))
}

/**
 * 按文件夹分组书签
 */
export async function groupBookmarksByFolder(bookmarks: BookmarkInfo[]): Promise<BookmarkGroup[]> {
  const folderMap = new Map<string, BookmarkInfo[]>()
  
  // 获取所有书签的文件夹信息
  for (const bookmark of bookmarks) {
    let folderName = '未分类'
    
    if (bookmark.parentId) {
      try {
        const folder = await chrome.bookmarks.get(bookmark.parentId)
        folderName = folder[0]?.title || '未分类'
        
        // 如果是书签栏，使用更友好的名称
        if (folderName === 'Bookmarks bar' || folderName === '书签栏') {
          folderName = '书签栏'
        }
      } catch (error) {
        console.warn('Failed to get folder info for bookmark:', bookmark.id, error)
        folderName = '未分类'
      }
    }
    
    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, [])
    }
    folderMap.get(folderName)!.push(bookmark)
  }

  // 按书签数量排序，书签栏优先显示
  return Array.from(folderMap.entries())
    .sort(([nameA, bookmarksA], [nameB, bookmarksB]) => {
      // 书签栏优先
      if (nameA === '书签栏') return -1
      if (nameB === '书签栏') return 1
      
      // 其他按数量排序
      return bookmarksB.length - bookmarksA.length
    })
    .map(([folderName, bookmarks]) => ({
      name: folderName,
      type: 'folder' as const,
      bookmarks,
      count: bookmarks.length
    }))
}

/**
 * 按时间分组书签（最近添加）
 */
export function groupBookmarksByTime(bookmarks: BookmarkInfo[]): BookmarkGroup[] {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const oneMonth = 30 * oneDay

  const groups: { [key: string]: BookmarkInfo[] } = {
    '今天': [],
    '本周': [],
    '本月': [],
    '更早': []
  }

  bookmarks.forEach(bookmark => {
    if (bookmark.dateAdded) {
      const timeDiff = now - bookmark.dateAdded
      
      if (timeDiff < oneDay) {
        groups['今天'].push(bookmark)
      } else if (timeDiff < oneWeek) {
        groups['本周'].push(bookmark)
      } else if (timeDiff < oneMonth) {
        groups['本月'].push(bookmark)
      } else {
        groups['更早'].push(bookmark)
      }
    } else {
      groups['更早'].push(bookmark)
    }
  })

  return Object.entries(groups)
    .filter(([, bookmarks]) => bookmarks.length > 0)
    .map(([name, bookmarks]) => ({
      name,
      type: 'recent' as const,
      bookmarks: bookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)),
      count: bookmarks.length
    }))
}

/**
 * 智能分组书签
 * 结合多种分组策略，提供最佳的组织方式
 */
export async function smartGroupBookmarks(
  bookmarks: BookmarkInfo[],
  strategy: 'domain' | 'folder' | 'time' | 'mixed' = 'mixed'
): Promise<BookmarkGroup[]> {
  if (bookmarks.length === 0) {
    return []
  }

  switch (strategy) {
    case 'domain':
      return groupBookmarksByDomain(bookmarks)
    
    case 'folder':
      return await groupBookmarksByFolder(bookmarks)
    
    case 'time':
      return groupBookmarksByTime(bookmarks)
    
    case 'mixed':
    default:
      // 混合策略：优先按域名分组，但如果某个域名书签太少，则合并到其他分组
      const domainGroups = groupBookmarksByDomain(bookmarks)
      const result: BookmarkGroup[] = []
      const miscBookmarks: BookmarkInfo[] = []

      domainGroups.forEach(group => {
        if (group.count >= 2) {
          // 如果域名下有2个或更多书签，单独成组
          result.push(group)
        } else {
          // 否则合并到杂项
          miscBookmarks.push(...group.bookmarks)
        }
      })

      // 如果有杂项书签，按时间分组
      if (miscBookmarks.length > 0) {
        const timeGroups = groupBookmarksByTime(miscBookmarks)
        result.push(...timeGroups)
      }

      return result
  }
}

/**
 * 获取分组的显示名称
 */
export function getGroupDisplayName(group: BookmarkGroup): string {
  switch (group.type) {
    case 'domain':
      return group.name
    case 'folder':
      // 为文件夹分组添加图标前缀
      if (group.name === '书签栏') {
        return `⭐ ${group.name}`
      } else if (group.name === '未分类') {
        return `📂 ${group.name}`
      } else {
        return `📁 ${group.name}`
      }
    case 'recent':
      return `🕒 ${group.name}`
    case 'frequent':
      return `⭐ ${group.name}`
    default:
      return group.name
  }
}

/**
 * 获取分组的描述信息
 */
export function getGroupDescription(group: BookmarkGroup): string {
  const countText = `${group.count} 个书签`
  
  switch (group.type) {
    case 'domain':
      return `来自 ${group.name} 的 ${countText}`
    case 'folder':
      return `文件夹中的 ${countText}`
    case 'recent':
      return `${group.name}添加的 ${countText}`
    case 'frequent':
      return `常用的 ${countText}`
    default:
      return countText
  }
}