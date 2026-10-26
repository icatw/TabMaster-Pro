import { describe, expect, it } from 'vitest'
import { findDuplicateTabGroups, haveDuplicateGroupsChanged } from '@/shared/utils/duplicates'

const tab = (overrides: Partial<chrome.tabs.Tab>): chrome.tabs.Tab => ({
  id: 1,
  index: 0,
  windowId: 1,
  title: 'Example',
  url: 'https://example.com/page',
  active: false,
  pinned: false,
  audible: false,
  highlighted: false,
  selected: false,
  incognito: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  ...overrides
})

describe('duplicate tab review', () => {
  it('groups exact web URLs and recommends keeping the active tab', () => {
    const groups = findDuplicateTabGroups([
      tab({ id: 2, index: 1, title: 'Older' }),
      tab({ id: 3, index: 4, title: 'Current', active: true }),
      tab({ id: 4, index: 5, url: 'https://example.com/page?ref=other' }),
      tab({ id: 5, index: 6, url: 'chrome://settings' })
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].tabs.map(candidate => candidate.id)).toEqual([2, 3])
    expect(groups[0].recommendedKeepId).toBe(3)
  })

  it('prefers audible and then pinned tabs when no tab is active', () => {
    const audible = findDuplicateTabGroups([
      tab({ id: 1, index: 0, pinned: true }),
      tab({ id: 2, index: 1, audible: true })
    ])
    const pinned = findDuplicateTabGroups([
      tab({ id: 1, index: 0, pinned: true }),
      tab({ id: 2, index: 1 })
    ])

    expect(audible[0].recommendedKeepId).toBe(2)
    expect(pinned[0].recommendedKeepId).toBe(1)
  })

  it('detects duplicate groups that changed while being reviewed', () => {
    const previous = findDuplicateTabGroups([
      tab({ id: 1, index: 0 }),
      tab({ id: 2, index: 1 })
    ])
    const sameTabs = findDuplicateTabGroups([
      tab({ id: 2, index: 0 }),
      tab({ id: 1, index: 1 })
    ])
    const changedTabs = findDuplicateTabGroups([
      tab({ id: 1, index: 0 }),
      tab({ id: 2, index: 1, url: 'https://example.com/changed' })
    ])

    expect(haveDuplicateGroupsChanged(previous, sameTabs)).toBe(false)
    expect(haveDuplicateGroupsChanged(previous, changedTabs)).toBe(true)
  })
})
