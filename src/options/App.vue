<template>
  <div class="options-app">
    <!-- 侧边栏组件 -->
    <Sidebar v-model="activeSection" />

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部控制栏 -->
      <div class="top-controls">
        <!-- 主题切换 -->
        <div class="control-item">
          <div class="theme-switcher">
            <svg class="control-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
              <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8zm-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7z"/>
            </svg>
            <select v-model="localTheme" @change="handleThemeChange" class="control-select">
              <option value="light">{{ $t('settings.themes.light') }}</option>
              <option value="dark">{{ $t('settings.themes.dark') }}</option>
              <option value="auto">{{ $t('settings.themes.auto') }}</option>
            </select>
          </div>
        </div>

        <!-- 语言切换 -->
        <div class="control-item">
          <div class="language-switcher">
            <svg class="control-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.022 7.978a3.915 3.915 0 0 1 4.78-3.908 1.46 1.46 0 0 0 1.828-1.414A1.46 1.46 0 0 0 9.174.63a6.881 6.881 0 0 0-9.057 5.421C-.415 7.647.665 9.125 2.252 9.125h.386a1.46 1.46 0 0 0 0-2.92h-.386a.73.73 0 0 1-.73-.73c0-.607.096-1.2.27-1.769zM13.025.876a1.46 1.46 0 0 0-1.06.437L10.5 2.779a1.46 1.46 0 0 0 2.121 2.011l1.465-1.465a1.46 1.46 0 0 0-.06-2.449zm.363 8.05a3.915 3.915 0 0 1-4.78 3.908 1.46 1.46 0 0 0-1.828 1.414 1.46 1.46 0 0 0 1.456 1.626 6.881 6.881 0 0 0 9.057-5.421c.532-1.596-.549-3.074-2.136-3.074h-.386a1.46 1.46 0 0 0 0 2.92h.386a.73.73 0 0 1 .73.73c0 .607-.096 1.2-.27 1.769z"/>
            </svg>
            <select v-model="currentLanguage" @change="handleLanguageChange" class="control-select">
              <option value="zh-CN">{{ $t('settings.languages.zh-CN') }}</option>
              <option value="en-US">{{ $t('settings.languages.en-US') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <div v-else>
        <!-- 通用设置组件 -->
        <GeneralSettings
          v-show="activeSection === 'general'"
          :config="config"
          @change="handleConfigChange"
        />

        <!-- 排序设置组件 -->
        <SortSettings
          v-show="activeSection === 'sort'"
          :options="config.sortOptions"
          @change="handleSortOptionsChange"
        />

        <!-- 分组设置组件 -->
        <GroupSettings
          v-show="activeSection === 'group'"
          :options="config.groupOptions"
          :auto-group-enabled="config.autoGroupEnabled"
          @change="handleConfigChange"
        />

        <!-- 快捷键设置组件 -->
        <ShortcutsSection v-show="activeSection === 'shortcuts'" />

        <!-- 关于组件 -->
        <AboutSection v-show="activeSection === 'about'" />
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar" v-show="!isLoading">
        <button
          @click="saveConfig"
          :disabled="isSaving || !isDirty"
          class="btn btn-primary"
        >
          <svg v-if="!isSaving" class="btn-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/>
          </svg>
          <div v-if="isSaving" class="btn-spinner"></div>
          <span v-if="isSaving">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>

        <button
          @click="resetConfig"
          :disabled="isSaving"
          class="btn btn-secondary"
        >
          <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          <span>{{ $t('settings.resetDefaults') }}</span>
        </button>
      </div>
    </main>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="saveMessage" :class="['toast', saveMessageType]">
        <svg v-if="saveMessageType === 'success'" class="toast-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
        <svg v-else class="toast-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        {{ saveMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { i18n, setLocale, getCurrentLocale } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import { DEFAULT_CONFIG } from '../shared/constants'
import type { ExtensionConfig, APIResponse, SortOptions, ThemeMode } from '../shared/types'
import { MESSAGE_TYPES } from '../shared/constants'

// 导入组件
import Sidebar from './components/Sidebar.vue'
import GeneralSettings from './components/GeneralSettings.vue'
import SortSettings from './components/SortSettings.vue'
import GroupSettings from './components/GroupSettings.vue'
import ShortcutsSection from './components/ShortcutsSection.vue'
import AboutSection from './components/AboutSection.vue'

// 初始化主题
const { isDark, themeMode, actualTheme, setTheme } = useTheme()

// 响应式数据
const activeSection = ref('general')
const config = reactive<ExtensionConfig>({
  ...DEFAULT_CONFIG
})

const isLoading = ref(false)
const isSaving = ref(false)
const isDirty = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'success' | 'error'>('success')

// 顶部控制栏数据
const localTheme = ref<ThemeMode>(themeMode.value)
const currentLanguage = ref(getCurrentLocale())

// 方法
const markDirty = () => {
  isDirty.value = true
}

const handleConfigChange = (changes: Partial<ExtensionConfig>) => {
  Object.assign(config, changes)
  markDirty()
}

const handleSortOptionsChange = (options: SortOptions) => {
  config.sortOptions = options
  markDirty()
}

// 顶部控制栏方法
const handleThemeChange = () => {
  setTheme(localTheme.value)
  config.theme = localTheme.value
  markDirty()
}

const handleLanguageChange = () => {
  try {
    setLocale(currentLanguage.value as 'zh-CN' | 'en-US')
  } catch (error) {
    console.error('Failed to change language:', error)
  }
}

const saveConfig = async () => {
  if (isSaving.value) return

  isSaving.value = true
  saveMessage.value = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UPDATE_CONFIG,
      payload: config
    }) as APIResponse<ExtensionConfig>

    if (response.success) {
      saveMessage.value = i18n.global.t('messages.operationSuccess')
      saveMessageType.value = 'success'
      isDirty.value = false
    } else {
      saveMessage.value = response.error || i18n.global.t('messages.operationFailed')
      saveMessageType.value = 'error'
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    saveMessage.value = i18n.global.t('messages.operationFailed')
    saveMessageType.value = 'error'
  } finally {
    isSaving.value = false
  }

  setTimeout(() => {
    saveMessage.value = ''
  }, 3000)
}

