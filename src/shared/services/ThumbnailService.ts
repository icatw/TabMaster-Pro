import type { TabInfo } from '../types'

/**
 * 缩略图服务 - 处理标签页截图的获取和缓存
 */
export class ThumbnailService {
  private static instance: ThumbnailService
  private thumbnailCache = new Map<number, { url: string; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 50 // 最大缓存数量

  private constructor() {}

  static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  /**
   * 获取标签页缩略图
   * @param tabId 标签页ID
   * @param windowId 窗口ID
   * @returns 缩略图URL或null
   */
  async getThumbnail(tabId: number, windowId: number): Promise<string | null> {
    try {
      // 检查缓存
      const cached = this.thumbnailCache.get(tabId)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.url
      }

      // 获取新的缩略图
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'jpeg',
        quality: 50 // 降低质量以减少内存占用
      })

      if (dataUrl) {
        // 更新缓存
        this.updateCache(tabId, dataUrl)
        return dataUrl
      }

      return null
    } catch (error) {
      console.warn(`Failed to capture thumbnail for tab ${tabId}:`, error)
      return null
    }
  }

  /**
   * 批量获取多个标签页的缩略图
   * @param tabs 标签页列表
   * @returns 更新后的标签页列表
   */
  async getThumbnails(tabs: TabInfo[]): Promise<TabInfo[]> {
    const updatedTabs = [...tabs]
    const activeTabsByWindow = new Map<number, TabInfo>()

    // 找出每个窗口的活跃标签页
    tabs.forEach(tab => {
      if (tab.active) {
        activeTabsByWindow.set(tab.windowId, tab)
      }
    })

    // 只为活跃标签页获取缩略图（因为captureVisibleTab只能截取可见标签页）
    for (const [windowId, activeTab] of activeTabsByWindow) {
      const thumbnailUrl = await this.getThumbnail(activeTab.id, windowId)
      if (thumbnailUrl) {
        const tabIndex = updatedTabs.findIndex(t => t.id === activeTab.id)
        if (tabIndex !== -1) {
          updatedTabs[tabIndex] = {
            ...updatedTabs[tabIndex],
            thumbnailUrl,
            thumbnailCachedAt: Date.now()
          }
        }
      }
    }

    return updatedTabs
  }

  /**
   * 更新缓存
   * @param tabId 标签页ID
   * @param url 缩略图URL
   */
  private updateCache(tabId: number, url: string): void {
    // 如果缓存已满，删除最旧的条目
    if (this.thumbnailCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.thumbnailCache.keys().next().value
      if (oldestKey !== undefined) {
        this.thumbnailCache.delete(oldestKey)
      }
    }

    this.thumbnailCache.set(tabId, {
      url,
      timestamp: Date.now()
    })
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now()
    for (const [tabId, cache] of this.thumbnailCache.entries()) {
      if (now - cache.timestamp > this.CACHE_DURATION) {
        this.thumbnailCache.delete(tabId)
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.thumbnailCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.thumbnailCache.size,
      maxSize: this.MAX_CACHE_SIZE
    }
  }
}

export default ThumbnailService