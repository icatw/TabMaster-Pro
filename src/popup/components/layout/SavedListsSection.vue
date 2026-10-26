<template>
  <section class="saved-lists" aria-labelledby="saved-lists-title">
    <div class="section-heading">
      <button
        class="section-toggle"
        type="button"
        :aria-expanded="isExpanded"
        :aria-label="$t(isExpanded ? 'savedTabs.collapseSection' : 'savedTabs.expandSection')"
        @click="isExpanded = !isExpanded"
      >
        <svg
          class="section-chevron"
          :class="{ collapsed: !isExpanded }"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
        </svg>
        <span id="saved-lists-title" class="section-title">{{ $t('savedTabs.title') }}</span>
        <span class="list-count" :aria-label="$t('savedTabs.listCount', { count: lists.length })">
          {{ lists.length }}
        </span>
      </button>
      <span class="privacy-note">{{ $t('savedTabs.localOnly') }}</span>
    </div>

    <div v-if="isExpanded" class="section-body">
      <form class="save-controls" @submit.prevent="saveWindow">
        <label class="name-field">
          <span class="sr-only">{{ $t('savedTabs.nameLabel') }}</span>
          <input
            v-model="listName"
            type="text"
            maxlength="120"
            :placeholder="$t('savedTabs.namePlaceholder')"
          />
        </label>
        <button type="submit" class="action-button primary" :disabled="isSavingWindow">
          {{ isSavingWindow ? $t('common.loading') : $t('savedTabs.saveWindow') }}
        </button>
        <button
          type="button"
          class="action-button danger-outline"
          :disabled="props.selectedTabIds.size === 0 || isSavingAndClosing"
          @click="saveAndCloseSelected"
        >
          {{
            isSavingAndClosing
              ? $t('common.loading')
              : $t('savedTabs.saveAndCloseSelected', { count: props.selectedTabIds.size })
          }}
        </button>
      </form>

      <div class="list-status" aria-live="polite">
        <span v-if="isLoading">{{ $t('common.loading') }}</span>
        <span v-else-if="lists.length === 0">{{ $t('savedTabs.empty') }}</span>
      </div>

      <div v-if="lists.length > 0" class="lists">
        <article v-for="list in lists" :key="list.id" class="saved-list">
          <div class="list-header">
            <button
              type="button"
              class="list-expand"
              :aria-label="$t('savedTabs.toggleList', { name: list.name })"
              :aria-expanded="expandedListIds.has(list.id)"
              @click="toggleList(list.id)"
            >
              <svg
                class="list-chevron"
                :class="{ collapsed: !expandedListIds.has(list.id) }"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>

            <div class="list-summary">
              <h3 class="list-title">{{ list.name }}</h3>
              <p class="list-meta">
                {{ $t('savedTabs.itemCount', { count: list.items.length }) }}
                <span aria-hidden="true">·</span>
                {{ formatDate(list.updatedAt) }}
              </p>
            </div>

            <div class="list-actions">
              <button
                type="button"
                class="icon-button restore"
                :disabled="busyListId === list.id"
                :aria-label="$t('savedTabs.restoreListNamed', { name: list.name })"
                :title="$t('savedTabs.restoreListNamed', { name: list.name })"
                @click="restoreList(list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                </svg>
              </button>
              <button
                type="button"
                class="icon-button"
                :aria-label="$t('savedTabs.renameListNamed', { name: list.name })"
                :title="$t('savedTabs.renameListNamed', { name: list.name })"
                @click="openRenameDialog(list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" />
                </svg>
              </button>
              <button
                type="button"
                class="icon-button danger"
                :aria-label="$t('savedTabs.deleteListNamed', { name: list.name })"
                :title="$t('savedTabs.deleteListNamed', { name: list.name })"
                @click="openDeleteDialog(list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM8 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM11 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z" />
                  <path d="M2.5 3h11a.5.5 0 0 1 0 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a.5.5 0 0 1 0-1zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4zM5.5.5A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .5.5V2h-5V.5z" />
                </svg>
              </button>
            </div>
          </div>

          <ul v-if="expandedListIds.has(list.id)" class="saved-items">
            <li v-for="(item, index) in list.items" :key="`${list.id}-${index}`" class="saved-item">
              <img
                v-if="item.favIconUrl"
                :src="item.favIconUrl"
                class="item-icon"
                alt=""
                @error="hideBrokenIcon"
              />
              <span v-else class="item-icon fallback" aria-hidden="true">↗</span>
              <div class="item-copy">
                <span class="item-title" :title="item.title">{{ item.title }}</span>
                <span class="item-url" :title="item.url">{{ item.url }}</span>
              </div>
              <span v-if="item.pinned" class="item-pinned" :title="$t('tabs.pinned')">📌</span>
              <button
                type="button"
                class="restore-item-button"
                :disabled="busyItemKey === `${list.id}-${index}`"
                :aria-label="$t('savedTabs.restoreItemNamed', { title: item.title, name: list.name })"
                @click="restoreItem(list, index)"
              >
                {{ $t('savedTabs.restoreItem') }}
              </button>
            </li>
          </ul>
        </article>
      </div>
    </div>

    <dialog
      ref="renameDialog"
      class="saved-list-dialog"
      aria-labelledby="rename-dialog-title"
      @close="editingList = null"
    >
      <form method="dialog" @submit.prevent="confirmRename">
        <h2 id="rename-dialog-title">{{ $t('savedTabs.renameTitle') }}</h2>
        <label class="dialog-field">
          <span>{{ $t('savedTabs.nameLabel') }}</span>
          <input
            v-model="renameValue"
            type="text"
            maxlength="120"
            required
            autofocus
          />
        </label>
        <div class="dialog-actions">
          <button type="button" class="action-button" @click="renameDialog?.close()">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="action-button primary"
            :disabled="!renameValue.trim() || isRenaming"
          >
            {{ isRenaming ? $t('common.loading') : $t('common.save') }}
          </button>
        </div>
      </form>
    </dialog>

    <dialog
      ref="deleteDialog"
      class="saved-list-dialog"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      @close="deletingList = null"
    >
      <form method="dialog" @submit.prevent="confirmDelete">
        <h2 id="delete-dialog-title">{{ $t('savedTabs.deleteTitle') }}</h2>
        <p id="delete-dialog-description">
          {{ $t('savedTabs.deleteDescription', { name: deletingList?.name ?? '' }) }}
        </p>
        <div class="dialog-actions">
          <button type="button" class="action-button" @click="deleteDialog?.close()">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="action-button danger-filled"
            :disabled="isDeleting"
          >
            {{ isDeleting ? $t('common.loading') : $t('common.delete') }}
          </button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type {
  APIResponse,
  BatchOperationResult,
  SavedTabList
} from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'
import { getCurrentLocale, i18n } from '@/i18n'

