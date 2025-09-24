<template>
  <div
    class="tab-item"
    :class="{
      'selected': props.isSelected && props.isMultiSelect,
      'multi-select-mode': props.isMultiSelect,
      'keyboard-active': props.isKeyboardActive
    }"
    :data-nav-id="props.navId"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleTabClick"
  >
    <div class="tab-item-content">
    <!-- 多选框 -->
    <div v-if="props.isMultiSelect" class="checkbox-wrapper">
      <input
        type="checkbox"
        class="tab-checkbox"
        :checked="props.isSelected"
        @click.stop
        @change="$emit('toggle-select')"
      />
      <div class="checkbox-indicator">
        <svg v-if="props.isSelected" class="check-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </div>
    </div>

    <!-- 图标 -->
    <img
      :src="props.tab.favIconUrl || defaultIcon"
      class="tab-icon"
      @error="handleIconError"
    />

    <!-- 标签信息 -->
    <div class="tab-info">
      <div class="tab-title" :title="props.tab.title">{{ props.tab.title }}</div>
      <div class="tab-url" :title="props.tab.url">{{ props.tab.domain }}</div>
    </div>

    <!-- 状态指示器 -->
    <div class="tab-indicators">
      <span v-if="props.tab.audible" class="indicator audio" :title="$t('tabs.audible')">🔊</span>
      <span v-if="props.tab.pinned" class="indicator pinned" :title="$t('tabs.pinned')">📌</span>
    </div>

    <!-- 关闭按钮 -->
    <button
      class="close-btn"
      @click.stop="$emit('close')"
      :title="$t('tabs.close')"
    >
      ×
    </button>
    </div>
    
    <!-- 选中状态指示条 -->
    <div v-if="props.isSelected && props.isMultiSelect" class="selection-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import type { TabInfo } from '@/shared/types'

interface Props {
  tab: TabInfo
  isMultiSelect?: boolean
  isSelected?: boolean
  inGroup?: boolean
  isKeyboardActive?: boolean
  navId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isMultiSelect: false,
  isSelected: false,
  inGroup: false,
  isKeyboardActive: false
})

const emit = defineEmits<{
  'toggle-select': []
  'close': []
  'hover': [event: MouseEvent]
  'leave': []
  'click': [event: MouseEvent]
}>()

const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRDNi4zNDMxNSA0IDUgNS4zNDMxNSA1IDdDNSA4LjY1Njg1IDYuMzQzMTUgMTAgOCAxMEM5LjY1Njg1IDEwIDExIDguNjU2ODUgMTEgN0MxMSA1LjM0MzE1IDkuNjU2ODUgNCA4IDRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='

const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultIcon
}

const handleMouseEnter = (event: MouseEvent) => {
  emit('hover', event)
}

const handleMouseLeave = () => {
  emit('leave')
}

const handleTabClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.tab-item {
  position: relative;
  background: var(--bg-primary);
  border-radius: 6px;
  margin: 2px 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  overflow: hidden;
}

.tab-item:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 键盘导航高亮样式 */
.tab-item.keyboard-active {
  background: var(--primary-light);
  border: 2px solid var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
  transform: translateY(-1px);
  position: relative;
  z-index: 1;
}

.tab-item.keyboard-active .tab-title {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-item.keyboard-active .tab-url {
  color: var(--primary-hover);
}

/* 黑夜模式下加强键盘导航效果 */
[data-theme="dark"] .tab-item.keyboard-active {
  background: rgba(106, 176, 143, 0.2);
  border-color: #7fc0a0;
  box-shadow:
    0 0 0 1px rgba(127, 192, 160, 0.5),
    0 2px 8px rgba(106, 176, 143, 0.3),
    inset 0 0 0 1px rgba(127, 192, 160, 0.2);
}

[data-theme="dark"] .tab-item.keyboard-active .tab-title {
  color: #e8f5f0;
  text-shadow: 0 0 8px rgba(106, 176, 143, 0.5);
}

[data-theme="dark"] .tab-item.keyboard-active .tab-url {
  color: #b0d4c0;
}

/* 加强左侧指示条 */
.tab-item.keyboard-active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, var(--primary-color), var(--primary-hover));
  border-radius: 0 2px 2px 0;
  animation: pulseGlow 1.5s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 多选模式下的样式 */
