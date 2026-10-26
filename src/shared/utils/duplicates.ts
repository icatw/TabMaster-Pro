export interface DuplicateTabCandidate {
  id: number
  title: string
  url: string
  index: number
  pinned: boolean
  active: boolean
  audible: boolean
}

export interface DuplicateTabGroup {
  url: string
  tabs: DuplicateTabCandidate[]
  recommendedKeepId: number
}

/**
 * Find exact URL duplicates in a window. Exact matching is deliberate: query
 * parameters and fragments can change page meaning, so we never normalize them
 * away before offering a destructive action.
 */
export function findDuplicateTabGroups(
  tabs: chrome.tabs.Tab[]
): DuplicateTabGroup[] {
  const byUrl = new Map<string, DuplicateTabCandidate[]>()

  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url || !/^https?:/i.test(tab.url)) continue
    const candidates = byUrl.get(tab.url) ?? []
    candidates.push({
      id: tab.id,
      title: tab.title?.trim() || tab.url,
      url: tab.url,
      index: tab.index,
      pinned: tab.pinned === true,
      active: tab.active === true,
      audible: tab.audible === true
    })
    byUrl.set(tab.url, candidates)
  }

  return [...byUrl.entries()]
    .filter(([, candidates]) => candidates.length > 1)
    .map(([url, candidates]) => {
      const ordered = [...candidates].sort((left, right) => left.index - right.index)
      const recommended = ordered.find(tab => tab.active) ??
        ordered.find(tab => tab.audible) ??
        ordered.find(tab => tab.pinned) ??
        ordered[0]
      return { url, tabs: ordered, recommendedKeepId: recommended.id }
    })
    .sort((left, right) => left.tabs[0].index - right.tabs[0].index)
}

export function haveDuplicateGroupsChanged(
  previousGroups: DuplicateTabGroup[],
  currentGroups: DuplicateTabGroup[]
): boolean {
  const signature = (groups: DuplicateTabGroup[]) => groups
    .map(group => `${group.url}\u0000${group.tabs.map(tab => tab.id).sort((a, b) => a - b).join(',')}`)
    .sort()
    .join('\u0000')

  return signature(previousGroups) !== signature(currentGroups)
}
