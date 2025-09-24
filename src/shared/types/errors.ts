// Error types for the Chrome extension
export interface ExtensionError {
  code: string
  message: string
  context?: Record<string, unknown>
  timestamp: number
}

export enum ErrorCode {
  // Chrome API errors
  TAB_NOT_FOUND = 'TAB_NOT_FOUND',
  TAB_ACCESS_DENIED = 'TAB_ACCESS_DENIED',
  CHROME_API_ERROR = 'CHROME_API_ERROR',

  // Extension errors
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',
  STATS_LOAD_FAILED = 'STATS_LOAD_FAILED',
  BOOKMARK_SEARCH_FAILED = 'BOOKMARK_SEARCH_FAILED',

  // Operation errors
  SORT_OPERATION_FAILED = 'SORT_OPERATION_FAILED',
  GROUP_OPERATION_FAILED = 'GROUP_OPERATION_FAILED',
  BATCH_OPERATION_FAILED = 'BATCH_OPERATION_FAILED',

  // Network/Runtime errors
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export type ErrorHandler = (error: ExtensionError) => void

// Result type for operations that can fail
export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: ExtensionError
}

// Async operation result
export type AsyncOperationResult<T = unknown> = Promise<OperationResult<T>>