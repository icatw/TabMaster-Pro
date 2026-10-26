import type { AutoCollectionCandidate } from '../types'

export const MAX_AUTO_COLLECTION_CANDIDATES = 100
type TabWithLastAccessed = chrome.tabs.Tab & { lastAccessed?: number }

export function parseExcludedDomains(value: string): string[] {
  return [...new Set(value
    .split(/[\n,]/)
    .map(entry => entry.trim().toLocaleLowerCase().replace(/^\*\./, '').replace(/^\./, ''))
    .flatMap(entry => {
      if (!entry) return []
      try {
        const hostname = new URL(`https://${entry}`).hostname.toLocaleLowerCase().replace(/\.$/, '')
        return hostname ? [hostname] : []
      } catch {
        return []
      }
    }))]
}

export function isExcludedDomain(hostname: string, excludedDomains: string[]): boolean {
  const normalizedHost = hostname.toLocaleLowerCase().replace(/\.$/, '')
  return excludedDomains.some(domain => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`))
}

export function findAutoCollectionCandidates(
  tabs: TabWithLastAccessed[],
  options: {
    now: number
    afterDays: number
    excludedDomains: string[]
    savedUrls?: ReadonlySet<string>
    limit?: number
  }
): AutoCollectionCandidate[] {
  const cutoff = options.now - options.afterDays * 24 * 60 * 60 * 1000
  const seenUrls = new Set<string>()

  return tabs.flatMap(tab => {
    if (
      tab.id === undefined ||
      tab.incognito ||
      tab.active ||
      tab.pinned ||
      tab.audible ||
      tab.status === 'loading' ||
      !Number.isFinite(tab.lastAccessed) ||
      (tab.lastAccessed as number) > cutoff ||
      !tab.url ||
      options.savedUrls?.has(tab.url)
    ) return []

    let url: URL
    try {
      url = new URL(tab.url)
    } catch {
      return []
    }
    if (!['http:', 'https:'].includes(url.protocol) || isExcludedDomain(url.hostname, options.excludedDomains)) return []
    if (seenUrls.has(tab.url)) return []
    seenUrls.add(tab.url)

    return [{
      tabId: tab.id,
      windowId: tab.windowId,
      index: tab.index,
      title: tab.title?.trim() || tab.url,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      lastAccessed: tab.lastAccessed as number
    }]
  })
    .sort((left, right) => left.lastAccessed - right.lastAccessed ||
      left.windowId - right.windowId || left.index - right.index)
    .slice(0, options.limit ?? MAX_AUTO_COLLECTION_CANDIDATES)
}
