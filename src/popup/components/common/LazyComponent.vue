<template>
  <div class="lazy-component">
    <div v-if="!isLoaded && showPlaceholder" class="lazy-placeholder">
      <slot name="placeholder">
        <div class="loading-skeleton">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </slot>
    </div>
    <Transition name="fade" appear>
      <component
        v-if="isLoaded"
        :is="component"
        v-bind="componentProps"
        v-on="componentEvents"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  component: any
  componentProps?: Record<string, any>
  componentEvents?: Record<string, Function>
  delay?: number
  showPlaceholder?: boolean
  rootMargin?: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  componentProps: () => ({}),
  componentEvents: () => ({}),
  delay: 0,
  showPlaceholder: true,
  rootMargin: '50px',
  threshold: 0.1
})

const isLoaded = ref(false)
const containerRef = ref<HTMLElement>()
let observer: IntersectionObserver | null = null

const loadComponent = () => {
  if (isLoaded.value) return

  if (props.delay > 0) {
    setTimeout(() => {
      isLoaded.value = true
    }, props.delay)
  } else {
    isLoaded.value = true
  }
}

onMounted(() => {
  // Use Intersection Observer for viewport-based lazy loading
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent()
            observer?.disconnect()
          }
        })
      },
      {
        rootMargin: props.rootMargin,
        threshold: props.threshold
      }
    )

    if (containerRef.value) {
      observer.observe(containerRef.value)
    }
  } else {
    // Fallback for browsers without Intersection Observer
    loadComponent()
  }
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-component {
  min-height: 40px;
}

.lazy-placeholder {
  padding: 12px;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
  height: 12px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>