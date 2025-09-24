import type { SortRule, SortOptions, TabInfo, SortResult, TabMoveOperation, BatchOperationResult } from '../types'
import { SORT_RULES, PERFORMANCE_CONFIG } from '../constants'
import { ThumbnailService } from '../services/ThumbnailService'

/**
 * 标签管理服务
 * 处理标签的查询、排序和移动操作
 */
export class TabService {
  /**
   * 获取当前窗口的所有标签
   * @param windowId 窗口ID，不传则获取当前活动窗口
   * @param includeThumbnails 是否包含缩略图
   * @returns Promise<TabInfo[]> 标签信息数组
   */
  static async getAllTabs(windowId?: number, includeThumbnails: boolean = false): Promise<TabInfo[]> {
    try {
      const queryOptions: chrome.tabs.QueryInfo = windowId
        ? { windowId }
        : { currentWindow: true }

      const tabs = await chrome.tabs.query(queryOptions)
      let tabInfos = tabs.map(tab => this.transformTab(tab))

      // 如果需要缩略图，则获取缩略图
      if (includeThumbnails) {
        const thumbnailService = ThumbnailService.getInstance()
        tabInfos = await thumbnailService.getThumbnails(tabInfos)
      }

      return tabInfos
    } catch (error) {
      console.error('Failed to get tabs:', error)
      return []
    }
  }

