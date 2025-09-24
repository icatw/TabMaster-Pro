<template>
  <div 
    v-if="visible && tabInfo" 
    ref="hoverDetailsRef"
    class="tab-hover-details"
    :style="adjustedPosition"
  >
    <div class="hover-details-header">
      <img 
        v-if="tabInfo.favIconUrl" 
        :src="tabInfo.favIconUrl" 
        class="hover-favicon"
        @error="handleFaviconError"
      />
      <div class="hover-title">{{ tabInfo.title }}</div>
    </div>
    
    <div class="hover-details-content">
      <div class="detail-item">
        <span class="detail-label">URL:</span>
        <span class="detail-value">{{ tabInfo.url }}</span>
      </div>
      
      <div class="detail-item">
        <span class="detail-label">域名:</span>
        <span class="detail-value">{{ tabInfo.domain }}</span>
      </div>
      
      <div class="detail-item">
        <span class="detail-label">状态:</span>
        <span class="detail-value">
          <span v-if="tabInfo.active" class="status-active">活跃</span>
          <span v-else-if="tabInfo.status === 'loading'" class="status-loading">加载中</span>
          <span v-else class="status-inactive">非活跃</span>
        </span>
      </div>
      
      <div v-if="tabInfo.pinned" class="detail-item">
        <span class="detail-label">固定:</span>
        <span class="detail-value status-pinned">已固定</span>
      </div>
      
      <div v-if="tabInfo.audible" class="detail-item">
        <span class="detail-label">音频:</span>
        <span class="detail-value status-audio">有声音</span>
      </div>
      
      <div v-if="tabInfo.mutedInfo?.muted" class="detail-item">
        <span class="detail-label">静音:</span>
        <span class="detail-value status-muted">已静音</span>
      </div>
      
      <!-- 内存信息显示已移除，因为 chrome.processes API 在稳定版中不可用 -->
      
      <div v-if="tabInfo.loadTime" class="detail-item">
        <span class="detail-label">加载时间:</span>
        <span class="detail-value">{{ formatLoadTime(tabInfo.loadTime) }}</span>
      </div>
      
      <div v-if="tabInfo.thumbnailCachedAt" class="detail-item">
        <span class="detail-label">缩略图缓存:</span>
        <span class="detail-value">{{ formatCacheTime(tabInfo.thumbnailCachedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { TabInfo } from '../../shared/types'

interface Props {
  visible: boolean
  tabInfo: TabInfo | null
  position: { x: number; y: number }
}

const props = defineProps<Props>()
const hoverDetailsRef = ref<HTMLElement>()

// 计算调整后的位置，确保不超出popup边界
const adjustedPosition = computed(() => {
  if (!props.visible || !hoverDetailsRef.value) {
    return { left: props.position.x + 'px', top: props.position.y + 'px' }
  }

  const popup = document.querySelector('.popup-container')
  if (!popup) {
    return { left: props.position.x + 'px', top: props.position.y + 'px' }
  }

  const popupRect = popup.getBoundingClientRect()
  const detailsRect = hoverDetailsRef.value.getBoundingClientRect()
  
  let x = props.position.x
  let y = props.position.y
  
  // 检查右边界
  if (x + detailsRect.width > popupRect.right) {
    x = popupRect.right - detailsRect.width - 10
  }
  
  // 检查左边界
  if (x < popupRect.left) {
    x = popupRect.left + 10
  }
  
  // 检查下边界
  if (y + detailsRect.height > popupRect.bottom) {
    y = props.position.y - detailsRect.height - 10
  }
  
  // 检查上边界
  if (y < popupRect.top) {
    y = popupRect.top + 10
  }
  
  return { left: x + 'px', top: y + 'px' }
})

// 监听位置变化，重新计算
watch(() => props.position, () => {
  nextTick(() => {
    // 触发重新计算
  })
}, { deep: true })

const handleFaviconError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// 内存格式化方法已移除，因为内存显示功能已被移除

const formatLoadTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatCacheTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}
</script>

<style scoped>
.tab-hover-details {
  position: fixed;
  z-index: 1000;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 10px;
  min-width: 240px;
  max-width: 280px;
  font-size: 11px;
  pointer-events: none;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hover-details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-secondary);
}

.hover-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 2px;
}

.hover-title {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-details-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
  min-width: 60px;
}

.detail-value {
  color: var(--text-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.status-active {
  color: var(--success-color);
  font-weight: 500;
}

.status-loading {
  color: var(--warning-color);
  font-weight: 500;
}

.status-inactive {
  color: var(--text-secondary);
}

.status-pinned {
  color: var(--info-color);
  font-weight: 500;
}

.status-audio {
  color: var(--danger-color);
  font-weight: 500;
}

.status-muted {
  color: var(--text-tertiary);
  font-weight: 500;
}

/* 深色模式适配已通过 CSS 变量实现 */
</style>