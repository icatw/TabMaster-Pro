import type { AutoCollectionPreview } from '../types'
import { STORAGE_KEYS } from '../constants'
import { SavedTabsService } from './SavedTabsService'
import { findAutoCollectionCandidates, parseExcludedDomains } from '../utils/autoCollection'
import { StorageService } from '../utils/storage'

function isPreview(value: unknown): value is AutoCollectionPreview {
  if (typeof value !== 'object' || value === null) return false
  const preview = value as Partial<AutoCollectionPreview>
  return Number.isFinite(preview.createdAt) && Array.isArray(preview.candidates)
}

export class AutoCollectionService {
  static async getPreview(): Promise<AutoCollectionPreview | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_COLLECTION_PREVIEW)
    const preview = result[STORAGE_KEYS.AUTO_COLLECTION_PREVIEW]
    return isPreview(preview) ? preview : null
  }

  static async dismissPreview(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.AUTO_COLLECTION_PREVIEW)
  }

  static async scanAndStage(): Promise<AutoCollectionPreview | null> {
    const config = await StorageService.getConfig()
    if (!config.autoCollectEnabled || await this.getPreview()) return null

    const [tabs, savedData] = await Promise.all([
      chrome.tabs.query({}),
      SavedTabsService.getData()
    ])
    const savedUrls = new Set(savedData.lists.flatMap(list => list.items.map(item => item.url)))
    const candidates = findAutoCollectionCandidates(tabs, {
      now: Date.now(),
      afterDays: config.autoCollectAfterDays,
      excludedDomains: parseExcludedDomains(config.autoCollectExcludedDomains),
      savedUrls
    })
    if (candidates.length === 0) return null

    const preview: AutoCollectionPreview = { createdAt: Date.now(), candidates }
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_COLLECTION_PREVIEW]: preview })
    return preview
  }

  static async confirm(tabIds: number[]): Promise<{ listId: string, count: number }> {
    const preview = await this.getPreview()
    if (!preview) throw new Error('There is no automatic collection to review')

    const selectedIds = new Set(tabIds.filter(Number.isInteger))
    const previewIds = new Set(preview.candidates.map(candidate => candidate.tabId))
    const selectedPreviewIds = [...selectedIds].filter(id => previewIds.has(id))
    if (selectedPreviewIds.length === 0) throw new Error('Select at least one tab to collect')

    const reviewedCandidates = new Map(
      preview.candidates.map(candidate => [candidate.tabId, candidate])
    )
    const config = await StorageService.getConfig()
    const [tabs, savedData] = await Promise.all([
      Promise.all(selectedPreviewIds.map(async id => {
        try {
          return await chrome.tabs.get(id)
        } catch {
          return null
        }
      })),
      SavedTabsService.getData()
    ])
    const savedUrls = new Set(savedData.lists.flatMap(list => list.items.map(item => item.url)))
    const eligible = findAutoCollectionCandidates(
      tabs.filter((tab): tab is chrome.tabs.Tab => {
        if (tab === null || tab.id === undefined) return false
        // A tab can navigate while the preview is open. Never collect a different
        // page than the one the user reviewed, even if the tab ID stays the same.
        return reviewedCandidates.get(tab.id)?.url === tab.url
      }),
      {
        now: Date.now(),
        afterDays: config.autoCollectAfterDays,
        excludedDomains: parseExcludedDomains(config.autoCollectExcludedDomains),
        savedUrls
      }
    )
    if (eligible.length === 0) throw new Error('The reviewed tabs are no longer eligible')

    const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())
    const collectionLabel = chrome.i18n.getUILanguage().toLowerCase().startsWith('zh')
      ? '闲置标签收纳'
      : 'Inactive tabs'
    const list = await SavedTabsService.saveTabs(
      eligible.map(candidate => tabs.find(tab => tab?.id === candidate.tabId) as chrome.tabs.Tab),
      `${collectionLabel} ${date}`
    )
    if (!list) throw new Error('No tabs could be saved')

    await this.dismissPreview()
    return { listId: list.id, count: list.items.length }
  }
}
