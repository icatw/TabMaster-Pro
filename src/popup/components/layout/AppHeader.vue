<template>
  <header class="app-header">
    <div class="header-left">
      <img class="logo" src="/src/assets/icons/icon-16.png" alt="" />
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
        :aria-pressed="autoSortEnabled"
        :aria-label="autoSortEnabled ? $t('header.autoSortEnabled') : $t('header.autoSortDisabled')"
        :title="autoSortEnabled ? $t('header.autoSortEnabled') : $t('header.autoSortDisabled')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.854 8.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 1 1-.708.708L7.5 9.207V13.5a.5.5 0 0 1-1 0V9.207l-1.646 1.647z"
          />
        </svg>
      </button>

      <details ref="headerMenu" class="header-menu">
        <summary
          class="settings-btn"
          :aria-label="$t('header.moreOptions')"
          :title="$t('header.moreOptions')"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="8" r="1.25" />
            <circle cx="8" cy="8" r="1.25" />
            <circle cx="13" cy="8" r="1.25" />
          </svg>
        </summary>
        <div class="header-menu-panel">
          <button class="menu-action" type="button" @click="handleLanguageToggle">
            <span>{{ $t('header.toggleLanguage') }}</span>
            <span class="menu-value">{{ currentLanguage }}</span>
          </button>
          <button class="menu-action" type="button" @click="handleThemeToggle">
            {{ $t('header.toggleTheme') }}
          </button>
          <button class="menu-action" type="button" @click="handleOpenSettings">
            {{ $t('header.openSettings') }}
          </button>
        </div>
      </details>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCurrentLocale, setLocale, getSupportedLocales } from '@/i18n'

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
const headerMenu = ref<HTMLDetailsElement | null>(null)

const closeHeaderMenu = () => {
  if (headerMenu.value) headerMenu.value.open = false
}

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
  closeHeaderMenu()
}

// 方法
const handleToggleAutoSort = () => {
  emit('toggle-auto-sort')
}

const handleOpenSettings = () => {
  closeHeaderMenu()
  emit('open-settings')
}

const handleThemeToggle = () => {
  closeHeaderMenu()
  emit('toggle-theme')
}
</script>

<style scoped>
/* 头部样式 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 13px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.logo {
  width: 30px;
  height: 30px;
  padding: 4px;
  box-sizing: border-box;
  border: 1px solid var(--border-primary);
  border-radius: 9px;
  background: var(--bg-secondary);
  filter: grayscale(1) contrast(1.04);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
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
  gap: 4px;
  flex-shrink: 0;
}

.auto-sort-btn,
.settings-btn {
  min-width: 34px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    var(--transition-colors),
    transform 160ms ease;
}

.auto-sort-btn:hover,
.settings-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-primary);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.settings-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.auto-sort-btn.active {
  background: var(--primary-light);
  border-color: var(--border-primary);
  color: var(--primary-color);
}

.auto-sort-btn:active,
.settings-btn:active {
  transform: scale(0.94);
}

.auto-sort-btn svg,
.settings-btn svg {
  width: 14px;
  height: 14px;
}

.header-menu {
  position: relative;
}

.header-menu summary {
  list-style: none;
}

.header-menu summary::-webkit-details-marker {
  display: none;
}

.header-menu summary {
  cursor: pointer;
}

.header-menu-panel {
  position: absolute;
  z-index: 1100;
  inset-block-start: calc(100% + 8px);
  inset-inline-end: 0;
  display: grid;
  min-width: 176px;
  padding: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}

.menu-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  text-align: start;
  cursor: pointer;
}

.menu-action:hover {
  background: var(--bg-hover);
}

.menu-action:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: -2px;
}

.menu-value {
  color: var(--text-tertiary);
  font-size: 11px;
}

@media (max-width: 420px) {
  .app-header {
    gap: 8px;
    padding-inline: 12px;
  }

  .header-left {
    gap: 8px;
  }
}
</style>
