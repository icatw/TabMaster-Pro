import { usePreferredDark } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'
import type { ThemeMode } from '@/shared/types'

const THEME_MODE_STORAGE_KEY = 'tab-manager-theme-mode'
const LEGACY_THEME_STORAGE_KEY = 'tab-manager-theme'

function readStoredThemeMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'auto'

  const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY)
  if (storedMode === 'auto' || storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  const legacyMode = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
  return legacyMode === 'light' || legacyMode === 'dark' ? legacyMode : 'auto'
}

export function useTheme() {
  const prefersDark = usePreferredDark()
  const themeMode = ref<ThemeMode>(readStoredThemeMode())

  const actualTheme = computed<'light' | 'dark'>(() => {
    if (themeMode.value === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return themeMode.value
  })

  // Keep a writable compatibility facade for popup callers while preserving
  // the independent persisted mode used by the options page.
  const isDark = computed({
    get: () => actualTheme.value === 'dark',
    set: value => {
      themeMode.value = value ? 'dark' : 'light'
    }
  })

  watch(themeMode, mode => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
    }
  })

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode.value)
  }

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode
  }

  const toggleTheme = () => {
    themeMode.value = actualTheme.value === 'dark' ? 'light' : 'dark'
  }

  // 主题配置
  const themeConfig = computed(() => {
    const isDarkTheme = actualTheme.value === 'dark'

    return {
      // Neutral ink surfaces keep the popup calm and make hierarchy come from spacing.
      bgPrimary: isDarkTheme ? '#18181b' : '#ffffff',
      bgSecondary: isDarkTheme ? '#202023' : '#f7f7f8',
      bgTertiary: isDarkTheme ? '#2b2b30' : '#eeeeef',
      bgHover: isDarkTheme ? '#303035' : '#f1f1f2',

      // 文字颜色
      textPrimary: isDarkTheme ? '#f4f4f5' : '#18181b',
      textSecondary: isDarkTheme ? '#b8b8c0' : '#52525b',
      textTertiary: isDarkTheme ? '#85858f' : '#8b8b93',

      // 边框颜色
      borderPrimary: isDarkTheme ? '#3b3b43' : '#d9d9de',
      borderSecondary: isDarkTheme ? '#2d2d33' : '#e9e9ec',

      // Black and white are the only brand colors; semantic colors remain separate.
      primaryColor: isDarkTheme ? '#f4f4f5' : '#18181b',
      primaryHover: isDarkTheme ? '#ffffff' : '#3f3f46',
      primaryLight: isDarkTheme ? 'rgba(244, 244, 245, 0.12)' : 'rgba(24, 24, 27, 0.08)',

      // 键盘导航高亮色
      keyboardHighlight: isDarkTheme ? 'rgba(244, 244, 245, 0.11)' : 'rgba(24, 24, 27, 0.07)',
      keyboardBorder: isDarkTheme ? '#f4f4f5' : '#18181b',
      keyboardGlow: isDarkTheme ? 'rgba(244, 244, 245, 0.2)' : 'rgba(24, 24, 27, 0.14)',

      // 辅助色
      successColor: isDarkTheme ? '#75c995' : '#28734a',
      warningColor: isDarkTheme ? '#e7b84b' : '#9a6700',
      dangerColor: isDarkTheme ? '#ff8b82' : '#b42318',
      infoColor: isDarkTheme ? '#86b7ff' : '#275dad',

      // 阴影
      shadowSm: isDarkTheme
        ? '0 1px 2px rgba(0, 0, 0, 0.24)'
        : '0 1px 2px rgba(24, 24, 27, 0.05)',
      shadowMd: isDarkTheme
        ? '0 4px 14px rgba(0, 0, 0, 0.28)'
        : '0 4px 12px rgba(24, 24, 27, 0.08)',
      shadowLg: isDarkTheme
        ? '0 18px 42px rgba(0, 0, 0, 0.46)'
        : '0 16px 40px rgba(24, 24, 27, 0.16)'
    }
  })

  // 应用 CSS 变量到根元素
  watchEffect(() => {
    const root = document.documentElement
    const config = themeConfig.value

    root.dataset.theme = actualTheme.value
    root.style.colorScheme = actualTheme.value

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
    prefersDark
  }
}
