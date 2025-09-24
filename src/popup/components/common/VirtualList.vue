<template>
  <div class="virtual-list" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="contentStyle">
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item.data)"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item.data" :index="item.index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { throttle } from '@/shared/utils/performance'

interface Props {
  items: T[]
  itemHeight: number
  containerHeight?: number
  overscan?: number
  keyField?: keyof T
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  overscan: 5,
  keyField: 'id' as keyof T
})

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

// Calculate visible range
const visibleRange = computed(() => {
  const containerHeight = props.containerHeight
  const itemHeight = props.itemHeight
  const overscan = props.overscan

  const startIndex = Math.floor(scrollTop.value / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    props.items.length
  )

  return {
    start: Math.max(0, startIndex - overscan),
    end: endIndex
  }
})

// Visible items
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, index) => ({
    data: item,
    index: start + index
  }))
})

// Total height of all items
const totalHeight = computed(() => props.items.length * props.itemHeight)

// Content offset style
const contentStyle = computed(() => ({
  transform: `translateY(${visibleRange.value.start * props.itemHeight}px)`
}))

// Get unique key for each item
const getItemKey = (item: T): string | number => {
  if (props.keyField && item && typeof item === 'object') {
    return String(item[props.keyField])
  }
  return String(item)
}

// Throttled scroll handler for performance
const handleScroll = throttle((event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}, 16) // ~60fps

// Watch for items changes and reset scroll if needed
watch(() => props.items.length, (newLength, oldLength) => {
  if (newLength < oldLength && containerRef.value) {
    // If items were removed, ensure we don't scroll past the end
    const maxScrollTop = Math.max(0, totalHeight.value - props.containerHeight)
    if (scrollTop.value > maxScrollTop) {
      containerRef.value.scrollTop = maxScrollTop
      scrollTop.value = maxScrollTop
    }
  }
})

onMounted(() => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
})

// Scroll to specific index
const scrollToIndex = (index: number) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight
    containerRef.value.scrollTop = targetScrollTop
    scrollTop.value = targetScrollTop
  }
}

// Expose scroll method
defineExpose({
  scrollToIndex
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-phantom {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: relative;
  z-index: 1;
}

.virtual-list-item {
  position: relative;
}

/* Smooth scrolling */
.virtual-list {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) transparent;
}

.virtual-list::-webkit-scrollbar {
  width: 6px;
}

.virtual-list::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-list::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.virtual-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>