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
          class="action-button"
          :disabled="isSavingSession"
          @click="saveSession"
        >
          {{ isSavingSession ? $t('common.loading') : $t('savedTabs.saveSession') }}
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
        <button
          type="button"
          class="action-button"
          :disabled="isScanningDuplicates || isClosingDuplicates"
          @click="reviewDuplicates"
        >
          {{ isScanningDuplicates ? $t('common.loading') : $t('savedTabs.reviewDuplicates') }}
        </button>
      </form>

      <div class="list-status" aria-live="polite">
        <span v-if="isLoading">{{ $t('common.loading') }}</span>
        <span v-else-if="lists.length === 0">{{ $t('savedTabs.empty') }}</span>
        <span v-else-if="searchQuery.trim() && filteredLists.length === 0">{{ $t('savedTabs.noSearchResults') }}</span>
      </div>

      <div class="saved-list-insights" :aria-label="$t('savedTabs.statsTitle')">
        <div class="saved-stat">
          <span>{{ $t('savedTabs.statsLists') }}</span>
          <strong>{{ stats.listCount }}</strong>
        </div>
        <div class="saved-stat">
          <span>{{ $t('savedTabs.statsItems') }}</span>
          <strong>{{ stats.itemCount }}</strong>
        </div>
        <div class="saved-stat oldest-stat">
          <span>{{ $t('savedTabs.statsOldest') }}</span>
          <strong>{{ stats.oldestCreatedAt === null ? $t('savedTabs.statsNone') : formatDate(stats.oldestCreatedAt) }}</strong>
        </div>
        <div class="cleanup-controls">
          <label class="cleanup-age-field">
            <span>{{ $t('savedTabs.cleanupOlderThan') }}</span>
            <select v-model.number="cleanupAgeDays" name="cleanup-age">
              <option :value="30">{{ $t('savedTabs.days', { count: 30 }) }}</option>
              <option :value="90">{{ $t('savedTabs.days', { count: 90 }) }}</option>
              <option :value="180">{{ $t('savedTabs.days', { count: 180 }) }}</option>
              <option :value="365">{{ $t('savedTabs.days', { count: 365 }) }}</option>
            </select>
          </label>
          <button type="button" class="action-button" :disabled="expiredLists.length === 0" @click="openCleanupDialog">
            {{ cleanupReviewText }}
          </button>
        </div>
      </div>

      <div v-if="lists.length > 0" class="saved-list-tools">
        <label class="saved-search">
          <span class="sr-only">{{ $t('savedTabs.searchLabel') }}</span>
          <input
            v-model="searchQuery"
            name="saved-tabs-search"
            type="search"
            autocomplete="off"
            :placeholder="$t('savedTabs.searchPlaceholder')"
          />
        </label>
        <label class="restore-target-field">
          <span>{{ $t('savedTabs.restoreTargetLabel') }}</span>
          <select v-model="restoreTarget" name="restore-target">
            <option value="current">{{ $t('savedTabs.restoreToCurrent') }}</option>
            <option value="new">{{ $t('savedTabs.restoreToNew') }}</option>
          </select>
        </label>
        <label class="skip-duplicates-field">
          <input v-model="skipAlreadyOpen" type="checkbox" />
          <span>{{ $t('savedTabs.skipAlreadyOpen') }}</span>
        </label>
        <div class="selection-actions">
          <span class="selection-count" aria-live="polite">
            {{ $t('savedTabs.selectedCount', { count: selectedItems.size }) }}
          </span>
          <button
            type="button"
            class="action-button"
            :disabled="visibleItemReferences.length === 0"
            @click="selectVisibleItems"
          >
            {{ $t('savedTabs.selectVisible') }}
          </button>
          <button
            type="button"
            class="action-button primary"
            :disabled="selectedItems.size === 0 || isRestoringSelection"
            @click="restoreSelectedItems"
          >
            {{ isRestoringSelection ? $t('common.loading') : $t('savedTabs.restoreSelected') }}
          </button>
        </div>
      </div>

      <div class="backup-actions">
        <button type="button" class="action-button" :disabled="isExporting" @click="exportBackup">
          {{ isExporting ? $t('common.loading') : $t('savedTabs.exportBackup') }}
        </button>
        <button type="button" class="action-button" @click="importFileInput?.click()">
          {{ $t('savedTabs.importBackup') }}
        </button>
        <input
          ref="importFileInput"
          class="sr-only"
          type="file"
          name="saved-tabs-backup"
          accept="application/json,.json"
          :aria-label="$t('savedTabs.importBackup')"
          @change="readImportFile"
        />
      </div>

      <div v-if="filteredLists.length > 0" class="lists">
        <article v-for="result in filteredLists" :key="result.list.id" class="saved-list">
          <div class="list-header">
            <button
              type="button"
              class="list-expand"
              :aria-label="$t('savedTabs.toggleList', { name: result.list.name })"
              :aria-expanded="isListExpanded(result.list.id)"
              :aria-controls="`saved-items-${result.list.id}`"
              @click="toggleList(result.list.id)"
            >
              <svg
                class="list-chevron"
                :class="{ collapsed: !isListExpanded(result.list.id) }"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>

            <div class="list-summary">
              <h3 class="list-title">{{ result.list.name }}</h3>
              <p class="list-meta">
                {{ $t('savedTabs.itemCount', { count: result.list.items.length }) }}
                <span aria-hidden="true">·</span>
                {{ formatDate(result.list.updatedAt) }}
              </p>
            </div>

            <div class="list-actions">
              <button
                type="button"
                class="icon-button restore"
                :disabled="busyListId === result.list.id"
                :aria-label="$t('savedTabs.restoreListNamed', { name: result.list.name })"
                :title="$t('savedTabs.restoreListNamed', { name: result.list.name })"
                @click="restoreList(result.list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                </svg>
              </button>
              <button
                type="button"
                class="icon-button"
                :aria-label="$t('savedTabs.renameListNamed', { name: result.list.name })"
                :title="$t('savedTabs.renameListNamed', { name: result.list.name })"
                @click="openRenameDialog(result.list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" />
                </svg>
              </button>
              <button
                type="button"
                class="icon-button danger"
                :aria-label="$t('savedTabs.deleteListNamed', { name: result.list.name })"
                :title="$t('savedTabs.deleteListNamed', { name: result.list.name })"
                @click="openDeleteDialog(result.list)"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM8 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM11 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z" />
                  <path d="M2.5 3h11a.5.5 0 0 1 0 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a.5.5 0 0 1 0-1zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4zM5.5.5A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .5.5V2h-5V.5z" />
                </svg>
              </button>
            </div>
          </div>

          <ul
            v-if="isListExpanded(result.list.id)"
            :id="`saved-items-${result.list.id}`"
            class="saved-items"
          >
            <li v-for="entry in result.items" :key="`${result.list.id}-${entry.index}`" class="saved-item">
              <label class="item-select">
                <input
                  type="checkbox"
                  :checked="isItemSelected(result.list.id, entry.index)"
                  :aria-label="$t('savedTabs.selectItemNamed', { title: entry.item.title })"
                  @change="toggleItemSelection(result.list.id, entry.index)"
                />
              </label>
              <img
                v-if="entry.item.favIconUrl"
                :src="entry.item.favIconUrl"
                class="item-icon"
                alt=""
                @error="hideBrokenIcon"
              />
              <span v-else class="item-icon fallback" aria-hidden="true">↗</span>
              <div class="item-copy">
                <span class="item-title" :title="entry.item.title">{{ entry.item.title }}</span>
                <span class="item-url" :title="entry.item.url">{{ entry.item.url }}</span>
              </div>
              <span v-if="entry.item.pinned" class="item-pinned" :title="$t('tabs.pinned')">📌</span>
              <button
                type="button"
                class="restore-item-button"
                :disabled="busyItemKey === `${result.list.id}-${entry.index}`"
                :aria-label="$t('savedTabs.restoreItemNamed', { title: entry.item.title, name: result.list.name })"
                @click="restoreItem(result.list, entry.index)"
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

    <dialog
      ref="cleanupDialog"
      class="saved-list-dialog cleanup-dialog"
      aria-labelledby="cleanup-dialog-title"
      aria-describedby="cleanup-dialog-description"
      @close="selectedCleanupIds = []"
    >
      <form method="dialog" @submit.prevent="confirmCleanup">
        <h2 id="cleanup-dialog-title">{{ $t('savedTabs.cleanupTitle') }}</h2>
        <p id="cleanup-dialog-description">
          {{ cleanupDescriptionText }}
        </p>
        <label class="cleanup-select-all">
          <input
            type="checkbox"
            :checked="allCleanupSelected"
            :disabled="isCleaningUp"
            @change="toggleCleanupSelection"
          />
          <span>{{ $t('savedTabs.selectAllExpired', { count: expiredLists.length }) }}</span>
        </label>
        <ul class="cleanup-list-options">
          <li v-for="list in expiredLists" :key="list.id">
            <label>
              <input v-model="selectedCleanupIds" type="checkbox" :value="list.id" :disabled="isCleaningUp" />
              <span class="cleanup-list-copy">
                <strong>{{ list.name }}</strong>
                <small>{{ $t('savedTabs.cleanupListMeta', { count: list.items.length, date: formatDate(list.createdAt) }) }}</small>
              </span>
            </label>
          </li>
        </ul>
        <div class="dialog-actions">
          <button type="button" class="action-button" :disabled="isCleaningUp" @click="cleanupDialog?.close()">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="action-button danger-filled" :disabled="selectedCleanupIds.length === 0 || isCleaningUp">
            {{ isCleaningUp ? $t('common.loading') : $t('savedTabs.confirmCleanup', { count: selectedCleanupIds.length }) }}
          </button>
        </div>
      </form>
    </dialog>

    <dialog
      ref="duplicatesDialog"
      class="saved-list-dialog duplicates-dialog"
      aria-labelledby="duplicates-dialog-title"
      aria-describedby="duplicates-dialog-description"
    >
      <form method="dialog" @submit.prevent="closeDuplicateTabs">
        <h2 id="duplicates-dialog-title">{{ $t('savedTabs.duplicatesTitle') }}</h2>
        <p id="duplicates-dialog-description">
          {{ $t('savedTabs.duplicatesDescription', { count: duplicateCloseIds.length }) }}
        </p>
        <div class="duplicate-groups">
          <fieldset v-for="(group, groupIndex) in duplicateGroups" :key="group.url" class="duplicate-group">
            <legend>{{ $t('savedTabs.duplicateGroup', { count: group.tabs.length }) }}</legend>
            <label v-for="tab in group.tabs" :key="tab.id" class="duplicate-choice">
              <input
                v-model="duplicateKeepIds[groupIndex]"
                type="radio"
                :name="`duplicate-keep-${groupIndex}`"
                :value="tab.id"
                :disabled="isClosingDuplicates"
              />
              <span class="duplicate-choice-copy">
                <strong>{{ tab.title }}</strong>
                <small>{{ tab.url }}</small>
              </span>
              <span v-if="tab.active" class="duplicate-badge">{{ $t('tabs.active') }}</span>
              <span v-else-if="tab.audible" class="duplicate-badge">{{ $t('tabs.audible') }}</span>
              <span v-if="tab.pinned" class="duplicate-badge">{{ $t('tabs.pinned') }}</span>
            </label>
          </fieldset>
        </div>
        <div class="dialog-actions">
          <button type="button" class="action-button" :disabled="isClosingDuplicates" @click="duplicatesDialog?.close()">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="action-button danger-filled"
            :disabled="duplicateCloseIds.length === 0 || isClosingDuplicates"
          >
            {{ isClosingDuplicates ? $t('common.loading') : $t('savedTabs.saveAndCloseDuplicates', { count: duplicateCloseIds.length }) }}
          </button>
        </div>
      </form>
    </dialog>

    <dialog
      ref="importDialog"
      class="saved-list-dialog"
      aria-labelledby="import-dialog-title"
      aria-describedby="import-dialog-description"
    >
      <form method="dialog" @submit.prevent="confirmImport">
        <h2 id="import-dialog-title">{{ $t('savedTabs.importPreviewTitle') }}</h2>
        <p id="import-dialog-description">
          {{ $t('savedTabs.importPreviewDescription', {
            lists: importPreview?.lists.length ?? 0,
            tabs: importItemCount,
            file: importFileName
          }) }}
        </p>
        <ul v-if="importPreview?.lists.length" class="backup-preview-lists">
          <li v-for="list in importPreview.lists" :key="list.id">
            <span>{{ list.name }}</span>
            <span>{{ $t('savedTabs.itemCount', { count: list.items.length }) }}</span>
          </li>
        </ul>
        <p v-if="importError" class="import-error" role="alert">{{ importError }}</p>
        <div class="dialog-actions">
          <button type="button" class="action-button" :disabled="isImporting" @click="importDialog?.close()">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="action-button primary" :disabled="!importPreview || isImporting">
            {{ isImporting ? $t('common.loading') : $t('savedTabs.confirmImport') }}
          </button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type {
  APIResponse,
  BatchOperationResult,
  SavedTabList,
  SavedTabReference,
  SavedTabRestoreOptions,
  SavedTabRestoreTarget,
  SavedTabsData
} from '@/shared/types'
import { MESSAGE_TYPES } from '@/shared/constants'
import { filterSavedTabLists, validateSavedTabsImport } from '@/shared/utils/savedTabs'
import { getExpiredSavedLists, getSavedListStats } from '@/shared/utils/savedListStats'
import {
  findDuplicateTabGroups,
  haveDuplicateGroupsChanged,
  type DuplicateTabGroup
} from '@/shared/utils/duplicates'
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
const searchQuery = ref('')
const expandedListIds = ref(new Set<string>())
const collapsedSearchListIds = ref(new Set<string>())
const selectedItems = ref(new Map<string, SavedTabReference>())
const restoreTarget = ref<SavedTabRestoreTarget>('current')
const skipAlreadyOpen = ref(true)
const isLoading = ref(false)
const isSavingWindow = ref(false)
const isSavingSession = ref(false)
const isSavingAndClosing = ref(false)
const busyListId = ref<string | null>(null)
const busyItemKey = ref<string | null>(null)
const renameDialog = ref<HTMLDialogElement | null>(null)
const deleteDialog = ref<HTMLDialogElement | null>(null)
const duplicatesDialog = ref<HTMLDialogElement | null>(null)
const importDialog = ref<HTMLDialogElement | null>(null)
const cleanupDialog = ref<HTMLDialogElement | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)
const importPreview = ref<SavedTabsData | null>(null)
const importFileName = ref('')
const importError = ref('')
const isExporting = ref(false)
const isImporting = ref(false)
const duplicateGroups = ref<DuplicateTabGroup[]>([])
const duplicateKeepIds = ref<number[]>([])
const isScanningDuplicates = ref(false)
const isClosingDuplicates = ref(false)
const editingList = ref<SavedTabList | null>(null)
const deletingList = ref<SavedTabList | null>(null)
const renameValue = ref('')
const isRenaming = ref(false)
const isDeleting = ref(false)
const cleanupAgeDays = ref(90)
const selectedCleanupIds = ref<string[]>([])
const isCleaningUp = ref(false)
const isRestoringSelection = ref(false)

