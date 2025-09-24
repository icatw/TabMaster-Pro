import { useDark, useToggle, usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

export function useTheme() {
  // 检测系统是否偏好暗色模式
  const prefersDark = usePreferredDark()

  // 创建响应式的暗色模式状态
  // 这会自动将状态持久化到 localStorage
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'tab-manager-theme',
    initialValue: 'auto', // 默认跟随系统
  })

  // 创建切换函数
  const toggleTheme = useToggle(isDark)

  // 设置特定主题的函数
  const setTheme = (mode: 'light' | 'dark' | 'auto') => {
    if (mode === 'auto') {
      isDark.value = prefersDark.value
    } else {
      isDark.value = mode === 'dark'
    }
  }

  // 主题模式：light | dark | auto
  const themeMode = computed(() => {
    if (isDark.value === undefined) return 'auto'
    return isDark.value ? 'dark' : 'light'
  })

  // 实际使用的主题（考虑自动模式）
  const actualTheme = computed(() => {
    if (themeMode.value === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return themeMode.value
  })

  // 主题配置
  const themeConfig = computed(() => {
    const isDarkTheme = actualTheme.value === 'dark'

    return {
      // 背景色
      bgPrimary: isDarkTheme ? '#1e1e1e' : '#ffffff',
      bgSecondary: isDarkTheme ? '#2d2d2d' : '#fafafa',
      bgTertiary: isDarkTheme ? '#3a3a3a' : '#f0f0f0',
      bgHover: isDarkTheme ? '#404040' : '#f8f9fa',

      // 文字颜色
      textPrimary: isDarkTheme ? '#f0f0f0' : '#333333',
      textSecondary: isDarkTheme ? '#c0c0c0' : '#666666',
      textTertiary: isDarkTheme ? '#a0a0a0' : '#999999',

      // 边框颜色
      borderPrimary: isDarkTheme ? '#505050' : '#e5e7eb',
      borderSecondary: isDarkTheme ? '#404040' : '#f0f0f0',

      // 主题色（绿色系）
      primaryColor: isDarkTheme ? '#6ab08f' : '#5b9c7a',
      primaryHover: isDarkTheme ? '#7fc0a0' : '#4a8c6a',
      primaryLight: isDarkTheme ? 'rgba(106, 176, 143, 0.2)' : 'rgba(91, 156, 122, 0.1)',

      // 键盘导航高亮色
      keyboardHighlight: isDarkTheme ? 'rgba(127, 192, 160, 0.35)' : 'rgba(91, 156, 122, 0.15)',
      keyboardBorder: isDarkTheme ? '#7fc0a0' : '#5b9c7a',
      keyboardGlow: isDarkTheme ? 'rgba(106, 176, 143, 0.4)' : 'rgba(91, 156, 122, 0.2)',

      // 辅助色
      successColor: isDarkTheme ? '#4ade80' : '#22c55e',
      warningColor: isDarkTheme ? '#fbbf24' : '#f59e0b',
      dangerColor: isDarkTheme ? '#f87171' : '#ef4444',
      infoColor: isDarkTheme ? '#60a5fa' : '#3b82f6',

      // 阴影
      shadowSm: isDarkTheme
        ? '0 1px 2px 0 rgba(0, 0, 0, 0.5)'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      shadowMd: isDarkTheme
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      shadowLg: isDarkTheme
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }
  })

  // 应用 CSS 变量到根元素
  watchEffect(() => {
    const root = document.documentElement
    const config = themeConfig.value

    // 设置 CSS 变量
    root.style.setProperty('--bg-primary', config.bgPrimary)
    root.style.setProperty('--bg-secondary', config.bgSecondary)
    root.style.setProperty('--bg-tertiary', config.bgTertiary)
    root.style.setProperty('--bg-hover', config.bgHover)

    root.style.setProperty('--text-primary', config.textPrimary)
    root.style.setProperty('--text-secondary', config.textSecondary)
    root.style.setProperty('--text-tertiary', config.textTertiary)

    root.style.setProperty('--border-primary', config.borderPrimary)
    root.style.setProperty('--border-secondary', config.borderSecondary)

    root.style.setProperty('--primary-color', config.primaryColor)
    root.style.setProperty('--primary-hover', config.primaryHover)
    root.style.setProperty('--primary-light', config.primaryLight)

    root.style.setProperty('--keyboard-highlight', config.keyboardHighlight)
    root.style.setProperty('--keyboard-border', config.keyboardBorder)
    root.style.setProperty('--keyboard-glow', config.keyboardGlow)

    root.style.setProperty('--success-color', config.successColor)
    root.style.setProperty('--warning-color', config.warningColor)
    root.style.setProperty('--danger-color', config.dangerColor)
    root.style.setProperty('--info-color', config.infoColor)

    root.style.setProperty('--shadow-sm', config.shadowSm)
    root.style.setProperty('--shadow-md', config.shadowMd)
    root.style.setProperty('--shadow-lg', config.shadowLg)
  })

  return {
    isDark,
    toggleTheme,
    setTheme,
    themeMode,
    actualTheme,
    themeConfig,
    prefersDark,
  }
}