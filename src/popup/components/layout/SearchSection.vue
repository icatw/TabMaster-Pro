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
import { computed } from 'vue'
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

const props = defineProps<Props>()
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
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  padding: 16px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}
</style>