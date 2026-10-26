<template>
  <div class="empty-state">
    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="M21 21l-4.35-4.35"></path>
    </svg>
    <p class="empty-text">{{ message }}</p>
    <button v-if="showAction" @click="handleAction" class="empty-action">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Props定义
interface Props {
  message: string
  showAction?: boolean
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  showAction: false,
  actionText: '操作'
})

// Emits定义
const emit = defineEmits<{
  'action': []
}>()

// 方法
const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--border-primary);
  margin-bottom: 12px;
}

.empty-text {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 12px 0;
}

.empty-action {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.empty-action:hover {
  background: var(--bg-hover);
}
</style>
