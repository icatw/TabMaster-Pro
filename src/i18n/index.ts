import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN.json'
import enUS from '../locales/en-US.json'

export type MessageSchema = typeof zhCN

// 获取用户首选语言
function getLocale(): string {
  // 1. 优先使用存储的用户设置
  const storedLocale = localStorage.getItem('app-locale')
  if (storedLocale && ['zh-CN', 'en-US'].includes(storedLocale)) {
    return storedLocale
  }

  // 2. 使用浏览器语言设置
  const browserLang = navigator.language || 'zh-CN'

  // 语言映射
  const langMap: Record<string, string> = {
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-CN',
    'zh-HK': 'zh-CN',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US'
  }

  return langMap[browserLang] || langMap[browserLang.split('-')[0]] || 'zh-CN'
}

// 创建 i18n 实例（使用运行时编译模式，预编译消息）
export const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'zh-CN',
  globalInjection: true,
  allowComposition: true,
  warnHtmlMessage: false,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  },
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  missingWarn: false,
  fallbackWarn: false
})

// 设置语言的工具函数
export function setLocale(locale: 'zh-CN' | 'en-US') {
  (i18n.global.locale as any).value = locale
  localStorage.setItem('app-locale', locale)

  // 通知其他扩展页面语言变化
  chrome.storage.local.set({ 'app-locale': locale }).catch(console.warn)
}

// 获取当前语言
export function getCurrentLocale(): 'zh-CN' | 'en-US' {
  return (i18n.global.locale as any).value as 'zh-CN' | 'en-US'
}

// 获取支持的语言列表
export function getSupportedLocales() {
  return [
    { value: 'zh-CN', label: '中文', nativeLabel: '中文' },
    { value: 'en-US', label: 'English', nativeLabel: 'English' }
  ] as const
}

// 监听存储变化，同步语言设置
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes['app-locale']?.newValue) {
      const newLocale = changes['app-locale'].newValue
      if (newLocale !== getCurrentLocale()) {
        (i18n.global.locale as any).value = newLocale
      }
    }
  })
}