const filteredLists = computed(() => filterSavedTabLists(lists.value, searchQuery.value))
const stats = computed(() => getSavedListStats(lists.value))
const cleanupCutoff = computed(() => Date.now() - cleanupAgeDays.value * 24 * 60 * 60 * 1000)
const expiredLists = computed(() => getExpiredSavedLists(lists.value, cleanupCutoff.value))
const expiredItemCount = computed(() => expiredLists.value.reduce((total, list) => total + list.items.length, 0))
const cleanupReviewText = computed(() => i18n.global.t(
  expiredLists.value.length === 1 ? 'savedTabs.reviewCleanupSingular' : 'savedTabs.reviewCleanup',
  { count: expiredLists.value.length }
))
const cleanupDescriptionText = computed(() => i18n.global.t(
  expiredLists.value.length === 1 ? 'savedTabs.cleanupDescriptionSingular' : 'savedTabs.cleanupDescription',
  { count: expiredLists.value.length, tabs: expiredItemCount.value, days: cleanupAgeDays.value }
))
const allCleanupSelected = computed(() => expiredLists.value.length > 0 &&
  expiredLists.value.every(list => selectedCleanupIds.value.includes(list.id)))
const duplicateCloseIds = computed(() => duplicateGroups.value.flatMap((group, groupIndex) =>
  group.tabs.filter(tab => tab.id !== duplicateKeepIds.value[groupIndex]).map(tab => tab.id)
))
const importItemCount = computed(() => importPreview.value?.lists.reduce(
  (total, list) => total + list.items.length, 0
) ?? 0)

