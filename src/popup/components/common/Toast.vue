<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', type]">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props定义
interface Props {
  type: 'success' | 'error'
  message: string
  duration?: number
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2000,
  modelValue: true
})

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

// 内部状态
const visible = ref(props.modelValue)

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue && props.duration > 0) {
    setTimeout(() => {
      visible.value = false
      emit('update:modelValue', false)
      emit('close')
    }, props.duration)
  }
})

// 监听message变化，自动显示
watch(() => props.message, (newMessage) => {
  if (newMessage) {
    visible.value = true
    if (props.duration > 0) {
      setTimeout(() => {
        visible.value = false
        emit('update:modelValue', false)
        emit('close')
      }, props.duration)
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* Toast 样式 */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: white;
  border-radius: 8px;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 280px;
  white-space: nowrap;
}

.toast.success {
  border-left: 3px solid #48bb78;
  color: #2f855a;
}

.toast.error {
  border-left: 3px solid #fc8181;
  color: #c53030;
}

/* 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translate(-50%, 20px);
  opacity: 0;
}

.toast-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}
</style>