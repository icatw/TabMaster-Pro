<template>
  <section class="settings-section">
    <h2 class="section-title">
      <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clip-rule="evenodd"/>
      </svg>
      {{ $t('settings.shortcuts') }}
    </h2>

    <div class="shortcut-card">
      <h3 class="card-title">{{ $t('settings.keyboardShortcuts') }}</h3>
      <p class="card-desc">{{ $t('settings.shortcutsDesc') }}</p>

      <div class="shortcut-list">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.id"
          class="shortcut-item"
          :class="{ active: hoveredShortcut === shortcut.id }"
          @mouseenter="hoveredShortcut = shortcut.id"
          @mouseleave="hoveredShortcut = null"
        >
          <div class="shortcut-left">
            <div class="shortcut-icon" v-html="shortcut.icon">
            </div>
            <div class="shortcut-info">
              <span class="shortcut-name">{{ $t(`settings.shortcutActions.${shortcut.nameKey}`) }}</span>
              <span class="shortcut-desc">{{ $t(`settings.shortcutDescriptions.${shortcut.descKey}`) }}</span>
            </div>
          </div>
          <div class="shortcut-right">
            <kbd class="shortcut-key">
              <span class="key-modifier">{{ isMac ? '⌘' : 'Ctrl' }}</span>
              <span class="key-plus">+</span>
              <span class="key-modifier">⇧</span>
              <span class="key-plus">+</span>
              <span class="key-main">{{ shortcut.key }}</span>
            </kbd>
          </div>
        </div>
      </div>

      <div class="shortcut-footer">
        <button class="config-btn" @click="openShortcutsPage">
          <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l-.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
          </svg>
          <span>{{ $t('settings.customizeShortcuts') }}</span>
          <svg class="arrow-icon" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="tips-card">
      <h3 class="card-title">{{ $t('settings.usageTips') }}</h3>
      <div class="tips-list">
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span class="tip-text">{{ $t('settings.shortcutTips.customization') }}</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">⚠️</span>
          <span class="tip-text">{{ $t('settings.shortcutTips.conflicts') }}</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🔧</span>
          <span class="tip-text">{{ $t('settings.shortcutTips.incognito') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const hoveredShortcut = ref<string | null>(null)

const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0)

const shortcuts = ref([
  {
    id: 'open',
    nameKey: 'openManager',
    descKey: 'openManager',
    key: 'T',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="7" width="18" height="13" rx="2"/>
      <path d="M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2M9 11h6M9 15h4"/>
    </svg>`
  },
  {
    id: 'sort',
    nameKey: 'quickSort',
    descKey: 'quickSort',
    key: 'S',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 4h13M3 8h9M3 12h5M13 12v8m0 0l-4-4m4 4l4-4"/>
    </svg>`
  },
  {
    id: 'group',
    nameKey: 'smartGroup',
    descKey: 'smartGroup',
    key: 'G',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`
  },
  {
    id: 'ungroup',
    nameKey: 'ungroup',
    descKey: 'ungroup',
    key: 'U',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
    </svg>`
  }
])

const openShortcutsPage = () => {
  chrome.tabs.create({
    url: 'chrome://extensions/shortcuts'
  })
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

.shortcut-card,
.tips-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-primary);
}

.shortcut-card:hover,
.tips-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.shortcut-item:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.shortcut-item.active {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
}

.shortcut-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 8px;
  flex-shrink: 0;
}

.shortcut-icon :deep(svg) {
  width: 20px;
  height: 20px;
  stroke: white;
  fill: none;
}

.shortcut-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.shortcut-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  box-shadow: var(--shadow-sm);
}

.key-modifier {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.key-plus {
  font-size: 12px;
  color: var(--text-tertiary);
}

.key-main {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.shortcut-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border-secondary);
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.config-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.arrow-icon {
  width: 12px;
  height: 12px;
  margin-left: auto;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #5b9c7a;
}

.tip-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
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