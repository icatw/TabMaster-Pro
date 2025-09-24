/**
 * 排序规则类型
 */
export type SortRule = 'domain' | 'title' | 'url' | 'lastAccessed' | 'index'

/**
 * 排序选项
 */
export interface SortOptions {
  rule: SortRule
  ascending: boolean
  caseSensitive?: boolean
  groupSimilar?: boolean
}

/**
 * 分组选项
 */
export interface GroupOptions {
  minTabsPerGroup?: number
  maxGroupsPerWindow?: number
  colorStrategy?: 'auto' | 'manual' | 'random'
}

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 扩展配置
 */
export interface ExtensionConfig {
  defaultSortRule: SortRule
  autoGroupEnabled: boolean
  autoSortEnabled: boolean  // 自动排序开关
  autoSortDelay?: number    // 自动排序延迟（毫秒）
  groupColorPreference: 'auto' | 'manual'
  customColors: Record<string, chrome.tabGroups.ColorEnum>
  sortOptions: SortOptions
  groupOptions: GroupOptions
  theme?: ThemeMode         // 主题设置
}

/**
 * 排序结果
 */
export interface SortResult {
  success: boolean
  tabs: TabInfo[]
  originalCount: number
  sortedCount: number
  rule: SortRule
  ascending: boolean
  duration: number
  error?: string
}

/**
 * 分组结果
 */
export interface GroupResult {
  success: boolean
  groupCount: number
  tabCount: number
  duration: number
  error?: string
  message?: string
  alreadyGroupedCount?: number
}

/**
 * 标签页扩展信息
 */
export interface TabInfo {
  id: number
  index: number
  windowId: number
  title: string
  url: string
  domain: string
  favIconUrl?: string
  pinned: boolean
  active: boolean
  highlighted: boolean
  incognito: boolean
  selected: boolean
  discarded: boolean
  autoDiscardable: boolean
  groupId: number
  lastAccessed: number
  status?: 'loading' | 'complete'
  audible?: boolean
  mutedInfo?: chrome.tabs.MutedInfo
  // 缩略图信息
  thumbnailUrl?: string
  thumbnailCachedAt?: number
  // 其他性能信息
  loadTime?: number
}

/**
 * 分组扩展信息
 */
export interface GroupInfo extends chrome.tabGroups.TabGroup {
  tabCount?: number
  domains?: string[]
}

/**
 * API 响应基础类型
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  timestamp: number
}

// Re-export error types
export * from './errors'

/**
 * API 错误类型 (deprecated - use ExtensionError instead)
 * @deprecated Use ExtensionError from ./errors instead
 */
export type APIError = string

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  success: boolean
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  errors?: APIError[]
  operations?: TabMoveOperation[]
  message?: string
  duration?: number
}

/**
 * 标签移动操作
 */
export interface TabMoveOperation {
  tabId: number
  fromIndex: number
  toIndex: number
}

/**
 * 应用状态
 */
export interface AppState {
  isLoading: boolean
  currentRule: SortRule
  tabCount: number
  groupCount: number
  lastOperation?: 'sort' | 'group'
  error?: string
}

/**
 * 筛选器配置
 */
export interface FilterConfig {
  id: string
  label: string
  icon: string
  count: number
}

/**
 * Toast 消息类型
 */
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

/**
 * 键盘导航项
 */
export interface NavigationItem {
  type: 'tab' | 'bookmark'
  data: TabInfo | any
  id: string
}

/**
 * 悬停详情位置
 */
export interface HoverPosition {
  x: number
  y: number
}

/**
 * 悬停详情状态
 */
export interface HoverDetails {
  visible: boolean
  tabInfo: TabInfo | null
  position: HoverPosition
}

/**
 * 搜索状态
 */
export interface SearchState {
  query: string
  mode: 'tabs' | 'bookmarks'
  isSearching: boolean
  results: {
    tabs: TabInfo[]
    bookmarks: any[]
  }
}

/**
 * 统计信息
 */
export interface TabStats {
  tabCount: number
  groupCount: number
  pinnedCount?: number
  audibleCount?: number
  groupedCount?: number
}

/**
 * 组合式函数选项基类
 */
export interface ComposableOptions {
  showToast?: (message: string, type: 'success' | 'error') => void
}

/**
 * 标签页操作选项
 */
export interface TabOperationOptions extends ComposableOptions {
  config?: ExtensionConfig | null
}

/**
 * 批量操作选项
 */
export interface BatchOperationOptions {
  tabIds: number[]
  operation: 'close' | 'group' | 'ungroup' | 'move'
  groupOptions?: {
    title?: string
    color?: chrome.tabGroups.ColorEnum
  }
}