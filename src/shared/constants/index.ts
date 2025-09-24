/**
 * 排序规则常量
 */
export const SORT_RULES = {
  DOMAIN: 'domain',
  TITLE: 'title',
  URL: 'url',
  LAST_ACCESSED: 'lastAccessed',
  INDEX: 'index'
} as const

/**
 * 标签页分组颜色常量
 */
export const TAB_GROUP_COLORS = [
  'grey',
  'blue', 
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange'
] as const

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  CONFIG: 'extension_config',
  CACHE: 'tab_cache',
  STATS: 'usage_stats'
} as const

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  defaultSortRule: 'domain' as const,
  autoGroupEnabled: true,
  autoSortEnabled: false,  // 默认关闭自动排序
  autoSortDelay: 1000,     // 默认延迟1秒
  groupColorPreference: 'auto' as const,
  customColors: {},
  sortOptions: {
    rule: 'domain' as const,
    ascending: true,
    caseSensitive: false,
    groupSimilar: true
  },
  groupOptions: {
    minTabsPerGroup: 2,
    maxGroupsPerWindow: 10,
    colorStrategy: 'auto' as const
  }
} as const

/**
 * 性能配置常量
 */
export const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 10,
  CACHE_TTL: 5000, // 5秒
  DEBOUNCE_DELAY: 300, // 300ms
  MAX_TABS_WARNING: 100
} as const

/**
 * UI 常量
 */
export const UI_CONFIG = {
  POPUP_WIDTH: 320,
  POPUP_HEIGHT: 400,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000
} as const

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  CHROME_API_ERROR: 'CHROME_API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SORT_FAILED: 'SORT_FAILED',
  GROUP_FAILED: 'GROUP_FAILED',
  CONFIG_UPDATE_FAILED: 'CONFIG_UPDATE_FAILED'
} as const

/**
 * 消息类型常量
 */
export const MESSAGE_TYPES = {
  SORT_TABS: 'SORT_TABS',
  GROUP_TABS: 'GROUP_TABS',
  UNGROUP_TABS: 'UNGROUP_TABS',
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  GET_CONFIG: 'GET_CONFIG',
  GET_STATS: 'GET_STATS',
  CONFIG_UPDATED: 'CONFIG_UPDATED'
} as const

/**
 * 开发环境常量
 */
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
} as const