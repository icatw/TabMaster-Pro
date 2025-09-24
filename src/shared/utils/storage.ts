import type { ExtensionConfig } from '../types'
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../constants'

/**
 * 配置存储服务
 * 处理 Chrome 扩展的配置存储和读取
 */
export class StorageService {
  /**
   * 获取扩展配置
   * @returns Promise<ExtensionConfig> 扩展配置对象
   */
  static async getConfig(): Promise<ExtensionConfig> {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG)
      const config = result[STORAGE_KEYS.CONFIG] as ExtensionConfig
      
      // 如果没有配置或配置不完整，返回默认配置
      if (!config || !this.isValidConfig(config)) {
        await this.setConfig(DEFAULT_CONFIG)
        return DEFAULT_CONFIG
      }
      
      // 合并默认配置，确保新增的配置项有默认值
      return { ...DEFAULT_CONFIG, ...config }
    } catch (error) {
      console.error('Failed to get config from storage:', error)
      return DEFAULT_CONFIG
    }
  }

  /**
   * 保存扩展配置
   * @param config 要保存的配置对象
   * @returns Promise<boolean> 是否保存成功
   */
  static async setConfig(config: ExtensionConfig): Promise<boolean> {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.CONFIG]: config
      })
      return true
    } catch (error) {
      console.error('Failed to save config to storage:', error)
      return false
    }
  }

  /**
   * 更新部分配置
   * @param partialConfig 要更新的配置项
   * @returns Promise<boolean> 是否更新成功
   */
  static async updateConfig(partialConfig: Partial<ExtensionConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig()
      const newConfig = this.deepMerge(currentConfig, partialConfig)
      return await this.setConfig(newConfig)
    } catch (error) {
      console.error('Failed to update config:', error)
      return false
    }
  }

  /**
   * 深度合并对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  private static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target }
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key]
        const targetValue = result[key]
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
            targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue)
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>]
        }
      }
    }
    
    return result
  }

  /**
   * 重置配置为默认值
   * @returns Promise<boolean> 是否重置成功
   */
  static async resetConfig(): Promise<boolean> {
    return await this.setConfig(DEFAULT_CONFIG)
  }

  /**
   * 获取特定配置项
   * @param key 配置项键名
   * @returns Promise<T> 配置项值
   */
  static async getConfigItem<T extends keyof ExtensionConfig>(
    key: T
  ): Promise<ExtensionConfig[T]> {
    const config = await this.getConfig()
    return config[key]
  }

  /**
   * 设置特定配置项
   * @param key 配置项键名
   * @param value 配置项值
   * @returns Promise<boolean> 是否设置成功
   */
  static async setConfigItem<T extends keyof ExtensionConfig>(
    key: T,
    value: ExtensionConfig[T]
  ): Promise<boolean> {
    return await this.updateConfig({ [key]: value } as Partial<ExtensionConfig>)
  }

  /**
   * 监听配置变化
   * @param callback 配置变化回调函数
   * @returns 取消监听的函数
   */
  static onConfigChange(
    callback: (newConfig: ExtensionConfig, oldConfig?: ExtensionConfig) => void
  ): () => void {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.CONFIG]) {
        const newConfig = changes[STORAGE_KEYS.CONFIG].newValue as ExtensionConfig
        const oldConfig = changes[STORAGE_KEYS.CONFIG].oldValue as ExtensionConfig
        callback(newConfig, oldConfig)
      }
    }

    chrome.storage.onChanged.addListener(listener)
    
    // 返回取消监听的函数
    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }

  /**
   * 获取存储使用情况
   * @returns Promise<chrome.storage.StorageAreaSync> 存储使用信息
   */
  static async getStorageInfo(): Promise<{
    bytesInUse: number
    quotaBytes: number
    usagePercentage: number
  }> {
    try {
      const bytesInUse = await chrome.storage.sync.getBytesInUse()
      const quotaBytes = chrome.storage.sync.QUOTA_BYTES
      const usagePercentage = Math.round((bytesInUse / quotaBytes) * 100)
      
      return {
        bytesInUse,
        quotaBytes,
        usagePercentage
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        bytesInUse: 0,
        quotaBytes: chrome.storage.sync.QUOTA_BYTES,
        usagePercentage: 0
      }
    }
  }

  /**
   * 清除所有存储数据
   * @returns Promise<boolean> 是否清除成功
   */
  static async clearAll(): Promise<boolean> {
    try {
      await chrome.storage.sync.clear()
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * 验证配置对象是否有效
   * @param config 要验证的配置对象
   * @returns boolean 配置是否有效
   */
  private static isValidConfig(config: any): config is ExtensionConfig {
    return (
      config &&
      typeof config === 'object' &&
      'sortOptions' in config &&
      'groupOptions' in config &&
      typeof config.sortOptions === 'object' &&
      typeof config.groupOptions === 'object'
    )
  }

  /**
   * 导出配置数据
   * @returns Promise<string> JSON 格式的配置数据
   */
  static async exportConfig(): Promise<string> {
    try {
      const config = await this.getConfig()
      return JSON.stringify(config, null, 2)
    } catch (error) {
      console.error('Failed to export config:', error)
      throw new Error('导出配置失败')
    }
  }

  /**
   * 导入配置数据
   * @param configJson JSON 格式的配置数据
   * @returns Promise<boolean> 是否导入成功
   */
  static async importConfig(configJson: string): Promise<boolean> {
    try {
      const config = JSON.parse(configJson) as ExtensionConfig
      
      if (!this.isValidConfig(config)) {
        throw new Error('无效的配置格式')
      }
      
      return await this.setConfig(config)
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }
}

// 导出便捷方法
export const {
  getConfig,
  setConfig,
  updateConfig,
  resetConfig,
  getConfigItem,
  setConfigItem,
  onConfigChange,
  getStorageInfo,
  clearAll,
  exportConfig,
  importConfig
} = StorageService