.tab-item.multi-select-mode {
  cursor: pointer;
  border: 1px solid var(--border-primary);
}

.tab-item.multi-select-mode:hover {
  border-color: #4a90e2;
  background: #f8faff;
}

/* 选中状态样式 - 与整体UI协调的低饱和度设计 */
.tab-item.selected {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4f8 100%);
  border: 2px solid #e2e8f0;
  box-shadow: 
    0 0 0 1px rgba(148, 163, 184, 0.1),
    0 2px 8px rgba(148, 163, 184, 0.15);
  transform: translateY(-1px);
  position: relative;
}

.tab-item.selected::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(45deg, #f1f5f9, #e2e8f0);
  border-radius: 7px;
  z-index: -1;
  opacity: 0.6;
}

.tab-item.selected:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
  box-shadow: 
    0 0 0 1px rgba(148, 163, 184, 0.2),
    0 4px 12px rgba(148, 163, 184, 0.2);
  transform: translateY(-2px);
}

.tab-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  position: relative;
  z-index: 1;
}

/* 自定义复选框样式 */
.checkbox-wrapper {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.tab-checkbox {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 2;
}

.checkbox-indicator {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.tab-item.selected .checkbox-indicator {
  background: linear-gradient(135deg, #5b9c7a 0%, #345454 100%);
  border: 2px solid #345454;
  transform: scale(1.1);
  box-shadow:
    0 0 0 1px rgba(52, 84, 84, 0.1),
    0 2px 4px rgba(52, 84, 84, 0.2);
}

.check-icon {
  width: 12px;
  height: 12px;
  color: white;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.tab-item.selected .check-icon {
  opacity: 1;
  transform: scale(1);
  color: #ffffff;
  font-weight: 600;
}

.tab-icon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.tab-item.selected .tab-icon {
  transform: scale(1.05);
}

.tab-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tab-title {
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  transition: color 0.2s ease;
}

.tab-item.selected .tab-title {
  color: #1e293b;
  font-weight: 600;
  text-shadow: none;
  letter-spacing: 0;
}

.tab-url {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.tab-item.selected .tab-url {
  color: #64748b;
  font-weight: 500;
  text-shadow: none;
}

.tab-indicators {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.indicator {
  font-size: 11px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.tab-item.selected .indicator {
  opacity: 1;
}

.close-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s;
  flex-shrink: 0;
}

.tab-item-content:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.tab-item.selected .close-btn {
  color: #64748b;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
}

.tab-item.selected .close-btn:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.2);
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.2);
  transform: none;
}

/* 选中状态指示条 - 协调的低饱和度设计 */
.selection-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #5b9c7a 0%, #345454 100%);
  border-radius: 0 2px 2px 0;
  animation: slideInSubtle 0.3s ease-out;
  box-shadow:
    1px 0 3px rgba(91, 156, 122, 0.2);
}

@keyframes slideInSubtle {
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: 4px;
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 4px;
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .tab-item-content {
    padding: 6px 8px;
    gap: 6px;
  }
  
  .checkbox-wrapper {
    width: 16px;
    height: 16px;
  }
  
  .checkbox-indicator {
    width: 16px;
    height: 16px;
  }
  
  .check-icon {
    width: 10px;
    height: 10px;
  }
  
  .tab-title {
    font-size: 11px;
  }
  
  .tab-url {
    font-size: 9px;
  }
}

/* 高对比度模式支持 - 协调的增强显示 */
@media (prefers-contrast: high) {
  .tab-item.selected {
    border-width: 3px;
    background: #f8faff;
    color: #1e293b;
    box-shadow: 
      0 0 0 2px #64748b,
      0 4px 12px rgba(100, 116, 139, 0.3);
  }
  
  .checkbox-indicator {
    border-width: 3px;
  }
  
  .tab-item.selected .checkbox-indicator {
    background: #334155;
    border-color: #1e293b;
  }
  
  .tab-item.selected .tab-title {
    color: #0f172a;
    font-weight: 700;
  }
  
  .tab-item.selected .tab-url {
    color: #334155;
    font-weight: 600;
  }
  
  .selection-indicator {
    background: #334155;
    width: 6px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .tab-item,
  .checkbox-indicator,
  .check-icon,
  .tab-icon,
  .tab-title,
  .tab-url,
  .indicator {
    transition: none;
  }
  
  .selection-indicator {
    animation: none;
  }
}
</style>