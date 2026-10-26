<template>
  <div class="search-section">
    <SearchBar
      :model-value="searchQuery"
      :placeholder="$t('search.placeholder')"
      @update:model-value="updateSearchQuery"
      @search="handleSearch"
      @clear="clearSearch"
    />

    <!-- 快速筛选标签 -->
    <FilterChips
      :filters="filters"
      :active-filters="activeFilters"
      @toggle-filter="toggleFilter"
    />
  </div>
</template>

<script setup lang="ts">
import SearchBar from '@/popup/components/layout/SearchBar.vue'
import FilterChips from '@/popup/components/layout/FilterChips.vue'
import type { FilterConfig } from '@/shared/types'

interface Props {
  searchQuery: string
  filters: FilterConfig[]
  activeFilters: string[]
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'search', query: string): void
  (e: 'clear'): void
  (e: 'toggle-filter', filterId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const updateSearchQuery = (value: string) => {
  emit('update:searchQuery', value)
}

const handleSearch = (query: string) => {
  emit('search', query)
}

const clearSearch = () => {
  emit('clear')
}

const toggleFilter = (filterId: string) => {
  emit('toggle-filter', filterId)
}
</script>

<style scoped>
.search-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in oklab, var(--bg-primary) 94%, transparent);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-secondary);
  padding: 12px 16px 13px;
  gap: 10px;
  display: flex;
  flex-direction: column;
}
</style>
