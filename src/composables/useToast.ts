import { ref } from 'vue'

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export function useToast() {
  const successMessage = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const toasts = ref<ToastMessage[]>([])

  let toastIdCounter = 0
  const timers = new Map<number, NodeJS.Timeout>()

  let successTimer: NodeJS.Timeout | null = null
  let errorTimer: NodeJS.Timeout | null = null

  // 显示成功消息
  const showSuccess = (message: string, duration = 2000) => {
    // 清除之前的定时器
    if (successTimer) {
      clearTimeout(successTimer)
      successTimer = null
    }

    // 立即显示新消息
    successMessage.value = message

    // 设置新的定时器
    successTimer = setTimeout(() => {
      successMessage.value = null
      successTimer = null
    }, duration)
  }

  // 显示错误消息
  const showError = (message: string, duration = 3000) => {
    // 清除之前的定时器
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }

    // 立即显示新消息
    errorMessage.value = message

    // 设置新的定时器
    errorTimer = setTimeout(() => {
      errorMessage.value = null
      errorTimer = null
    }, duration)
  }

  // 通用 Toast 方法
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 2500) => {
    const id = ++toastIdCounter
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }

    toasts.value.push(toast)

    // 自动移除
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  // 移除 Toast
  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }

    // 清理定时器
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  // 清除所有 Toast
  const clearAllToasts = () => {
    toasts.value = []
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()

    // 清理成功和错误消息的定时器
    if (successTimer) {
      clearTimeout(successTimer)
      successTimer = null
    }
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }

    successMessage.value = null
    errorMessage.value = null
  }

  return {
    // 状态
    successMessage,
    errorMessage,
    toasts,

    // 方法
    showSuccess,
    showError,
    showToast,
    removeToast,
    clearAllToasts
  }
}