interface Props {
  selectedTabIds: Set<number>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  notify: [message: string, type: 'success' | 'error']
  'tabs-updated': []
  'selection-cleared': []
}>()

const isExpanded = ref(true)
const listName = ref('')
const lists = ref<SavedTabList[]>([])
const expandedListIds = ref(new Set<string>())
const isLoading = ref(false)
const isSavingWindow = ref(false)
const isSavingAndClosing = ref(false)
const busyListId = ref<string | null>(null)
const busyItemKey = ref<string | null>(null)
const renameDialog = ref<HTMLDialogElement | null>(null)
const deleteDialog = ref<HTMLDialogElement | null>(null)
const editingList = ref<SavedTabList | null>(null)
const deletingList = ref<SavedTabList | null>(null)
const renameValue = ref('')
const isRenaming = ref(false)
const isDeleting = ref(false)

const dateFormatter = computed(() => new Intl.DateTimeFormat(getCurrentLocale(), {
  dateStyle: 'medium',
  timeStyle: 'short'
}))

const formatDate = (timestamp: number) => dateFormatter.value.format(new Date(timestamp))

async function send<T>(type: string, payload?: unknown): Promise<APIResponse<T>> {
  return chrome.runtime.sendMessage({ type, payload }) as Promise<APIResponse<T>>
}

