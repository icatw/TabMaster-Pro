<template>
  <div class="filter-chips">
    <button
      v-for="filter in filters"
      :key="filter.id"
      @click="handleToggleFilter(filter.id)"
      :class="['filter-chip', { active: activeFilters.includes(filter.id) }]"
    >
      <span class="chip-icon">{{ filter.icon }}</span>
      <span class="chip-label">{{ filter.label }}</span>
      <span v-if="filter.count" class="chip-count">{{ filter.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// 定义Filter接口
interface Filter {
  id: string
  label: string
  icon: string
  count?: number
}

// Props定义
interface Props {
  filters: Filter[]
  activeFilters: string[]
}

defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  'toggle-filter': [filterId: string]
}>()

// 方法
const handleToggleFilter = (filterId: string) => {
  emit('toggle-filter', filterId)
}
</script>

<style scoped>
/* 筛选标签 */
.filter-chips {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-chips::-webkit-scrollbar {
  height: 2px;
}

.filter-chips::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 1px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-chip:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.filter-chip.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.chip-icon {
  font-size: 12px;
}

.chip-count {
  padding: 0 4px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 10px;
}

.filter-chip.active .chip-count {
  background: var(--primary-light);
  opacity: 0.7;
}
</style>