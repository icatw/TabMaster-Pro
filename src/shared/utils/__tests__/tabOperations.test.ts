import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TabInfo } from '@/shared/types'
import {
  chooseGroupColor,
  GroupService,
  planDomainGroups
} from '@/shared/utils/groups'
import { TabService } from '@/shared/utils/tabs'

const tab = (overrides: Partial<TabInfo>): TabInfo => ({
  id: 1,
  index: 0,
  windowId: 1,
  title: 'Example',
  url: 'https://example.com',
  domain: 'example.com',
  pinned: false,
  active: false,
  highlighted: false,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  lastAccessed: 0,
  ...overrides
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('tab sorting', () => {
  it('keeps pinned tabs first and honors case-insensitive title ordering', () => {
    const result = TabService.sortTabs([
      tab({ id: 1, index: 0, title: 'beta' }),
      tab({ id: 2, index: 1, title: 'Zulu', pinned: true }),
      tab({ id: 3, index: 2, title: 'Alpha' })
    ], {
      rule: 'title',
      ascending: true,
      caseSensitive: false
    })

    expect(result.tabs.map(sortedTab => sortedTab.id)).toEqual([2, 3, 1])
  })

  it('moves tabs into successive target indexes instead of reusing stale indexes', async () => {
    const move = vi.fn().mockResolvedValue({})
    vi.stubGlobal('chrome', { tabs: { move } })
    const sorted = [
      tab({ id: 10, index: 2 }),
      tab({ id: 11, index: 0 }),
      tab({ id: 12, index: 1 })
    ]

    const result = await TabService.applySorting({
      success: true,
      tabs: sorted,
      originalCount: 3,
      sortedCount: 3,
      rule: 'title',
      ascending: true,
      duration: 1
    })

    expect(result.success).toBe(true)
    expect(move.mock.calls).toEqual([
      [10, { index: 0 }],
      [11, { index: 1 }],
      [12, { index: 2 }]
    ])
  })
})

describe('domain grouping', () => {
  it('ignores pinned and already grouped tabs, enforces minimum size, and caps new groups', () => {
    vi.stubGlobal('chrome', { tabGroups: { TAB_GROUP_ID_NONE: -1 } })
    const groups = planDomainGroups([
      tab({ id: 1, domain: 'a.example' }),
      tab({ id: 2, domain: 'a.example' }),
      tab({ id: 3, domain: 'b.example' }),
      tab({ id: 4, domain: 'b.example' }),
      tab({ id: 5, domain: 'b.example' }),
      tab({ id: 6, domain: 'a.example', pinned: true }),
      tab({ id: 7, domain: 'a.example', groupId: 4 }),
      tab({ id: 8, domain: 'c.example' })
    ], { minTabsPerGroup: 2 }, 1)

    expect(Object.keys(groups)).toEqual(['b.example'])
    expect(groups['b.example'].map(groupTab => groupTab.id)).toEqual([3, 4, 5])
  })

  it('accounts for existing groups when enforcing the per-window limit', async () => {
    const groupTabs = vi.fn()
    vi.stubGlobal('chrome', {
      tabGroups: {
        TAB_GROUP_ID_NONE: -1,
        query: vi.fn().mockResolvedValue([{
          id: 9,
          title: 'Existing',
          color: 'blue'
        }])
      },
      tabs: {
        query: vi.fn().mockResolvedValue([
          { id: 20, url: 'https://existing.example' },
          { id: 21, url: 'https://existing.example' }
        ]),
        group: groupTabs
      }
    })

    const result = await GroupService.groupTabsByDomain([
      tab({ id: 1, domain: 'new.example' }),
      tab({ id: 2, domain: 'new.example' })
    ], { maxGroupsPerWindow: 1 })

    expect(result.groupCount).toBe(0)
    expect(result.message).toContain('上限')
    expect(groupTabs).not.toHaveBeenCalled()
  })

  it('supports manual and random color strategies', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(chooseGroupColor('a.example', [], {
      colorStrategy: 'manual',
      manualColor: 'purple'
    })).toBe('purple')
    expect(chooseGroupColor('a.example', [], {
      colorStrategy: 'random'
    })).toBe('grey')
  })
})
