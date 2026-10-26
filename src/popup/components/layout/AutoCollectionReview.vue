<template>
  <section
    v-if="preview && preview.candidates.length > 0"
    class="auto-collection"
    aria-labelledby="auto-collection-title"
  >
    <div class="review-heading">
      <div>
        <h2 id="auto-collection-title">{{ $t('savedTabs.autoCollectionTitle') }}</h2>
        <p>{{ $t('savedTabs.autoCollectionDescription') }}</p>
      </div>
      <span class="candidate-count">{{ preview.candidates.length }}</span>
    </div>

    <fieldset class="candidate-list" :disabled="isBusy">
      <legend class="sr-only">{{ $t('savedTabs.autoCollectionTitle') }}</legend>
      <label
        v-for="candidate in preview.candidates"
        :key="candidate.tabId"
        class="candidate"
      >
        <input v-model="selectedTabIds" type="checkbox" :value="candidate.tabId" />
        <img v-if="candidate.favIconUrl" :src="candidate.favIconUrl" alt="" @error="hideBrokenIcon" />
        <span v-else class="candidate-icon" aria-hidden="true">↗</span>
        <span class="candidate-copy">
          <span class="candidate-title" :title="candidate.title">{{ candidate.title }}</span>
          <span class="candidate-url" :title="candidate.url">{{ candidate.url }}</span>
        </span>
      </label>
    </fieldset>

    <div class="review-actions">
      <button type="button" class="action-button" :disabled="isBusy" @click="dismiss">
        {{ $t('savedTabs.autoCollectionDismiss') }}
      </button>
      <button
        type="button"
        class="action-button primary"
        :disabled="isBusy || selectedTabIds.length === 0"
        @click="confirmSelection"
      >
        {{ isSaving ? $t('common.loading') : $t('savedTabs.autoCollectionCollect', { count: selectedTabIds.length }) }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { i18n } from '@/i18n'
import type { APIResponse, AutoCollectionPreview } from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'

const emit = defineEmits<{
  notify: [message: string, type: 'success' | 'error']
  changed: []
}>()

const preview = ref<AutoCollectionPreview | null>(null)
const selectedTabIds = ref<number[]>([])
const isSaving = ref(false)
const isBusy = ref(false)

async function loadPreview() {
  try {
    const response: APIResponse<AutoCollectionPreview | null> = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_AUTO_COLLECTION_PREVIEW
    })
    if (!response.success) throw new Error(response.error || 'Unable to load suggestions')
    preview.value = response.data ?? null
    selectedTabIds.value = []
  } catch (error) {
    console.error('Failed to load automatic collection preview:', error)
  }
}

async function confirmSelection() {
  if (selectedTabIds.value.length === 0) return
  isSaving.value = true
  isBusy.value = true
  try {
    const response: APIResponse<{ listId: string, count: number }> = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CONFIRM_AUTO_COLLECTION,
      payload: { tabIds: selectedTabIds.value }
    })
    if (!response.success) throw new Error(response.error || 'Unable to save suggestions')
    emit('notify', i18n.global.t('savedTabs.autoCollectionSaved', { count: response.data?.count ?? 0 }), 'success')
    preview.value = null
    emit('changed')
  } catch (error) {
    const message = error instanceof Error ? error.message : i18n.global.t('savedTabs.autoCollectionChanged')
    emit('notify', message, 'error')
    await loadPreview()
  } finally {
    isSaving.value = false
    isBusy.value = false
  }
}

async function dismiss() {
  isBusy.value = true
  try {
    const response: APIResponse = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.DISMISS_AUTO_COLLECTION
    })
    if (!response.success) throw new Error(response.error || 'Unable to dismiss suggestions')
    preview.value = null
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : 'Unable to dismiss suggestions', 'error')
  } finally {
    isBusy.value = false
  }
}

function hideBrokenIcon(event: Event) {
  (event.currentTarget as HTMLImageElement).hidden = true
}

onMounted(loadPreview)
</script>

<style scoped>
.auto-collection {
  margin: 0 16px 12px;
  padding: 14px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg-secondary);
}

.review-heading,
.review-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.review-heading h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
}

.review-heading p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.candidate-count {
  display: grid;
  min-width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
}

.candidate-list {
  display: grid;
  max-height: 190px;
  margin: 12px 0;
  padding: 0;
  overflow: auto;
  border: 0;
}

.candidate {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  padding: 6px 2px;
  cursor: pointer;
}

.candidate input {
  flex: 0 0 auto;
  accent-color: var(--primary-color);
}

.candidate img,
.candidate-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
}

.candidate-icon {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
}

.candidate-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.candidate-title,
.candidate-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-title {
  color: var(--text-primary);
  font-size: 12px;
}

.candidate-url {
  color: var(--text-tertiary);
  font-size: 11px;
}

.review-actions {
  justify-content: flex-end;
}

.action-button {
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 7px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.action-button.primary {
  border-color: var(--text-primary);
  background: var(--text-primary);
  color: var(--bg-primary);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.action-button:focus-visible,
.candidate input:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
