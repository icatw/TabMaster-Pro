import { ref, computed } from 'vue'
import type { APIResponse } from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'

export function useTabStats() {
  // 统计信息
  const stats = ref({
    tabCount: 0,
    groupCount: 0
  })

  // 计算属性
  const hasGroups = computed(() => stats.value.groupCount > 0)

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response: APIResponse = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.GET_STATS
      })

      if (response.success && response.data) {
        // 解析后端返回的复杂统计数据
        const { tabs: tabStats, groups: groupStats } = response.data

        stats.value = {
          tabCount: tabStats?.totalTabs || 0,
          groupCount: groupStats?.totalGroups || 0
        }
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
      // 设置默认值以防出错
      stats.value = { tabCount: 0, groupCount: 0 }
    }
  }

  return {
    // 状态
    stats,

    // 计算属性
    hasGroups,

    // 方法
    loadStats
  }
}