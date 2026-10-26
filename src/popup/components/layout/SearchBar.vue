<template>
  <div class="search-wrapper">
    <svg class="search-icon" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      :placeholder="placeholder"
      class="search-input"
    />
    <button v-if="modelValue" @click="handleClear" class="clear-btn">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
// Props定义
interface Props {
  modelValue: string
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: '搜索...'
})

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
  'clear': []
}>()

// 方法
const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('search', value)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.search-wrapper {
  position: relative;
  border-radius: 10px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-primary);
  transition: var(--transition-colors), box-shadow 160ms ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--bg-elevated);
  box-shadow: var(--ring);
}

.clear-btn {
  position: absolute;
  right: 7px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.clear-btn svg {
  width: 12px;
  height: 12px;
}
</style>
