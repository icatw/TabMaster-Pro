<template>
  <header class="app-header">
    <div class="header-left">
      <img class="logo" src="/src/assets/icons/icon-16.png" alt="Logo" />
      <div class="header-info">
        <h1 class="title">{{ $t('app.title') }}</h1>
        <div class="stats-line">
          {{ statsText }}
        </div>
      </div>
    </div>

    <div class="header-right">
      <!-- 自动排序开关 -->
      <button
        class="auto-sort-btn"
        :class="{ active: autoSortEnabled }"
        @click="handleToggleAutoSort"
        :title="autoSortEnabled ? $t('header.autoSortEnabled') : $t('header.autoSortDisabled')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.854 8.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 1 1-.708.708L7.5 9.207V13.5a.5.5 0 0 1-1 0V9.207l-1.646 1.647z"/>
        </svg>
      </button>

      <!-- 语言切换按钮 -->
      <button
        class="language-btn"
        @click="handleLanguageToggle"
        :title="$t('header.toggleLanguage')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.545 6.714L4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286H4.545zM5.77 5L5.44 4.009h-.019L5.09 5H4.6l.25-.755h.988L6.09 5H5.77z"/>
          <path d="M0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v3.5a.5.5 0 0 1-1 0V2z"/>
          <path d="M9.5 14a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-5z"/>
        </svg>
        <span class="language-text">{{ currentLanguage }}</span>
      </button>

      <!-- 主题切换按钮 -->
      <button
        class="theme-btn"
        @click="$emit('toggle-theme')"
        :title="$t('header.toggleTheme')"
      >
        <!-- 太阳图标（浅色模式） -->
        <svg v-if="!isDark" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
        </svg>
        <!-- 月亮图标（深色模式） -->
        <svg v-else viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/>
        </svg>
      </button>

      <!-- 设置按钮 -->
      <button class="settings-btn" @click="handleOpenSettings" :title="$t('header.openSettings')">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentLocale, setLocale, getSupportedLocales } from '@/i18n'
import { useI18n } from 'vue-i18n'

// Props定义
interface Props {
  stats: {
    tabCount: number
    groupCount: number
  }
  autoSortEnabled: boolean
  isDark?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

// Emits定义
const emit = defineEmits<{
  'toggle-auto-sort': []
  'toggle-theme': []
  'open-settings': []
}>()

// 统计文本
const statsText = computed(() => {
  const tabCount = props.stats?.tabCount || 0
  const groupCount = props.stats?.groupCount || 0
  const currentLocale = getCurrentLocale()

  if (currentLocale === 'zh-CN') {
    return `${tabCount} 个标签 · ${groupCount} 个分组`
  } else {
    return `${tabCount} tabs · ${groupCount} groups`
  }
})

// 语言切换逻辑
const currentLanguage = computed(() => {
  const locale = getCurrentLocale()
  const supportedLocales = getSupportedLocales()
  return supportedLocales.find(l => l.value === locale)?.nativeLabel || 'CN'
})

const handleLanguageToggle = () => {
  const currentLocale = getCurrentLocale()
  const newLocale = currentLocale === 'zh-CN' ? 'en-US' : 'zh-CN'
  setLocale(newLocale)
}

// 方法
const handleToggleAutoSort = () => {
  emit('toggle-auto-sort')
}

const handleOpenSettings = () => {
  emit('open-settings')
}
</script>

<style scoped>
/* 头部样式 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  width: 24px;
  height: 24px;
  color: #4a90e2;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.stats-line {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--text-tertiary);
}

.stat-divider {
  margin: 0 4px;
}

.header-right {
  display: flex;
  gap: 6px;
}

.auto-sort-btn,
.language-btn,
.theme-btn,
.settings-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.auto-sort-btn:hover,
.language-btn:hover,
.theme-btn:hover,
.settings-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.auto-sort-btn.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.auto-sort-btn svg,
.language-btn svg,
.theme-btn svg,
.settings-btn svg {
  width: 14px;
  height: 14px;
}

/* 语言按钮特殊样式 */
.language-btn {
  width: auto;
  min-width: 28px;
  padding: 0 8px;
  gap: 4px;
}

.language-text {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
</style>