  /**
   * 获取活动标签
   * @returns Promise<TabInfo | null> 活动标签信息
   */
  static async getActiveTab(): Promise<TabInfo | null> {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      return activeTab ? this.transformTab(activeTab) : null
    } catch (error) {
      console.error('Failed to get active tab:', error)
      return null
    }
  }

  /**
   * 根据配置排序标签
   * @param tabs 要排序的标签数组
   * @param options 排序选项
   * @returns SortResult 排序结果
   */
  static sortTabs(tabs: TabInfo[], options: SortOptions): SortResult {
    const startTime = performance.now()
    
    try {
      const sortedTabs = [...tabs].sort((a, b) => {
        return this.compareTabsByRule(a, b, options.rule, options.ascending)
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return {
        success: true,
        tabs: sortedTabs,
        originalCount: tabs.length,
        sortedCount: sortedTabs.length,
        rule: options.rule,
        ascending: options.ascending,
        duration
      }
    } catch (error) {
      console.error('Failed to sort tabs:', error)
      return {
        success: false,
        tabs: tabs,
        originalCount: tabs.length,
        sortedCount: tabs.length,
        rule: options.rule,
        ascending: options.ascending,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : '排序失败'
      }
    }
  }

  /**
   * 应用标签排序到浏览器
   * @param sortResult 排序结果
   * @returns Promise<BatchOperationResult> 批量操作结果
   */
  static async applySorting(sortResult: SortResult): Promise<BatchOperationResult> {
    if (!sortResult.success) {
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: [sortResult.error || '排序结果无效']
      }
    }

    const operations: TabMoveOperation[] = []
    const errors: string[] = []
    let successfulOperations = 0

    try {
      // 批量移动标签
      for (let i = 0; i < sortResult.tabs.length; i++) {
        const tab = sortResult.tabs[i]
        const targetIndex = i
        
        if (tab.index !== targetIndex) {
          operations.push({
            tabId: tab.id,
            fromIndex: tab.index,
            toIndex: targetIndex
          })
        }
      }

      // 执行移动操作
      for (const operation of operations) {
        try {
          await chrome.tabs.move(operation.tabId, { index: operation.toIndex })
          successfulOperations++
        } catch (error) {
          const errorMsg = `移动标签 ${operation.tabId} 失败: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return {
        success: errors.length === 0,
        totalOperations: operations.length,
        successfulOperations,
        failedOperations: operations.length - successfulOperations,
        errors: errors.length > 0 ? errors : undefined,
        operations
      }
    } catch (error) {
      console.error('Failed to apply sorting:', error)
      return {
        success: false,
        totalOperations: operations.length,
        successfulOperations,
        failedOperations: operations.length - successfulOperations,
        errors: [error instanceof Error ? error.message : '应用排序失败']
      }
    }
  }

  /**
   * 一键排序当前窗口标签
   * @param options 排序选项
   * @returns Promise<BatchOperationResult> 操作结果
   */
  static async sortCurrentWindow(options: SortOptions): Promise<BatchOperationResult> {
    try {
      const tabs = await this.getAllTabs()
      const sortResult = this.sortTabs(tabs, options)
      return await this.applySorting(sortResult)
    } catch (error) {
      console.error('Failed to sort current window:', error)
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: [error instanceof Error ? error.message : '排序当前窗口失败']
      }
    }
  }

  /**
   * 获取标签统计信息
   * @returns Promise<object> 统计信息
   */
  static async getTabStats(): Promise<{
    totalTabs: number
    pinnedTabs: number
    groupedTabs: number
    ungroupedTabs: number
    domains: string[]
    uniqueDomains: number
  }> {
    try {
      const tabs = await this.getAllTabs()
      const domains = tabs.map(tab => this.extractDomain(tab.url)).filter(Boolean)
      const uniqueDomains = [...new Set(domains)]
      
      return {
        totalTabs: tabs.length,
        pinnedTabs: tabs.filter(tab => tab.pinned).length,
        groupedTabs: tabs.filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).length,
        ungroupedTabs: tabs.filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE).length,
        domains,
        uniqueDomains: uniqueDomains.length
      }
    } catch (error) {
      console.error('Failed to get tab stats:', error)
      return {
        totalTabs: 0,
        pinnedTabs: 0,
        groupedTabs: 0,
        ungroupedTabs: 0,
        domains: [],
        uniqueDomains: 0
      }
    }
  }

  /**
   * 搜索标签
   * @param query 搜索关键词
   * @param tabs 要搜索的标签数组，不传则搜索所有标签
   * @returns Promise<TabInfo[]> 匹配的标签
   */
  static async searchTabs(query: string, tabs?: TabInfo[]): Promise<TabInfo[]> {
    try {
      const allTabs = tabs || await this.getAllTabs()
      const lowerQuery = query.toLowerCase()
      
      return allTabs.filter(tab => {
        const title = tab.title?.toLowerCase() || ''
        const url = tab.url?.toLowerCase() || ''
        const domain = this.extractDomain(tab.url)?.toLowerCase() || ''
        
        return title.includes(lowerQuery) || 
               url.includes(lowerQuery) || 
               domain.includes(lowerQuery)
      })
    } catch (error) {
      console.error('Failed to search tabs:', error)
      return []
    }
  }

  /**
   * 尝试使用performance.memory获取内存信息
   * @param tabInfos 标签信息数组
   */
  // 内存获取方法已移除，因为在稳定版 Chrome 中 processes API 不可用

  /**
   * 转换 Chrome Tab 对象为 TabInfo
   * @param tab Chrome Tab 对象
   * @returns TabInfo 标签信息
   */
  private static transformTab(tab: chrome.tabs.Tab): TabInfo {
    return {
      id: tab.id!,
      index: tab.index,
      windowId: tab.windowId,
      title: tab.title || '',
      url: tab.url || '',
      domain: this.extractDomain(tab.url || ''),
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned,
      active: tab.active,
      highlighted: tab.highlighted,
      incognito: tab.incognito,
      selected: tab.selected || false,
      discarded: tab.discarded || false,
      autoDiscardable: tab.autoDiscardable || false,
      groupId: tab.groupId || chrome.tabGroups.TAB_GROUP_ID_NONE,
      lastAccessed: tab.active ? Date.now() : (Date.now() - (tab.index * 1000)), // 活动标签页使用当前时间，其他根据位置估算
      status: tab.status as 'loading' | 'complete' | undefined,
      audible: tab.audible,
      mutedInfo: tab.mutedInfo,
      // 缩略图相关字段初始化为空，后续通过ThumbnailService填充
      thumbnailUrl: undefined,
      thumbnailCachedAt: undefined,
      // 其他详细信息字段
      loadTime: undefined
    }
  }

  /**
   * 从 URL 提取域名
   * @param url URL 字符串
   * @returns string 域名
   */
  private static extractDomain(url: string): string {
    try {
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        return url.split('://')[0] || 'unknown'
      }
      
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return 'unknown'
    }
  }

  /**
   * 根据规则比较两个标签
   * @param a 标签A
   * @param b 标签B
   * @param rule 排序规则
   * @param ascending 是否升序
   * @returns number 比较结果
   */
  private static compareTabsByRule(
    a: TabInfo, 
    b: TabInfo, 
    rule: SortRule, 
    ascending: boolean
  ): number {
    let result = 0
    
    switch (rule) {
      case SORT_RULES.DOMAIN:
        result = (a.domain || '').localeCompare(b.domain || '')
        break
        
      case SORT_RULES.TITLE:
        result = (a.title || '').localeCompare(b.title || '')
        break
        
      case SORT_RULES.URL:
        result = (a.url || '').localeCompare(b.url || '')
        break
        
      case SORT_RULES.LAST_ACCESSED:
        result = (a.lastAccessed || 0) - (b.lastAccessed || 0)
        break
        
      case SORT_RULES.INDEX:
        result = a.index - b.index
        break
        
      default:
        result = 0
    }
    
    return ascending ? result : -result
  }

  /**
   * 关闭标签
   * @param tabIds 要关闭的标签ID数组
   * @returns Promise<BatchOperationResult> 操作结果
   */
  static async closeTabs(tabIds: number[]): Promise<BatchOperationResult> {
    const errors: string[] = []
    let successfulOperations = 0

    try {
      for (const tabId of tabIds) {
        try {
          await chrome.tabs.remove(tabId)
          successfulOperations++
        } catch (error) {
          const errorMsg = `关闭标签 ${tabId} 失败: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return {
        success: errors.length === 0,
        totalOperations: tabIds.length,
        successfulOperations,
        failedOperations: tabIds.length - successfulOperations,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('Failed to close tabs:', error)
      return {
        success: false,
        totalOperations: tabIds.length,
        successfulOperations,
        failedOperations: tabIds.length - successfulOperations,
        errors: [error instanceof Error ? error.message : '关闭标签失败']
      }
    }
  }

  /**
   * 激活标签
   * @param tabId 标签ID
   * @returns Promise<boolean> 是否成功
   */
  static async activateTab(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.update(tabId, { active: true })
      return true
    } catch (error) {
      console.error('Failed to activate tab:', error)
      return false
    }
  }
}

// 导出便捷方法
export const {
  getAllTabs,
  getActiveTab,
  sortTabs,
  applySorting,
  sortCurrentWindow,
  getTabStats,
  searchTabs,
  closeTabs,
  activateTab
} = TabService