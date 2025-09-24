import type { ExtensionError, OperationResult } from '@/shared/types/errors'
import { ErrorCode } from '@/shared/types/errors'

// Re-export for convenience
export { ErrorCode }

export class ErrorHandler {
  /**
   * Creates a standardized ExtensionError
   */
  static createError(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>
  ): ExtensionError {
    return {
      code,
      message,
      context,
      timestamp: Date.now()
    }
  }

  /**
   * Wraps a Chrome API error into our standard error format
   */
  static wrapChromeError(error: unknown, context?: Record<string, unknown>): ExtensionError {
    if (chrome.runtime.lastError) {
      return this.createError(
        ErrorCode.CHROME_API_ERROR,
        chrome.runtime.lastError.message || 'Chrome API error',
        { ...context, originalError: chrome.runtime.lastError }
      )
    }

    if (error instanceof Error) {
      return this.createError(
        ErrorCode.RUNTIME_ERROR,
        error.message,
        { ...context, stack: error.stack, name: error.name }
      )
    }

    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      { ...context, originalError: error }
    )
  }

  /**
   * Creates a successful operation result
   */
  static success<T>(data?: T): OperationResult<T> {
    return {
      success: true,
      data
    }
  }

  /**
   * Creates a failed operation result
   */
  static failure<T>(error: ExtensionError): OperationResult<T> {
    return {
      success: false,
      error
    }
  }

  /**
   * Safely executes an async operation and returns a standardized result
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    try {
      const result = await operation()
      return this.success(result)
    } catch (error) {
      console.error(`Operation failed: ${errorMessage}`, error)
      return this.failure(this.wrapChromeError(error, {
        ...context,
        operationCode: errorCode
      }))
    }
  }

  /**
   * Safely executes a sync operation and returns a standardized result
   */
  static safeExecuteSync<T>(
    operation: () => T,
    errorCode: ErrorCode,
    errorMessage: string,
    context?: Record<string, unknown>
  ): OperationResult<T> {
    try {
      const result = operation()
      return this.success(result)
    } catch (error) {
      console.error(`Operation failed: ${errorMessage}`, error)
      return this.failure(this.wrapChromeError(error, {
        ...context,
        operationCode: errorCode
      }))
    }
  }

  /**
   * Logs error details for debugging
   */
  static logError(error: ExtensionError, prefix = 'Extension Error'): void {
    console.error(`${prefix} [${error.code}]:`, {
      message: error.message,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context
    })
  }

  /**
   * Gets a user-friendly error message
   */
  static getUserMessage(error: ExtensionError): string {
    const userMessages: Record<string, string> = {
      [ErrorCode.TAB_NOT_FOUND]: '标签页未找到',
      [ErrorCode.TAB_ACCESS_DENIED]: '无法访问标签页',
      [ErrorCode.CONFIG_LOAD_FAILED]: '配置加载失败',
      [ErrorCode.STATS_LOAD_FAILED]: '统计信息加载失败',
      [ErrorCode.BOOKMARK_SEARCH_FAILED]: '书签搜索失败',
      [ErrorCode.SORT_OPERATION_FAILED]: '排序操作失败',
      [ErrorCode.GROUP_OPERATION_FAILED]: '分组操作失败',
      [ErrorCode.BATCH_OPERATION_FAILED]: '批量操作失败',
      [ErrorCode.PERMISSION_DENIED]: '权限不足',
      [ErrorCode.CHROME_API_ERROR]: 'Chrome扩展API错误',
      [ErrorCode.RUNTIME_ERROR]: '运行时错误',
      [ErrorCode.UNKNOWN_ERROR]: '未知错误'
    }

    return userMessages[error.code] || error.message
  }
}