async function loadLists() {
  isLoading.value = true
  try {
    const response = await send<SavedTabList[]>(MESSAGE_TYPES.GET_SAVED_LISTS)
    if (!response.success || !response.data) {
      throw new Error(response.error || i18n.global.t('savedTabs.loadFailed'))
    }
    lists.value = response.data
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.loadFailed'), 'error')
  } finally {
    isLoading.value = false
  }
}

function toggleList(id: string) {
  const next = new Set(expandedListIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedListIds.value = next
}

function operationMessage(result: BatchOperationResult, action: 'restore' | 'close') {
  const succeeded = result.successfulOperations
  const failed = result.failedOperations
  if (failed > 0 && succeeded > 0) {
    return action === 'restore'
      ? i18n.global.t('savedTabs.partialRestore', { count: succeeded, failed })
      : i18n.global.t('savedTabs.partialClose', { count: succeeded, failed })
  }
  if (succeeded === 0) {
    return action === 'restore'
      ? i18n.global.t('savedTabs.restoreFailed')
      : i18n.global.t('errors.batchCloseFailed')
  }
  return action === 'restore'
    ? i18n.global.t('savedTabs.restored', { count: succeeded })
    : i18n.global.t('savedTabs.savedAndClosed', { count: succeeded })
}

async function saveWindow() {
  if (isSavingWindow.value) return
  isSavingWindow.value = true
  try {
    const response = await send<SavedTabList>(MESSAGE_TYPES.SAVE_WINDOW, {
      name: listName.value.trim() || undefined
    })
    if (!response.success || !response.data) {
      throw new Error(response.error || i18n.global.t('savedTabs.saveFailed'))
    }
    listName.value = ''
    expandedListIds.value = new Set([response.data.id])
    await loadLists()
    emit('notify', i18n.global.t('savedTabs.saved', { count: response.data.items.length }), 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.saveFailed'), 'error')
  } finally {
    isSavingWindow.value = false
  }
}

async function saveAndCloseSelected() {
  if (props.selectedTabIds.size === 0 || isSavingAndClosing.value) return
  isSavingAndClosing.value = true
  try {
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.SAVE_AND_CLOSE_TABS, {
      tabIds: [...props.selectedTabIds],
      name: listName.value.trim() || undefined
    })
    const result = response.data
    if (!result) {
      throw new Error(response.error || i18n.global.t('errors.batchCloseFailed'))
    }

    await loadLists()
    if (result.successfulOperations > 0) {
      listName.value = ''
      emit('selection-cleared')
      emit('tabs-updated')
    }
    emit('notify', operationMessage(result, 'close'), result.failedOperations > 0 ? 'error' : 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('errors.batchCloseFailed'), 'error')
  } finally {
    isSavingAndClosing.value = false
  }
}

async function restoreList(list: SavedTabList) {
  if (busyListId.value) return
  busyListId.value = list.id
  try {
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.RESTORE_LIST, {
      id: list.id
    })
    const result = response.data
    if (!result) {
      throw new Error(response.error || i18n.global.t('savedTabs.restoreFailed'))
    }
    if (result.successfulOperations > 0) emit('tabs-updated')
    emit('notify', operationMessage(result, 'restore'), result.failedOperations > 0 ? 'error' : 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.restoreFailed'), 'error')
  } finally {
    busyListId.value = null
  }
}

async function restoreItem(list: SavedTabList, itemIndex: number) {
  const itemKey = `${list.id}-${itemIndex}`
  if (busyItemKey.value) return
  busyItemKey.value = itemKey
  try {
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.RESTORE_SAVED_ITEM, {
      id: list.id,
      itemIndex
    })
    const result = response.data
    if (!result) {
      throw new Error(response.error || i18n.global.t('savedTabs.restoreFailed'))
    }
    if (result.successfulOperations > 0) emit('tabs-updated')
    emit('notify', operationMessage(result, 'restore'), result.failedOperations > 0 ? 'error' : 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.restoreFailed'), 'error')
  } finally {
    busyItemKey.value = null
  }
}

function openRenameDialog(list: SavedTabList) {
  editingList.value = list
  renameValue.value = list.name
  nextTick(() => renameDialog.value?.showModal())
}

async function confirmRename() {
  if (!editingList.value || !renameValue.value.trim() || isRenaming.value) return
  isRenaming.value = true
  try {
    const response = await send(MESSAGE_TYPES.UPDATE_LIST, {
      id: editingList.value.id,
      name: renameValue.value
    })
    if (!response.success) throw new Error(response.error || i18n.global.t('savedTabs.renameFailed'))
    renameDialog.value?.close()
    await loadLists()
    emit('notify', i18n.global.t('savedTabs.renamed'), 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.renameFailed'), 'error')
  } finally {
    isRenaming.value = false
  }
}

function openDeleteDialog(list: SavedTabList) {
  deletingList.value = list
  nextTick(() => deleteDialog.value?.showModal())
}

async function confirmDelete() {
  if (!deletingList.value || isDeleting.value) return
  isDeleting.value = true
  try {
    const response = await send(MESSAGE_TYPES.DELETE_LIST, {
      id: deletingList.value.id
    })
    if (!response.success) throw new Error(response.error || i18n.global.t('savedTabs.deleteFailed'))
    deleteDialog.value?.close()
    await loadLists()
    emit('notify', i18n.global.t('savedTabs.deleted'), 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.deleteFailed'), 'error')
  } finally {
    isDeleting.value = false
  }
}

function hideBrokenIcon(event: Event) {
  ;(event.currentTarget as HTMLImageElement).hidden = true
}

onMounted(loadLists)
</script>

<style scoped>
.saved-lists {
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
}

.section-toggle {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.section-toggle:focus-visible,
.list-expand:focus-visible,
.icon-button:focus-visible,
.action-button:focus-visible,
.restore-item-button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.section-chevron,
.list-chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.section-chevron.collapsed,
.list-chevron.collapsed {
  transform: rotate(-90deg);
}

.section-title {
  font-size: 13px;
  font-weight: 700;
}

.list-count {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 18px;
}

.privacy-note {
  color: var(--text-tertiary);
  font-size: 11px;
}

.section-body {
  padding: 0 12px 10px;
}

.save-controls {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto auto;
  gap: 8px;
}

.name-field input,
.dialog-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 7px;
  font: inherit;
}

.action-button,
.restore-item-button {
  border: 1px solid var(--border-primary);
  border-radius: 7px;
  padding: 7px 10px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.action-button.primary {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--bg-primary);
}

.action-button.danger-outline {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.action-button.danger-filled {
  border-color: var(--danger-color);
  background: var(--danger-color);
  color: var(--bg-primary);
}

.action-button:disabled,
.restore-item-button:disabled,
.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.list-status {
  min-height: 20px;
  padding: 6px 2px 0;
  color: var(--text-tertiary);
  font-size: 11px;
}

.lists {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.saved-list {
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
}

.list-expand,
.icon-button {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.list-expand:hover,
.icon-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.icon-button svg {
  width: 14px;
  height: 14px;
}

.icon-button.restore {
  color: var(--primary-color);
}

.icon-button.danger {
  color: var(--danger-color);
}

.list-summary {
  min-width: 0;
  flex: 1;
}

.list-title {
  overflow: hidden;
  margin: 0;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  margin: 2px 0 0;
  color: var(--text-tertiary);
  font-size: 10px;
}

.list-meta span {
  padding: 0 3px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.saved-items {
  margin: 0;
  padding: 0 8px 8px 44px;
  list-style: none;
}

.saved-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 0;
  border-top: 1px solid var(--border-secondary);
}

.item-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border-radius: 3px;
}

.item-icon.fallback {
  color: var(--text-tertiary);
  text-align: center;
}

.item-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title,
.item-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title {
  color: var(--text-primary);
  font-size: 11px;
}

.item-url {
  color: var(--text-tertiary);
  font-size: 10px;
}

.item-pinned {
  font-size: 10px;
}

.restore-item-button {
  flex: 0 0 auto;
  padding: 4px 7px;
  font-size: 10px;
}

.saved-list-dialog {
  width: min(420px, calc(100vw - 32px));
  padding: 20px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}

.saved-list-dialog::backdrop {
  background: rgba(0, 0, 0, 0.45);
}

.saved-list-dialog h2 {
  margin: 0 0 14px;
  font-size: 17px;
}

.saved-list-dialog p {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.dialog-field {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
