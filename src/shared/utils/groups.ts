import type { GroupOptions, GroupResult, GroupInfo, TabInfo, BatchOperationResult } from '../types'
import { TAB_GROUP_COLORS, PERFORMANCE_CONFIG } from '../constants'

/**
 * 标签分组服务
 * 处理标签分组的创建、管理和颜色设置
 */
export class GroupService {
  /**
   * 获取当前窗口的所有分组
   * @param windowId 窗口ID，不传则获取当前活动窗口
   * @returns Promise<GroupInfo[]> 分组信息数组
   */
  static async getAllGroups(windowId?: number): Promise<GroupInfo[]> {
    try {
      const queryOptions = windowId ? { windowId } : {}
      const groups = await chrome.tabGroups.query(queryOptions)
      
      const groupsWithInfo: GroupInfo[] = []
      
      for (const group of groups) {
        const tabs = await chrome.tabs.query({ groupId: group.id })
        const domains = [...new Set(tabs.map(tab => this.extractDomain(tab.url || '')))]
        
        groupsWithInfo.push({
          ...group,
          tabCount: tabs.length,
          domains
        })
      }
      
      return groupsWithInfo
    } catch (error) {
      console.error('Failed to get groups:', error)
      return []
    }
  }

  /**
   * 按域名自动分组标签
   * @param tabs 要分组的标签数组
   * @param options 分组选项
   * @returns Promise<GroupResult> 分组结果
   */
  static async groupTabsByDomain(
    tabs: TabInfo[], 
    options: GroupOptions = {}
  ): Promise<GroupResult> {
    const startTime = performance.now()
    
    try {
      // 统计已分组和未分组的标签页
      const groupedTabs = tabs.filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
      const ungroupedTabs = tabs.filter(tab => !tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE)
      
      // 按域名分组标签
      const domainGroups = this.groupTabsByDomainLogic(tabs, options)
      const newGroupsCount = Object.keys(domainGroups).length
      
      // 如果没有可分组的标签页，返回相应信息
      if (newGroupsCount === 0) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        let message = ''
        if (groupedTabs.length > 0 && ungroupedTabs.length === 0) {
          message = '所有标签页已经分组完成'
        } else if (ungroupedTabs.length > 0) {
          message = `需要至少 ${options.minTabsPerGroup || 2} 个相同域名的标签页才能创建分组`
        } else {
          message = '没有可分组的标签页'
        }
        
        return {
          success: true,
          groupCount: 0,
          tabCount: tabs.length,
          duration,
          message,
          alreadyGroupedCount: groupedTabs.length
        }
      }
      
      // 应用分组到浏览器
      const result = await this.applyGrouping(domainGroups, options)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return {
        success: result.success,
        groupCount: newGroupsCount,
        tabCount: tabs.length,
        duration,
        alreadyGroupedCount: groupedTabs.length,
        error: result.success ? undefined : '分组应用失败'
      }
    } catch (error) {
      console.error('Failed to group tabs by domain:', error)
      return {
        success: false,
        groupCount: 0,
        tabCount: tabs.length,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : '分组失败'
      }
    }
  }

  /**
   * 创建新的标签分组
   * @param tabIds 要分组的标签ID数组
   * @param title 分组标题
   * @param color 分组颜色
   * @returns Promise<number | null> 分组ID，失败返回null
   */
  static async createGroup(
    tabIds: number[],
    title?: string,
    color?: chrome.tabGroups.ColorEnum
  ): Promise<number | null> {
    try {
      if (tabIds.length === 0) {
        throw new Error('至少需要一个标签来创建分组')
      }

      // 创建分组
      const groupId = await chrome.tabs.group({ tabIds })

      // 设置分组属性
      const updateProperties: chrome.tabGroups.UpdateProperties = {}
      if (title) updateProperties.title = title
      if (color) updateProperties.color = color

      if (Object.keys(updateProperties).length > 0) {
        await chrome.tabGroups.update(groupId, updateProperties)
      }

      return groupId
    } catch (error) {
      console.error('Failed to create group:', error)
      return null
    }
  }

  /**
   * 更新分组属性
   * @param groupId 分组ID
   * @param properties 要更新的属性
   * @returns Promise<boolean> 是否成功
   */
  static async updateGroup(
    groupId: number, 
    properties: chrome.tabGroups.UpdateProperties
  ): Promise<boolean> {
    try {
      await chrome.tabGroups.update(groupId, properties)
      return true
    } catch (error) {
      console.error('Failed to update group:', error)
      return false
    }
  }

  /**
   * 解散分组
   * @param groupId 分组ID
   * @returns Promise<boolean> 是否成功
   */
  static async ungroupTabs(groupId: number): Promise<boolean> {
    try {
      const tabs = await chrome.tabs.query({ groupId })
      const tabIds = tabs.map(tab => tab.id!)
      
      if (tabIds.length > 0) {
        await chrome.tabs.ungroup(tabIds)
      }
      
      return true
    } catch (error) {
      console.error('Failed to ungroup tabs:', error)
      return false
    }
  }

  /**
   * 取消当前窗口的所有分组
   * @param windowId 窗口ID，默认为当前窗口
   * @returns Promise<BatchOperationResult> 操作结果
   */
  static async ungroupAllTabs(windowId?: number): Promise<BatchOperationResult> {
    const startTime = performance.now()
    const errors: string[] = []
    let successfulOperations = 0
    
    try {
      const groups = await this.getAllGroups(windowId)
      const totalOperations = groups.length
      
      if (totalOperations === 0) {
        return {
          success: true,
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          message: '当前窗口没有分组需要取消'
        }
      }
      
      for (const group of groups) {
        try {
          const success = await this.ungroupTabs(group.id)
          if (success) {
            successfulOperations++
          } else {
            errors.push(`取消分组 "${group.title || group.id}" 失败`)
          }
        } catch (error) {
          const errorMsg = `取消分组 "${group.title || group.id}" 失败: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }
      
      const duration = performance.now() - startTime
      
      return {
        success: errors.length === 0,
        totalOperations,
        successfulOperations,
        failedOperations: totalOperations - successfulOperations,
        errors: errors.length > 0 ? errors : undefined,
        message: successfulOperations > 0 ? `已取消 ${successfulOperations} 个分组` : undefined,
        duration
      }
    } catch (error) {
      console.error('Failed to ungroup all tabs:', error)
      return {
        success: false,
        totalOperations: 0,
        successfulOperations,
        failedOperations: 0,
        errors: [error instanceof Error ? error.message : '取消分组失败'],
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 关闭整个分组
   * @param groupId 分组ID
   * @returns Promise<BatchOperationResult> 操作结果
   */
  static async closeGroup(groupId: number): Promise<BatchOperationResult> {
    try {
      const tabs = await chrome.tabs.query({ groupId })
      const tabIds = tabs.map(tab => tab.id!)
      
      const errors: string[] = []
      let successfulOperations = 0
      
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
      console.error('Failed to close group:', error)
      return {
        success: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: [error instanceof Error ? error.message : '关闭分组失败']
      }
    }
  }

  /**
   * 获取分组统计信息
   * @returns Promise<object> 统计信息
   */
  static async getGroupStats(): Promise<{
    totalGroups: number
    totalGroupedTabs: number
    averageTabsPerGroup: number
    groupsByColor: Record<string, number>
    largestGroup: { id: number; title: string; tabCount: number } | null
  }> {
    try {
      // 添加小延迟确保分组状态完全更新
      await new Promise(resolve => setTimeout(resolve, 50))
      const groups = await this.getAllGroups()
      const groupsByColor: Record<string, number> = {}
      let largestGroup: { id: number; title: string; tabCount: number } | null = null
      
      let totalGroupedTabs = 0
      
      for (const group of groups) {
        totalGroupedTabs += group.tabCount || 0
        
        // 统计颜色分布
        const color = group.color || 'grey'
        groupsByColor[color] = (groupsByColor[color] || 0) + 1
        
        // 找到最大的分组
        if (!largestGroup || (group.tabCount || 0) > largestGroup.tabCount) {
          largestGroup = {
            id: group.id,
            title: group.title || '未命名分组',
            tabCount: group.tabCount || 0
          }
        }
      }
      
      return {
        totalGroups: groups.length,
        totalGroupedTabs,
        averageTabsPerGroup: groups.length > 0 ? Math.round(totalGroupedTabs / groups.length) : 0,
        groupsByColor,
        largestGroup
      }
    } catch (error) {
      console.error('Failed to get group stats:', error)
      return {
        totalGroups: 0,
        totalGroupedTabs: 0,
        averageTabsPerGroup: 0,
        groupsByColor: {},
        largestGroup: null
      }
    }
  }

  /**
   * 自动为分组选择颜色
   * @param domain 域名
   * @param existingColors 已使用的颜色
   * @returns chrome.tabGroups.ColorEnum 颜色
   */
  static selectGroupColor(
    domain: string, 
    existingColors: chrome.tabGroups.ColorEnum[] = []
  ): chrome.tabGroups.ColorEnum {
    // 基于域名哈希选择颜色
    const hash = this.hashString(domain)
    const availableColors = TAB_GROUP_COLORS.filter(color => !existingColors.includes(color as chrome.tabGroups.ColorEnum))
    
    if (availableColors.length === 0) {
      // 如果所有颜色都被使用，回到完整列表
      return TAB_GROUP_COLORS[hash % TAB_GROUP_COLORS.length] as chrome.tabGroups.ColorEnum
    }
    
    return availableColors[hash % availableColors.length] as chrome.tabGroups.ColorEnum
  }

  /**
   * 按域名逻辑分组标签
   * @param tabs 标签数组
   * @param options 分组选项
   * @returns Record<string, TabInfo[]> 域名分组映射
   */
  private static groupTabsByDomainLogic(
    tabs: TabInfo[], 
    options: GroupOptions
  ): Record<string, TabInfo[]> {
    const domainGroups: Record<string, TabInfo[]> = {}
    const minTabsPerGroup = options.minTabsPerGroup || 2
    
    // 按域名分组
    for (const tab of tabs) {
      // 跳过已分组和固定的标签
      if (tab.pinned || tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        continue
      }
      
      const domain = tab.domain || 'unknown'
      
      if (!domainGroups[domain]) {
        domainGroups[domain] = []
      }
      
      domainGroups[domain].push(tab)
    }
    
    // 过滤掉标签数量不足的分组
    const filteredGroups: Record<string, TabInfo[]> = {}
    for (const [domain, groupTabs] of Object.entries(domainGroups)) {
      if (groupTabs.length >= minTabsPerGroup) {
        filteredGroups[domain] = groupTabs
      }
    }
    
    return filteredGroups
  }

  /**
   * 应用分组到浏览器
   * @param domainGroups 域名分组映射
   * @param options 分组选项
   * @returns Promise<BatchOperationResult> 操作结果
   */
  private static async applyGrouping(
    domainGroups: Record<string, TabInfo[]>, 
    options: GroupOptions
  ): Promise<BatchOperationResult> {
    const errors: string[] = []
    let successfulOperations = 0
    const totalOperations = Object.keys(domainGroups).length
    
    try {
      const existingColors: chrome.tabGroups.ColorEnum[] = []
      
      for (const [domain, tabs] of Object.entries(domainGroups)) {
        try {
          const tabIds = tabs.map(tab => tab.id)
          const color = this.selectGroupColor(domain, existingColors)
          existingColors.push(color)
          
          const groupId = await this.createGroup(tabIds, domain, color)
          
          if (groupId) {
            successfulOperations++
          } else {
            errors.push(`创建 ${domain} 分组失败`)
          }
        } catch (error) {
          const errorMsg = `处理 ${domain} 分组失败: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return {
        success: errors.length === 0,
        totalOperations,
        successfulOperations,
        failedOperations: totalOperations - successfulOperations,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('Failed to apply grouping:', error)
      return {
        success: false,
        totalOperations,
        successfulOperations,
        failedOperations: totalOperations - successfulOperations,
        errors: [error instanceof Error ? error.message : '应用分组失败']
      }
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
   * 字符串哈希函数
   * @param str 字符串
   * @returns number 哈希值
   */
  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash)
  }
}

// 导出便捷方法
export const {
  getAllGroups,
  groupTabsByDomain,
  createGroup,
  updateGroup,
  ungroupTabs,
  ungroupAllTabs,
  closeGroup,
  getGroupStats,
  selectGroupColor
} = GroupService