<template>
  <div
    class="bookmark-item"
    :class="{ 'keyboard-active': props.isKeyboardActive }"
    :data-nav-id="props.navId"
    @click="handleClick">
    <!-- 书签图标 -->
    <div class="bookmark-icon">
      <svg v-if="!favicon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
      </svg>
      <img v-else :src="favicon" @error="favicon = ''" alt="">
    </div>

    <!-- 书签信息 -->
    <div class="bookmark-content">
      <div class="bookmark-title" :title="bookmark.title">
        {{ bookmark.title || $t('bookmarks.untitledBookmark') }}
      </div>
      <div class="bookmark-url" :title="bookmark.url">
        {{ displayUrl }}
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="bookmark-actions">
      <button
        class="action-btn"
        @click.stop="openInNewTab"
        :title="$t('bookmarks.openInNewTab')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BookmarkInfo } from '@/shared/utils/bookmarks'
import { openBookmark } from '@/shared/utils/bookmarks'

// Props
interface Props {
  bookmark: BookmarkInfo
  isKeyboardActive?: boolean
  navId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isKeyboardActive: false
})

// Data
const favicon = ref('')

// Computed
const displayUrl = computed(() => {
  if (!props.bookmark.url) return ''
  try {
    const url = new URL(props.bookmark.url)
    return url.hostname
  } catch {
    return props.bookmark.url.slice(0, 50) + '...'
  }
})


// Methods
const handleClick = () => {
  if (props.bookmark.url) {
    // 在当前标签页打开
    openBookmark(props.bookmark.url, false)
    window.close()
  }
}

const openInNewTab = () => {
  if (props.bookmark.url) {
    openBookmark(props.bookmark.url, true)
  }
}

// Lifecycle
onMounted(async () => {
  // 获取网站图标
  if (props.bookmark.url) {
    try {
      const url = new URL(props.bookmark.url)
      favicon.value = `${url.origin}/favicon.ico`
    } catch {
      favicon.value = ''
    }
  }
})
</script>

<style scoped>
.bookmark-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  margin: 2px 0;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.bookmark-item:hover {
  background: var(--bg-hover);
}


/* 键盘导航高亮样式 */
.bookmark-item.keyboard-active {
  background: var(--primary-light);
  border: 2px solid var(--primary-color);
  padding-left: 5px;
  box-shadow: 0 0 0 2px var(--primary-light);
  position: relative;
  z-index: 1;
}

.bookmark-item.keyboard-active::before {
  opacity: 1;
  background: var(--primary-color);
  width: 4px;
}

/* 黑夜模式下加强键盘导航效果 */
[data-theme="dark"] .bookmark-item.keyboard-active {
  background: rgba(106, 176, 143, 0.25);
  border-color: #7fc0a0;
  box-shadow:
    0 0 0 1px rgba(127, 192, 160, 0.5),
    inset 0 0 0 1px rgba(127, 192, 160, 0.3);
}

[data-theme="dark"] .bookmark-item.keyboard-active .bookmark-title {
  color: #e8f5f0;
  font-weight: 600;
}

[data-theme="dark"] .bookmark-item.keyboard-active .bookmark-url,
[data-theme="dark"] .bookmark-item.keyboard-active .bookmark-folder {
  color: #b0d4c0;
}

.bookmark-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--warning-color);
  opacity: 0.8;
}

.bookmark-icon img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.bookmark-icon svg {
  width: 16px;
  height: 16px;
}

.bookmark-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.bookmark-title {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  max-width: 100%;
}

.bookmark-url {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}


.bookmark-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.bookmark-item:hover .bookmark-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;
}

.action-btn:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.action-btn svg {
  width: 12px;
  height: 12px;
}
</style>