<template>
  <section class="settings-section">
    <h2 class="section-title">
      <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 00-2-2H4a2 2 0 01-2-2V5a2 2 0 012-2zm9 1a1 1 0 000 2h2a1 1 0 100-2h-2z" clip-rule="evenodd"/>
        <path d="M9 10a1 1 0 000 2h2a1 1 0 100-2H9z"/>
      </svg>
      {{ $t('settings.groupSettings') }}
    </h2>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.autoGroupRules') }}</h3>

      <div class="setting-item">
        <div class="toggle-wrapper">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="localOptions.autoGroupEnabled"
              @change="handleChange"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </label>
          <div class="toggle-content">
            <span class="toggle-title">{{ $t('settings.enableAutoGroup') }}</span>
            <p class="setting-desc">{{ $t('settings.autoGroupDesc') }}</p>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">
          <svg class="label-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
          </svg>
          {{ $t('settings.colorStrategy') }}
        </label>
        <div class="color-options">
          <label class="color-option" :class="{ active: localOptions.colorStrategy === 'auto' }">
            <input
              type="radio"
              value="auto"
              v-model="localOptions.colorStrategy"
              @change="handleChange"
              class="color-radio"
            />
            <div class="color-option-content">
              <div class="color-preview auto">
                <span></span><span></span><span></span>
              </div>
              <span>{{ $t('settings.colorAuto') }}</span>
            </div>
          </label>

          <label class="color-option" :class="{ active: localOptions.colorStrategy === 'manual' }">
            <input
              type="radio"
              value="manual"
              v-model="localOptions.colorStrategy"
              @change="handleChange"
              class="color-radio"
            />
            <div class="color-option-content">
              <div class="color-preview manual">
                <span></span>
              </div>
              <span>{{ $t('settings.colorFixed') }}</span>
            </div>
          </label>

          <label class="color-option" :class="{ active: localOptions.colorStrategy === 'random' }">
            <input
              type="radio"
              value="random"
              v-model="localOptions.colorStrategy"
              @change="handleChange"
              class="color-radio"
            />
            <div class="color-option-content">
              <div class="color-preview random">
                <span></span><span></span><span></span>
              </div>
              <span>{{ $t('settings.randomColor') }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.groupLimits') }}</h3>

      <div class="setting-item">
        <label class="setting-label">
          <svg class="label-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            <path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
            <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
          </svg>
          {{ $t('settings.minGroupSize') }}
        </label>
        <div class="number-control">
          <button @click="decreaseMin" class="number-btn">-</button>
          <input
            type="number"
            v-model.number="localOptions.minTabsPerGroup"
            @change="handleChange"
            min="2"
            max="10"
            class="number-input"
          />
          <button @click="increaseMin" class="number-btn">+</button>
          <span class="number-suffix">{{ $t('settings.tabsSuffix') }}</span>
        </div>
        <p class="setting-desc">{{ $t('settings.minGroupSizeDesc') }}</p>
      </div>

      <div class="setting-item">
        <label class="setting-label">
          <svg class="label-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          {{ $t('settings.maxGroupsPerWindowLabel') }}
        </label>
        <div class="number-control">
          <button @click="decreaseMax" class="number-btn">-</button>
          <input
            type="number"
            v-model.number="localOptions.maxGroupsPerWindow"
            @change="handleChange"
            min="1"
            max="20"
            class="number-input"
          />
          <button @click="increaseMax" class="number-btn">+</button>
          <span class="number-suffix">{{ $t('settings.groupsSuffix') }}</span>
        </div>
        <p class="setting-desc">{{ $t('settings.maxGroupsPerWindowLabelDesc') }}</p>
      </div>
    </div>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.groupColors') }}</h3>
      <div class="color-palette">
        <div
          v-for="color in colors"
          :key="color.value"
          :class="['color-item', color.value]"
          :title="$t(`settings.colorLabels.${color.value}`)"
        >
          <span class="color-dot"></span>
          <span class="color-name">{{ $t(`settings.colorLabels.${color.value}`) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { GroupOptions, ExtensionConfig } from '@/shared/types'

interface Props {
  options: GroupOptions
  autoGroupEnabled: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [config: Partial<ExtensionConfig>]
}>()

const localOptions = reactive({
  minTabsPerGroup: props.options.minTabsPerGroup || 2,
  maxGroupsPerWindow: props.options.maxGroupsPerWindow || 10,
  colorStrategy: props.options.colorStrategy || 'auto',
  autoGroupEnabled: props.autoGroupEnabled
})

const colors = [
  { value: 'grey' },
  { value: 'blue' },
  { value: 'red' },
  { value: 'yellow' },
  { value: 'green' },
  { value: 'pink' },
  { value: 'purple' },
  { value: 'cyan' }
]

watch(() => props, (newProps) => {
  localOptions.minTabsPerGroup = newProps.options.minTabsPerGroup || 2
  localOptions.maxGroupsPerWindow = newProps.options.maxGroupsPerWindow || 10
  localOptions.colorStrategy = newProps.options.colorStrategy || 'auto'
  localOptions.autoGroupEnabled = newProps.autoGroupEnabled
}, { deep: true })

const handleChange = () => {
  emit('change', {
    autoGroupEnabled: localOptions.autoGroupEnabled,
    groupOptions: {
      minTabsPerGroup: localOptions.minTabsPerGroup,
      maxGroupsPerWindow: localOptions.maxGroupsPerWindow,
      colorStrategy: localOptions.colorStrategy
    }
  })
}

const increaseMin = () => {
  if (localOptions.minTabsPerGroup < 10) {
    localOptions.minTabsPerGroup++
    handleChange()
  }
}

const decreaseMin = () => {
  if (localOptions.minTabsPerGroup > 2) {
    localOptions.minTabsPerGroup--
    handleChange()
  }
}

const increaseMax = () => {
  if (localOptions.maxGroupsPerWindow < 20) {
    localOptions.maxGroupsPerWindow++
    handleChange()
  }
}

const decreaseMax = () => {
  if (localOptions.maxGroupsPerWindow > 1) {
    localOptions.maxGroupsPerWindow--
    handleChange()
  }
}
</script>

<style scoped>
.settings-section {
  animation: fadeIn 0.3s ease;
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

.toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toggle-label {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  min-width: 48px;
  min-height: 26px;
}

.toggle-input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.toggle-slider {
  display: block;
  width: 48px;
  height: 26px;
  background: var(--bg-tertiary);
  border-radius: 13px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: var(--bg-elevated);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-input:focus-visible + .toggle-slider {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
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

.color-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-option {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
}

.color-option:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.color-option.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.color-radio {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.color-radio:focus-visible + .color-option-content {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

.color-option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-option-content span {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: center;
}

.color-preview {
  display: flex;
  gap: 4px;
}

.color-preview span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.color-preview.auto span:nth-child(1) { background: #5d5d59; }
.color-preview.auto span:nth-child(2) { background: #85857e; }
.color-preview.auto span:nth-child(3) { background: #b0b0a8; }

.color-preview.manual span { background: #777771; }

.color-preview.random span:nth-child(1) { background: #4f4f4b; }
.color-preview.random span:nth-child(2) { background: #94948d; }
.color-preview.random span:nth-child(3) { background: #c2c2ba; }

.number-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 4px;
}

.number-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.number-btn:hover {
  background: var(--primary-color);
  color: var(--bg-primary);
  border-color: var(--primary-color);
}

.number-input {
  width: 60px;
  padding: 6px;
  text-align: center;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-weight: 500;
}

.number-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.number-suffix {
  padding: 0 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: all 0.2s;
}

.color-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.color-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.grey .color-dot { background: #777771; }
.blue .color-dot { background: #5f5f5b; }
.red .color-dot { background: #6a6a65; }
.yellow .color-dot { background: #85857d; }
.green .color-dot { background: #65655f; }
.pink .color-dot { background: #76766f; }
.purple .color-dot { background: #6d6d68; }
.cyan .color-dot { background: #5c5c57; }

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
</style>
