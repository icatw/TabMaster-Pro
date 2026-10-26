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
      bgPrimary: isDarkTheme ? '#111110' : '#f4f4f1',
      bgSecondary: isDarkTheme ? '#191918' : '#ecece8',
      bgTertiary: isDarkTheme ? '#252522' : '#e1e1dc',
      bgHover: isDarkTheme ? '#22221f' : '#e8e8e3',
      bgElevated: isDarkTheme ? '#1c1c1a' : '#fcfcfa',
      bgOverlay: isDarkTheme ? 'rgba(28, 28, 26, 0.92)' : 'rgba(252, 252, 250, 0.9)',

      // 文字颜色
      textPrimary: isDarkTheme ? '#f5f5f0' : '#191918',
      textSecondary: isDarkTheme ? '#c3c3ba' : '#555550',
      textTertiary: isDarkTheme ? '#9e9e94' : '#76766f',

      // 边框颜色
      borderPrimary: isDarkTheme ? '#65655e' : '#93938b',
      borderSecondary: isDarkTheme ? '#343430' : '#d8d8d2',

      // Black and white are the only brand colors; semantic colors remain separate.
      primaryColor: isDarkTheme ? '#f5f5f0' : '#191918',
      primaryHover: isDarkTheme ? '#ffffff' : '#393934',
      primaryLight: isDarkTheme ? 'rgba(245, 245, 240, 0.1)' : 'rgba(25, 25, 24, 0.07)',

      // 键盘导航高亮色
      keyboardHighlight: isDarkTheme ? 'rgba(245, 245, 240, 0.1)' : 'rgba(25, 25, 24, 0.07)',
      keyboardBorder: isDarkTheme ? '#f5f5f0' : '#191918',
      keyboardGlow: isDarkTheme ? 'rgba(245, 245, 240, 0.18)' : 'rgba(25, 25, 24, 0.14)',

      // 辅助色
      successColor: isDarkTheme ? '#75c995' : '#28734a',
      warningColor: isDarkTheme ? '#e7b84b' : '#9a6700',
      dangerColor: isDarkTheme ? '#ff8b82' : '#b42318',
      infoColor: isDarkTheme ? '#86b7ff' : '#275dad',

      // 阴影
      shadowSm: isDarkTheme
        ? '0 1px 2px rgba(0, 0, 0, 0.24)'
        : '0 1px 2px rgba(23, 23, 21, 0.04), 0 3px 10px rgba(23, 23, 21, 0.025)',
      shadowMd: isDarkTheme
        ? '0 8px 24px rgba(0, 0, 0, 0.28)'
        : '0 8px 24px rgba(23, 23, 21, 0.065)',
      shadowLg: isDarkTheme
        ? '0 18px 44px rgba(0, 0, 0, 0.42)'
        : '0 18px 44px rgba(23, 23, 21, 0.1)',
      ring: isDarkTheme
        ? '0 0 0 3px rgba(245, 245, 240, 0.2)'
        : '0 0 0 3px rgba(23, 23, 21, 0.14)'
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
    root.style.setProperty('--bg-elevated', config.bgElevated)
    root.style.setProperty('--bg-overlay', config.bgOverlay)

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
    root.style.setProperty('--ring', config.ring)
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
