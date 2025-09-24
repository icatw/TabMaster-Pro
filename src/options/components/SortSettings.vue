<template>
  <section class="settings-section">
    <h2 class="section-title">
      <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"/>
      </svg>
      {{ $t('settings.sortSettings') }}
    </h2>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.sortOptions') }}</h3>

      <div class="options-grid">
        <div class="option-card" :class="{ active: localOptions.ascending }">
          <label class="option-label">
            <input
              type="checkbox"
              v-model="localOptions.ascending"
              @change="handleChange"
              class="option-input"
            />
            <div class="option-content">
              <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 4h13M3 8h9M3 12h5M13 12v8m0 0l-4-4m4 4l4-4"/>
              </svg>
              <span class="option-title">{{ $t('settings.ascending') }}</span>
              <span class="option-desc">{{ $t('settings.ascendingDesc') }}</span>
            </div>
          </label>
        </div>

        <div class="option-card" :class="{ active: !localOptions.ascending }">
          <label class="option-label">
            <input
              type="checkbox"
              :checked="!localOptions.ascending"
              @change="localOptions.ascending = false; handleChange()"
              class="option-input"
            />
            <div class="option-content">
              <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 4h13M3 8h9M3 12h5M13 20v-8m0 8l-4-4m4 4l4-4"/>
              </svg>
              <span class="option-title">{{ $t('settings.descending') }}</span>
              <span class="option-desc">{{ $t('settings.descendingDesc') }}</span>
            </div>
          </label>
        </div>

        <div class="option-card" :class="{ active: localOptions.caseSensitive }">
          <label class="option-label">
            <input
              type="checkbox"
              v-model="localOptions.caseSensitive"
              @change="handleChange"
              class="option-input"
            />
            <div class="option-content">
              <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="16" font-weight="bold">Aa</text>
              </svg>
              <span class="option-title">{{ $t('settings.caseSensitive') }}</span>
              <span class="option-desc">{{ $t('settings.caseSensitiveDesc') }}</span>
            </div>
          </label>
        </div>

        <div class="option-card" :class="{ active: localOptions.groupSimilar }">
          <label class="option-label">
            <input
              type="checkbox"
              v-model="localOptions.groupSimilar"
              @change="handleChange"
              class="option-input"
            />
            <div class="option-content">
              <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span class="option-title">{{ $t('settings.groupSimilar') }}</span>
              <span class="option-desc">{{ $t('settings.groupSimilarDesc') }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.sortPreview') }}</h3>
      <div class="preview-container">
        <div class="preview-item" v-for="item in previewItems" :key="item.id">
          <span class="preview-icon">{{ item.icon }}</span>
          <span class="preview-text">{{ item.text }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { SortOptions } from '@/shared/types'

interface Props {
  options: SortOptions
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [options: SortOptions]
}>()

const localOptions = reactive({
  rule: props.options.rule,
  ascending: props.options.ascending,
  caseSensitive: props.options.caseSensitive || false,
  groupSimilar: props.options.groupSimilar || false
})

watch(() => props.options, (newOptions) => {
  Object.assign(localOptions, newOptions)
}, { deep: true })

const handleChange = () => {
  emit('change', { ...localOptions })
}

const previewItems = computed(() => {
  const items = [
    { id: 1, icon: '🌐', text: 'amazon.com' },
    { id: 2, icon: '📘', text: 'facebook.com' },
    { id: 3, icon: '🔍', text: 'google.com' },
    { id: 4, icon: '🐙', text: 'github.com' },
    { id: 5, icon: '🎥', text: 'youtube.com' }
  ]

  if (!localOptions.ascending) {
    items.reverse()
  }

  if (localOptions.caseSensitive) {
    items.sort((a, b) => {
      const aUpper = a.text[0] === a.text[0].toUpperCase()
      const bUpper = b.text[0] === b.text[0].toUpperCase()
      if (aUpper && !bUpper) return -1
      if (!aUpper && bUpper) return 1
      return 0
    })
  }

  return items
})
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

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.option-card {
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: var(--bg-secondary);
}

.option-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.option-card.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.option-label {
  display: block;
  cursor: pointer;
}

.option-input {
  display: none;
}

.option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.option-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-desc {
  font-size: 11px;
  color: var(--text-tertiary);
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  transition: all 0.2s;
}

.preview-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-icon {
  font-size: 18px;
}

.preview-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
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
</style>