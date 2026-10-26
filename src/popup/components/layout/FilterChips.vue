<template>
  <div class="filter-chips">
    <button
      v-for="filter in filters"
      :key="filter.id"
      @click="handleToggleFilter(filter.id)"
      :class="['filter-chip', { active: activeFilters.includes(filter.id) }]"
      type="button"
      :aria-pressed="activeFilters.includes(filter.id)"
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
  margin-top: 0;
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
  min-height: 30px;
  padding: 5px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-chip:hover {
  background: var(--bg-hover);
  border-color: var(--border-primary);
  box-shadow: var(--shadow-sm);
}

.filter-chip.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--bg-primary);
}

.chip-icon {
  /* Text labels carry the meaning; hiding emoji avoids platform-dependent glyphs. */
  display: none;
}

.chip-count {
  padding: 0 4px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  font-size: 10px;
}

.filter-chip.active .chip-count {
  background: color-mix(in oklab, currentColor 18%, transparent);
  color: inherit;
}
</style>
