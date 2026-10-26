import type { GroupOptions, GroupResult, GroupInfo, TabInfo, BatchOperationResult } from '../types'
import { TAB_GROUP_COLORS } from '../constants'
import { SavedTabsService } from '../services/SavedTabsService'

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash &= hash
  }
  return Math.abs(hash)
}

export function chooseGroupColor(
  domain: string,
  existingColors: chrome.tabGroups.ColorEnum[] = [],
  options: GroupOptions = {}
): chrome.tabGroups.ColorEnum {
  const strategy = options.colorStrategy ?? 'auto'
  if (strategy === 'manual') {
    return options.manualColor ?? 'blue'
  }

  if (strategy === 'random') {
    const randomIndex = Math.floor(Math.random() * TAB_GROUP_COLORS.length)
    return TAB_GROUP_COLORS[randomIndex]
  }

  const usage = new Map<chrome.tabGroups.ColorEnum, number>()
  for (const color of TAB_GROUP_COLORS) {
    usage.set(color, existingColors.filter(existing => existing === color).length)
  }
  const minimumUsage = Math.min(...usage.values())
  const leastUsedColors = TAB_GROUP_COLORS.filter(color => usage.get(color) === minimumUsage)
  return leastUsedColors[hashString(domain) % leastUsedColors.length]
}

export function planDomainGroups(
  tabs: TabInfo[],
  options: GroupOptions,
  maxNewGroups: number
): Record<string, TabInfo[]> {
  if (maxNewGroups <= 0) return {}

  const minimumSize = Math.max(2, options.minTabsPerGroup ?? 2)
  const groupedByDomain = new Map<string, TabInfo[]>()

  for (const tab of tabs) {
    if (tab.pinned || tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) continue
    const domain = tab.domain || 'unknown'
    const existing = groupedByDomain.get(domain) ?? []
    existing.push(tab)
    groupedByDomain.set(domain, existing)
  }

  return Object.fromEntries(
    [...groupedByDomain.entries()]
      .filter(([, domainTabs]) => domainTabs.length >= minimumSize)
      .sort(([domainA, tabsA], [domainB, tabsB]) =>
        tabsB.length - tabsA.length || domainA.localeCompare(domainB)
      )
      .slice(0, maxNewGroups)
  )
}

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

      const windowId = tabs[0]?.windowId
      const existingGroups = await this.getAllGroups(windowId)
      const maxGroupsPerWindow = Math.max(1, options.maxGroupsPerWindow ?? 10)
      const availableSlots = Math.max(0, maxGroupsPerWindow - existingGroups.length)
      const domainGroups = planDomainGroups(tabs, options, availableSlots)
      const newGroupsCount = Object.keys(domainGroups).length

      // 如果没有可分组的标签页，返回相应信息
      if (newGroupsCount === 0) {
        const endTime = performance.now()
        const duration = endTime - startTime

        let message = ''
        if (groupedTabs.length > 0 && ungroupedTabs.length === 0) {
          message = '所有标签页已经分组完成'
        } else if (existingGroups.length >= maxGroupsPerWindow) {
          message = `当前窗口已达到 ${maxGroupsPerWindow} 个分组的上限`
        } else if (ungroupedTabs.length > 0) {
          message = `需要至少 ${Math.max(2, options.minTabsPerGroup ?? 2)} 个相同域名的标签页才能创建分组`
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
      const result = await this.applyGrouping(
        domainGroups,
        options,
        existingGroups.map(group => group.color)
      )

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
      const tabIds = tabs.flatMap(tab => tab.id === undefined ? [] : [tab.id])
      return SavedTabsService.saveAndCloseTabs(tabIds)
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
    existingColors: chrome.tabGroups.ColorEnum[] = [],
    options: GroupOptions = {}
  ): chrome.tabGroups.ColorEnum {
    return chooseGroupColor(domain, existingColors, options)
  }

  /**
   * 应用分组到浏览器
   * @param domainGroups 域名分组映射
   * @param options 分组选项
   * @returns Promise<BatchOperationResult> 操作结果
   */
  private static async applyGrouping(
    domainGroups: Record<string, TabInfo[]>,
    options: GroupOptions,
    existingColors: chrome.tabGroups.ColorEnum[] = []
  ): Promise<BatchOperationResult> {
    const errors: string[] = []
    let successfulOperations = 0
    const totalOperations = Object.keys(domainGroups).length

    try {
      const usedColors = [...existingColors]

      for (const [domain, tabs] of Object.entries(domainGroups)) {
        try {
          const tabIds = tabs.map(tab => tab.id)
          const color = this.selectGroupColor(domain, usedColors, options)
          usedColors.push(color)

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
