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
  STATS: 'usage_stats',
  SAVED_TABS: 'saved_tabs',
  SAVED_TABS_SNAPSHOTS: 'saved_tabs_snapshots',
  AUTO_COLLECTION_PREVIEW: 'auto_collection_preview',
  AI_SETTINGS: 'ai_settings',
  AI_SUMMARY_CACHE: 'ai_summary_cache'
} as const

export const SAVED_TABS_SCHEMA_VERSION = 3
export const SAVED_TABS_LEGACY_SCHEMA_VERSION = 2

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  defaultSortRule: 'domain' as const,
  autoGroupEnabled: false,
  autoSortEnabled: false,  // 默认关闭自动排序
  autoSortDelay: 1000,     // 默认延迟1秒
  autoCollectEnabled: false,
  autoCollectAfterDays: 7,
  autoCollectExcludedDomains: '',
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
    colorStrategy: 'auto' as const,
    manualColor: 'blue' as const
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
  CONFIG_UPDATED: 'CONFIG_UPDATED',
  SAVE_WINDOW: 'SAVE_WINDOW',
  SAVE_SESSION: 'SAVE_SESSION',
  SAVE_AND_CLOSE_TABS: 'SAVE_AND_CLOSE_TABS',
  SAVE_AND_CLOSE_WINDOW: 'SAVE_AND_CLOSE_WINDOW',
  GET_SAVED_LISTS: 'GET_SAVED_LISTS',
  GET_SAVED_WORKSPACES: 'GET_SAVED_WORKSPACES',
  CREATE_SAVED_WORKSPACE: 'CREATE_SAVED_WORKSPACE',
  MOVE_SAVED_LIST: 'MOVE_SAVED_LIST',
  GET_SAVED_SNAPSHOTS: 'GET_SAVED_SNAPSHOTS',
  RESTORE_SAVED_SNAPSHOT: 'RESTORE_SAVED_SNAPSHOT',
  EXPORT_SAVED_TABS: 'EXPORT_SAVED_TABS',
  IMPORT_SAVED_TABS: 'IMPORT_SAVED_TABS',
  RESTORE_LIST: 'RESTORE_LIST',
  RESTORE_SAVED_ITEM: 'RESTORE_SAVED_ITEM',
  RESTORE_SELECTED_ITEMS: 'RESTORE_SELECTED_ITEMS',
  UPDATE_LIST: 'UPDATE_LIST',
  DELETE_LIST: 'DELETE_LIST',
  CLEANUP_SAVED_LISTS: 'CLEANUP_SAVED_LISTS',
  GET_AUTO_COLLECTION_PREVIEW: 'GET_AUTO_COLLECTION_PREVIEW',
  CONFIRM_AUTO_COLLECTION: 'CONFIRM_AUTO_COLLECTION',
  DISMISS_AUTO_COLLECTION: 'DISMISS_AUTO_COLLECTION',
  TEST_AI_PROVIDER: 'TEST_AI_PROVIDER',
  SUMMARIZE_SAVED_LIST: 'SUMMARIZE_SAVED_LIST'
} as const

/**
 * 开发环境常量
 */
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
} as const
