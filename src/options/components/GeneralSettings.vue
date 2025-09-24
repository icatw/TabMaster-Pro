<template>
  <section class="settings-section">
    <h2 class="section-title">
      <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
      </svg>
      {{ $t('settings.general') }}
    </h2>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.defaultBehavior') }}</h3>

      <div class="setting-item">
        <label class="setting-label">
          <svg class="label-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z"/>
          </svg>
          {{ $t('settings.defaultSortRule') }}
        </label>
        <select v-model="localConfig.defaultSortRule" @change="handleChange" class="form-select">
          <option value="domain">{{ $t('toolbar.sortBy.domain') }}</option>
          <option value="title">{{ $t('toolbar.sortBy.title') }}</option>
          <option value="url">{{ $t('toolbar.sortBy.url') }}</option>
          <option value="lastAccessed">{{ $t('toolbar.sortBy.lastAccessed') }}</option>
          <option value="index">{{ $t('toolbar.sortBy.index') }}</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="toggle-wrapper">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="localConfig.autoSortEnabled"
              @change="handleChange"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </label>
          <div class="toggle-content">
            <span class="toggle-title">{{ $t('settings.autoSort') }}</span>
            <p class="setting-desc">{{ $t('settings.autoSortDescription') }}</p>
          </div>
        </div>
      </div>

      <Transition name="slide">
        <div v-if="localConfig.autoSortEnabled" class="setting-item sub-setting">
          <label class="setting-label">
            <svg class="label-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            {{ $t('settings.autoSortDelay') }}
          </label>
          <div class="range-input-wrapper">
            <input
              type="range"
              v-model.number="localConfig.autoSortDelay"
              @change="handleChange"
              min="500"
              max="5000"
              step="500"
              class="range-input"
            />
            <span class="range-value">{{ localConfig.autoSortDelay }}ms</span>
          </div>
          <p class="setting-desc">{{ $t('settings.autoSortDelayDescription') }}</p>
        </div>
      </Transition>

      <div class="setting-item">
        <div class="toggle-wrapper">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="localConfig.autoGroupEnabled"
              @change="handleChange"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </label>
          <div class="toggle-content">
            <span class="toggle-title">{{ $t('settings.autoGroup') }}</span>
            <p class="setting-desc">{{ $t('settings.autoGroupDescription') }}</p>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ExtensionConfig } from '@/shared/types'

interface Props {
  config: ExtensionConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [config: Partial<ExtensionConfig>]
}>()

const localConfig = reactive({
  defaultSortRule: props.config.defaultSortRule,
  autoSortEnabled: props.config.autoSortEnabled,
  autoSortDelay: props.config.autoSortDelay || 1000,
  autoGroupEnabled: props.config.autoGroupEnabled
})

watch(() => props.config, (newConfig) => {
  Object.assign(localConfig, {
    defaultSortRule: newConfig.defaultSortRule,
    autoSortEnabled: newConfig.autoSortEnabled,
    autoSortDelay: newConfig.autoSortDelay || 1000,
    autoGroupEnabled: newConfig.autoGroupEnabled
  })
}, { deep: true })

const handleChange = () => {
  emit('change', {
    defaultSortRule: localConfig.defaultSortRule,
    autoSortEnabled: localConfig.autoSortEnabled,
    autoSortDelay: localConfig.autoSortDelay,
    autoGroupEnabled: localConfig.autoGroupEnabled
  })
}
</script>

<style scoped>
.settings-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.title-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.setting-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-primary);
}

.setting-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-secondary);
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.sub-setting {
  padding-left: 40px;
  margin-top: -8px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
  line-height: 1.5;
}

.form-select {
  width: 100%;
  max-width: 300px;
  padding: 10px 12px;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all 0.2s;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toggle-label {
  position: relative;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  display: block;
  width: 48px;
  height: 26px;
  background: var(--border-primary);
  border-radius: 13px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: var(--bg-primary);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-slider {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
}

.toggle-input:checked + .toggle-slider::after {
  transform: translateX(22px);
}

.toggle-content {
  flex: 1;
}

.toggle-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.range-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 400px;
}

.range-input {
  flex: 1;
  height: 6px;
  background: var(--border-primary);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px var(--primary-light);
}

.range-value {
  min-width: 60px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>