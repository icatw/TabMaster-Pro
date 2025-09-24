/**
 * Performance monitoring utilities for the Chrome extension
 */

export interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric> = new Map()
  private static enabled = process.env.NODE_ENV === 'development'

  /**
   * Start timing an operation
   */
  static start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  /**
   * End timing an operation
   */
  static end(name: string): PerformanceMetric | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    metric.endTime = endTime
    metric.duration = endTime - metric.startTime

    console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata)

    this.metrics.delete(name)
    return metric
  }

  /**
   * Time a function execution
   */
  static async time<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await fn()
      return result
    } finally {
      this.end(name)
    }
  }

  /**
   * Time a synchronous function execution
   */
  static timeSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.start(name, metadata)
    try {
      const result = fn()
      return result
    } finally {
      this.end(name)
    }
  }

  /**
   * Get all active metrics
   */
  static getActiveMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear()
  }
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)

    if (callNow) {
      func(...args)
    }
  }
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoization utility
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * RAF-based scheduler for smooth animations
 */
export class Scheduler {
  private static tasks: Array<() => void> = []
  private static isRunning = false

  static schedule(task: () => void): void {
    this.tasks.push(task)
    if (!this.isRunning) {
      this.run()
    }
  }

  private static run(): void {
    this.isRunning = true
    requestAnimationFrame(() => {
      const startTime = performance.now()
      const timeSlice = 5 // 5ms time slice

      while (this.tasks.length > 0 && (performance.now() - startTime) < timeSlice) {
        const task = this.tasks.shift()
        if (task) {
          task()
        }
      }

      if (this.tasks.length > 0) {
        this.run()
      } else {
        this.isRunning = false
      }
    })
  }
}