const resetConfig = async () => {
  if (isSaving.value) return

  if (confirm(i18n.global.t('settings.confirmReset'))) {
    Object.assign(config, DEFAULT_CONFIG)
    markDirty()
    await saveConfig()
  }
}

const loadConfig = async () => {
  try {
    isLoading.value = true
    const result = await chrome.storage.sync.get('extension_config')

    if (result.extension_config) {
      const loadedConfig = result.extension_config
      const mergedConfig = {
        ...DEFAULT_CONFIG,
        ...loadedConfig,
        sortOptions: {
          ...DEFAULT_CONFIG.sortOptions,
          ...(loadedConfig.sortOptions || {})
        },
        groupOptions: {
          ...DEFAULT_CONFIG.groupOptions,
          ...(loadedConfig.groupOptions || {})
        }
      }

      Object.assign(config, mergedConfig)
    } else {
      Object.assign(config, DEFAULT_CONFIG)
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  } finally {
    isLoading.value = false
  }
}

// 生命周期
onMounted(async () => {
  await loadConfig()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.options-app {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 主内容区 */
.main-content {
  flex: 1;
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* 顶部控制栏 */
.top-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding: 8px 0;
  position: relative;
}

.control-item {
  display: flex;
  align-items: center;
}

.theme-switcher,
.language-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 120px;
  box-shadow: var(--shadow-sm);
}

.theme-switcher:hover,
.language-switcher:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.control-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.theme-switcher:hover .control-icon,
.language-switcher:hover .control-icon {
  color: var(--primary-hover);
}

.control-select {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  padding: 0;
  flex: 1;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.control-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 10px;
  font-weight: 500;
}

/* 为select添加下拉箭头样式 */
.control-select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8e8e8;
  border-top-color: #345454;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 操作栏 */
.action-bar {
  position: sticky;
  bottom: 20px;
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  display: flex;
  gap: 16px;
  margin-top: 40px;
  backdrop-filter: blur(10px);
}

.btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: linear-gradient(135deg, #345454 0%, #5b9c7a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 84, 84, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 84, 84, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 2px solid var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.toast.success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(91, 156, 122, 0.95) 100%);
  color: white;
}

.toast.error {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.95) 0%, rgba(237, 137, 54, 0.95) 100%);
  color: white;
}

.toast-icon {
  width: 20px;
  height: 20px;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-enter-from {
  transform: translateX(100%) scale(0.8);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%) scale(0.8);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .options-app {
    flex-direction: column;
  }

  .main-content {
    padding: 20px;
  }

  .top-controls {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .theme-switcher,
  .language-switcher {
    min-width: auto;
    justify-content: space-between;
  }

  .action-bar {
    flex-direction: column;
    bottom: 10px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #345454 0%, #5b9c7a 100%);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #2a4343 0%, #4a8b69 100%);
}
</style>