const visibleItemReferences = computed(() => filteredLists.value.flatMap(({ list, items }) =>
  items.map(({ index }) => ({ listId: list.id, itemIndex: index }))
))

const restoreOptions = computed<SavedTabRestoreOptions>(() => ({
  target: restoreTarget.value,
  skipAlreadyOpen: skipAlreadyOpen.value
}))

watch(searchQuery, () => {
  selectedItems.value.clear()
  collapsedSearchListIds.value = new Set()
})

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
  if (searchQuery.value.trim()) {
    const next = new Set(collapsedSearchListIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    collapsedSearchListIds.value = next
    return
  }
  const next = new Set(expandedListIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedListIds.value = next
}

function isListExpanded(id: string) {
  return searchQuery.value.trim()
    ? !collapsedSearchListIds.value.has(id)
    : expandedListIds.value.has(id)
}

function itemSelectionKey(listId: string, itemIndex: number) {
  return `${listId}:${itemIndex}`
}

function isItemSelected(listId: string, itemIndex: number) {
  return selectedItems.value.has(itemSelectionKey(listId, itemIndex))
}

function toggleItemSelection(listId: string, itemIndex: number) {
  const next = new Map(selectedItems.value)
  const key = itemSelectionKey(listId, itemIndex)
  if (next.has(key)) next.delete(key)
  else next.set(key, { listId, itemIndex })
  selectedItems.value = next
}

function selectVisibleItems() {
  selectedItems.value = new Map(visibleItemReferences.value.map(reference => [
    itemSelectionKey(reference.listId, reference.itemIndex),
    reference
  ]))
}

function operationMessage(result: BatchOperationResult, action: 'restore' | 'close') {
  const succeeded = result.successfulOperations
  const failed = result.failedOperations
  const skipped = result.skippedOperations ?? 0
  if (action === 'restore' && skipped > 0) {
    return i18n.global.t('savedTabs.restoreWithSkipped', { count: succeeded, skipped, failed })
  }
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

async function saveSession() {
  if (isSavingSession.value) return
  isSavingSession.value = true
  try {
    const response = await send<SavedTabList>(MESSAGE_TYPES.SAVE_SESSION, {
      name: listName.value.trim() || undefined
    })
    if (!response.data) throw new Error(response.error || i18n.global.t('savedTabs.saveFailed'))
    listName.value = ''
    await loadLists()
    emit('notify', response.data.name, 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.saveFailed'), 'error')
  } finally {
    isSavingSession.value = false
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

async function reviewDuplicates() {
  if (isScanningDuplicates.value) return
  isScanningDuplicates.value = true
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    duplicateGroups.value = findDuplicateTabGroups(tabs)
    duplicateKeepIds.value = duplicateGroups.value.map(group => group.recommendedKeepId)
    if (duplicateGroups.value.length === 0) {
      emit('notify', i18n.global.t('savedTabs.noDuplicates'), 'success')
      return
    }
    duplicatesDialog.value?.showModal()
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.duplicateScanFailed'), 'error')
  } finally {
    isScanningDuplicates.value = false
  }
}

async function closeDuplicateTabs() {
  if (duplicateCloseIds.value.length === 0 || isClosingDuplicates.value) return
  isClosingDuplicates.value = true
  try {
    const currentTabs = await chrome.tabs.query({ currentWindow: true })
    const currentGroups = findDuplicateTabGroups(currentTabs)
    if (haveDuplicateGroupsChanged(duplicateGroups.value, currentGroups)) {
      duplicateGroups.value = currentGroups
      duplicateKeepIds.value = currentGroups.map(group => group.recommendedKeepId)
      emit('notify', i18n.global.t('savedTabs.duplicatesChanged'), 'error')
      return
    }

    const tabIds = duplicateCloseIds.value
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.SAVE_AND_CLOSE_TABS, {
      tabIds,
      name: listName.value.trim() || i18n.global.t('savedTabs.duplicatesListName')
    })
    const result = response.data
    if (!result || result.successfulOperations === 0) {
      throw new Error(response.error || i18n.global.t('savedTabs.saveFailed'))
    }
    await loadLists()
    emit('tabs-updated')
    listName.value = ''
    duplicatesDialog.value?.close()
    emit('notify', i18n.global.t('savedTabs.duplicatesClosed', { count: result.successfulOperations }),
      result.failedOperations > 0 ? 'error' : 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.saveFailed'), 'error')
  } finally {
    isClosingDuplicates.value = false
  }
}

async function exportBackup() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const response = await send<SavedTabsData>(MESSAGE_TYPES.EXPORT_SAVED_TABS)
    if (!response.success || !response.data) {
      throw new Error(response.error || i18n.global.t('savedTabs.backupFailed'))
    }
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tabmaster-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    emit('notify', i18n.global.t('savedTabs.backupExported'), 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.backupFailed'), 'error')
  } finally {
    isExporting.value = false
  }
}

async function readImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importError.value = ''
  importPreview.value = null
  importFileName.value = file.name
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error(i18n.global.t('savedTabs.backupTooLarge'))
    const parsed: unknown = JSON.parse(await file.text())
    importPreview.value = validateSavedTabsImport(parsed)
    importDialog.value?.showModal()
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.backupInvalid'), 'error')
  }
}

async function confirmImport() {
  if (!importPreview.value || isImporting.value) return
  isImporting.value = true
  importError.value = ''
  try {
    const response = await send<{ listCount: number, itemCount: number }>(
      MESSAGE_TYPES.IMPORT_SAVED_TABS,
      importPreview.value
    )
    if (!response.success || !response.data) throw new Error(response.error || i18n.global.t('savedTabs.backupInvalid'))
    await loadLists()
    importDialog.value?.close()
    importPreview.value = null
    emit('notify', i18n.global.t('savedTabs.backupImported', response.data), 'success')
  } catch (error) {
    importError.value = error instanceof Error ? error.message : i18n.global.t('savedTabs.backupFailed')
  } finally {
    isImporting.value = false
  }
}

async function restoreList(list: SavedTabList) {
  if (busyListId.value) return
  busyListId.value = list.id
  try {
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.RESTORE_LIST, {
      id: list.id,
      options: restoreOptions.value
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
      itemIndex,
      options: restoreOptions.value
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

async function restoreSelectedItems() {
  if (selectedItems.value.size === 0 || isRestoringSelection.value) return
  isRestoringSelection.value = true
  try {
    const response = await send<BatchOperationResult>(MESSAGE_TYPES.RESTORE_SELECTED_ITEMS, {
      items: [...selectedItems.value.values()],
      options: restoreOptions.value
    })
    const result = response.data
    if (!result) throw new Error(response.error || i18n.global.t('savedTabs.restoreFailed'))
    selectedItems.value.clear()
    if (result.successfulOperations > 0) emit('tabs-updated')
    emit('notify', operationMessage(result, 'restore'), result.failedOperations > 0 ? 'error' : 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.restoreFailed'), 'error')
  } finally {
    isRestoringSelection.value = false
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

function openCleanupDialog() {
  selectedCleanupIds.value = []
  nextTick(() => cleanupDialog.value?.showModal())
}

function toggleCleanupSelection(event: Event) {
  selectedCleanupIds.value = (event.currentTarget as HTMLInputElement).checked
    ? expiredLists.value.map(list => list.id)
    : []
}

async function confirmCleanup() {
  if (selectedCleanupIds.value.length === 0 || isCleaningUp.value) return
  isCleaningUp.value = true
  try {
    const response = await send<{ listCount: number, itemCount: number }>(MESSAGE_TYPES.CLEANUP_SAVED_LISTS, {
      ids: [...selectedCleanupIds.value],
      olderThan: cleanupCutoff.value
    })
    if (!response.success || !response.data) {
      throw new Error(response.error || i18n.global.t('savedTabs.cleanupFailed'))
    }
    cleanupDialog.value?.close()
    await loadLists()
    emit('notify', i18n.global.t('savedTabs.cleaned', response.data), 'success')
  } catch (error) {
    emit('notify', error instanceof Error ? error.message : i18n.global.t('savedTabs.cleanupFailed'), 'error')
  } finally {
    isCleaningUp.value = false
  }
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
  background: color-mix(in oklab, var(--bg-secondary) 62%, var(--bg-primary));
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
}

.section-toggle {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-colors);
}

.section-toggle:focus-visible,
.cleanup-controls select:focus-visible,
.cleanup-controls .action-button:focus-visible,
.cleanup-list-options input:focus-visible,
.list-expand:focus-visible,
.icon-button:focus-visible,
.action-button:focus-visible,
.restore-item-button:focus-visible,
.saved-search input:focus-visible,
.restore-target-field select:focus-visible,
.skip-duplicates-field input:focus-visible,
.item-select input:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.section-toggle:hover {
  background: var(--bg-hover);
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
  padding: 0 14px 12px;
}

.saved-list-insights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin: 6px 0 2px;
  padding: 9px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}

.saved-stat {
  min-width: 0;
  display: grid;
  gap: 3px;
  color: var(--text-tertiary);
  font-size: 10px;
}

.saved-stat strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oldest-stat strong {
  font-size: 10px;
}

.cleanup-controls {
  grid-column: 1 / -1;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 8px;
  padding-top: 5px;
  border-top: 1px solid var(--border-secondary);
}

.cleanup-age-field {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 10px;
}

.cleanup-age-field select {
  min-width: 78px;
  padding: 6px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
}

.cleanup-controls .action-button {
  max-width: 58%;
  font-size: 10px;
}

.saved-list-tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding-top: 8px;
}

.backup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin: 8px 0 12px;
}

.saved-search input,
.restore-target-field select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 9px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
  font-size: 11px;
}

.restore-target-field {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 10px;
}

.restore-target-field select {
  width: auto;
}

.skip-duplicates-field {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 10px;
}

.skip-duplicates-field input,
.item-select input {
  accent-color: var(--primary-color);
}

.selection-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selection-count {
  flex: 1;
  color: var(--text-tertiary);
  font-size: 10px;
}

.save-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.name-field {
  grid-column: 1 / -1;
}

.name-field input,
.dialog-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  font: inherit;
}

.action-button,
.restore-item-button {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
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
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
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

.item-select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 16px;
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
  filter: grayscale(1);
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

.cleanup-dialog {
  max-height: min(520px, calc(100vh - 32px));
  overflow: auto;
}

.cleanup-list-options {
  display: grid;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  margin: 12px 0;
  padding: 0;
  list-style: none;
}

.cleanup-select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.cleanup-select-all input {
  accent-color: var(--text-primary);
}

.cleanup-list-options label {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 8px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.cleanup-list-options label:focus-within {
  border-color: var(--border-primary);
  background: var(--bg-secondary);
}

.cleanup-list-options input {
  margin: 2px 0 0;
  accent-color: var(--text-primary);
}

.cleanup-list-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.cleanup-list-copy strong,
.cleanup-list-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cleanup-list-copy strong {
  font-size: 11px;
}

.cleanup-list-copy small {
  color: var(--text-tertiary);
  font-size: 10px;
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

.import-error {
  padding: 9px 10px;
  border: 1px solid var(--border-danger, var(--border-primary));
  border-radius: 8px;
  color: var(--text-danger, var(--text-primary)) !important;
}

.backup-preview-lists {
  display: grid;
  gap: 6px;
  max-height: 180px;
  overflow: auto;
  margin: 12px 0;
  padding: 0;
  list-style: none;
}

.backup-preview-lists li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 11px;
}

.backup-preview-lists li span:first-child {
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duplicates-dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 32px));
  overflow: auto;
}

.duplicate-groups {
  display: grid;
  gap: 12px;
  max-height: 54vh;
  overflow: auto;
}

.duplicate-group {
  display: grid;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 10px;
  border: 1px solid var(--border-secondary);
  border-radius: 10px;
}

.duplicate-group legend {
  padding-inline: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.duplicate-choice {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 7px;
  border-radius: 7px;
  cursor: pointer;
}

.duplicate-choice:hover {
  background: var(--bg-secondary);
}

.duplicate-choice-copy {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.duplicate-choice-copy strong,
.duplicate-choice-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duplicate-choice-copy strong {
  font-size: 12px;
}

.duplicate-choice-copy small {
  color: var(--text-tertiary);
  font-size: 10px;
}

.duplicate-badge {
  flex: 0 0 auto;
  padding: 2px 5px;
  border: 1px solid var(--border-secondary);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 9px;
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
