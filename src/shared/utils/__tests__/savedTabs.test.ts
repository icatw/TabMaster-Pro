import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SavedTabItem, SavedTabsData } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import {
  addSavedTabList,
  createSavedTabList,
  filterSavedTabLists,
  normalizeSavedTabsData,
  removeSavedTabList,
  renameSavedTabList,
  validateSavedTabsImport
} from '@/shared/utils/savedTabs'

const item = (url: string, title = url): SavedTabItem => ({
  url,
  title,
  pinned: false,
  createdAt: 100
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('saved tab data', () => {
  it('migrates old records, removes duplicate URLs, and orders lists by update time', () => {
    const migrated = normalizeSavedTabsData({
      lists: [
        {
          id: 'older',
          name: 'Older',
          createdAt: 10,
          updatedAt: 20,
          items: [item('https://example.com/a'), item(' https://example.com/a ')],
          unknown: 'ignored'
        },
        {
          id: 'newer',
          name: '  Newer  ',
          createdAt: 30,
          updatedAt: 40,
          items: [item('https://example.com/b')]
        },
        {
          id: 'newer',
          name: 'Duplicate id',
          createdAt: 50,
          updatedAt: 60,
          items: [item('https://example.com/c')]
        },
        {
          id: 'empty',
          name: 'Empty',
          items: []
        }
      ]
    }, 99)

    expect(migrated.version).toBe(2)
    expect(migrated.lists.map(list => list.name)).toEqual([
      'Duplicate id',
      'Newer',
      'Older'
    ])
    expect(migrated.lists[0].id).not.toBe('newer')
    expect(migrated.lists[2].items).toHaveLength(1)
    expect(migrated.lists[2].items[0].url).toBe('https://example.com/a')
  })

  it('creates a deduplicated list and ignores blank URLs', () => {
    const list = createSavedTabList([
      item('https://example.com'),
      item('https://example.com', 'Duplicate'),
      item('   '),
      item('https://example.org')
    ], ' Work ', 123, 'list-1')

    expect(list).toMatchObject({
      id: 'list-1',
      name: 'Work',
      createdAt: 123,
      updatedAt: 123
    })
    expect(list?.items.map(savedItem => savedItem.url)).toEqual([
      'https://example.com',
      'https://example.org'
    ])
    expect(createSavedTabList([], 'Nothing')).toBeNull()
  })

  it('preserves duplicate URLs and window metadata in session snapshots', () => {
    const session = normalizeSavedTabsData({
      lists: [{
        id: 'session',
        name: 'Research session',
        kind: 'session',
        windows: [{
          index: 0,
          focused: true,
          groups: [{ id: 7, title: 'Reading', color: 'blue', collapsed: true }]
        }],
        items: [
          { ...item('https://example.com/a'), session: { windowIndex: 0, tabIndex: 0, active: true, groupId: 7 } },
          { ...item('https://example.com/a'), session: { windowIndex: 0, tabIndex: 1, active: false, groupId: 7 } }
        ]
      }]
    })

    expect(session.lists[0]).toMatchObject({
      kind: 'session',
      windows: [{ focused: true, groups: [{ title: 'Reading', color: 'blue', collapsed: true }] }]
    })
    expect(session.lists[0].items).toHaveLength(2)
    expect(session.lists[0].items[1].session?.tabIndex).toBe(1)
  })

  it('validates versioned backups and rejects unsupported or active-content URLs', () => {
    const backup = {
      version: 2,
      lists: [{
        id: 'backup',
        name: 'Imported',
        createdAt: 1,
        updatedAt: 1,
        items: [item('https://example.com')]
      }]
    }

    expect(validateSavedTabsImport(backup).lists).toHaveLength(1)
    expect(() => validateSavedTabsImport({ ...backup, version: 1 })).toThrow(/Unsupported/)
    expect(() => validateSavedTabsImport({
      ...backup,
      lists: [{ ...backup.lists[0], items: [item('javascript:alert(1)')] }]
    })).toThrow(/URL/)
  })

  it('renames, reorders, adds, and removes saved lists', () => {
    const first = createSavedTabList([item('https://example.com')], 'First', 1, 'first')!
    const second = createSavedTabList([item('https://example.org')], 'Second', 2, 'second')!
    const data: SavedTabsData = {
      version: 1,
      lists: [first, second]
    }

    const renamed = renameSavedTabList(data, 'first', '  Renamed  ', 10)
    expect(renamed.lists[0]).toMatchObject({ id: 'first', name: 'Renamed', updatedAt: 10 })

    const added = addSavedTabList(data, first)
    expect(added.lists).toHaveLength(2)

    const removed = removeSavedTabList(data, 'first')
    expect(removed.lists.map(list => list.id)).toEqual(['second'])
    expect(() => removeSavedTabList(removed, 'missing')).toThrow('Saved list not found')
  })

  it('filters saved lists by name, title, and URL while retaining original item indexes', () => {
    const list = createSavedTabList([
      item('https://docs.example.com/guide', 'Developer Guide'),
      item('https://news.example.com/today', 'Daily News')
    ], 'Research', 1, 'research')!

    expect(filterSavedTabLists([list], '  RESEARCH  ')[0].items.map(entry => entry.index))
      .toEqual([0, 1])
    expect(filterSavedTabLists([list], 'developer')[0].items.map(entry => entry.index))
      .toEqual([0])
    expect(filterSavedTabLists([list], 'news.example.com')[0].items.map(entry => entry.index))
      .toEqual([1])
    expect(filterSavedTabLists([list], 'not found')).toEqual([])
  })
})

describe('saved tab service safety', () => {
  it('does not close tabs when persistence fails', async () => {
    const remove = vi.fn()
    const set = vi.fn().mockRejectedValue(new Error('quota exceeded'))
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set
        }
      },
      tabs: {
        get: vi.fn().mockResolvedValue({
          id: 1,
          title: 'Example',
          url: 'https://example.com',
          pinned: false
        }),
        remove
      }
    })
    const { SavedTabsService } = await import('@/shared/services/SavedTabsService')

    await expect(SavedTabsService.saveAndCloseTabs([1])).rejects.toThrow('quota exceeded')
    expect(set).toHaveBeenCalledOnce()
    expect(remove).not.toHaveBeenCalled()
  })

  it('counts missing or URL-less tabs as failures and only closes restorable tabs', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set
        }
      },
      tabs: {
        get: vi.fn()
          .mockResolvedValueOnce({
            id: 1,
            title: 'Example',
            url: 'https://example.com',
            pinned: false
          })
          .mockResolvedValueOnce({
            id: 2,
            title: 'No URL',
            url: '',
            pinned: false
          })
          .mockRejectedValueOnce(new Error('tab is gone')),
        remove
      }
    })
    const { SavedTabsService } = await import('@/shared/services/SavedTabsService')

    const result = await SavedTabsService.saveAndCloseTabs([1, 2, 3])

    expect(result).toMatchObject({
      success: false,
      totalOperations: 3,
      successfulOperations: 1,
      failedOperations: 2
    })
    expect(remove).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith(1)
    expect(set).toHaveBeenCalledOnce()
  })

  it('reports a partial restore and activates the first created tab', async () => {
    const saved = {
      version: 1,
      lists: [{
        id: 'work',
        name: 'Work',
        createdAt: 1,
        updatedAt: 2,
        items: [
          item('https://example.com/one', 'One'),
          item('https://example.com/two', 'Two')
        ]
      }]
    }
    const update = vi.fn().mockResolvedValue({})
    const create = vi.fn()
      .mockResolvedValueOnce({ id: 11 })
      .mockRejectedValueOnce(new Error('tab creation failed'))
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockImplementation(async (key: string) => ({
            [key || STORAGE_KEYS.SAVED_TABS]: saved
          })),
          set: vi.fn()
        }
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 1, windowId: 7 }]),
        create,
        update
      }
    })
    const { SavedTabsService } = await import('@/shared/services/SavedTabsService')

    const result = await SavedTabsService.restoreList('work')

    expect(result).toMatchObject({
      success: false,
      totalOperations: 2,
      successfulOperations: 1,
      failedOperations: 1
    })
    expect(create).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenCalledWith(11, { active: true })
  })

  it('skips URLs already open and restores the remaining items to the current window', async () => {
    const saved = {
      version: 1,
      lists: [{
        id: 'work',
        name: 'Work',
        createdAt: 1,
        updatedAt: 2,
        items: [item('https://example.com/open'), item('https://example.com/new')]
      }]
    }
    const create = vi.fn().mockResolvedValue({ id: 22 })
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({ [STORAGE_KEYS.SAVED_TABS]: saved })
        }
      },
      tabs: {
        query: vi.fn()
          .mockResolvedValueOnce([{ id: 1, windowId: 7 }])
          .mockResolvedValueOnce([{ id: 1, url: 'https://example.com/open' }]),
        create,
        update: vi.fn().mockResolvedValue({})
      }
    })
    const { SavedTabsService } = await import('@/shared/services/SavedTabsService')

    const result = await SavedTabsService.restoreList('work', { skipAlreadyOpen: true })

    expect(result).toMatchObject({
      totalOperations: 2,
      successfulOperations: 1,
      failedOperations: 0,
      skippedOperations: 1
    })
    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/new',
      windowId: 7
    }))
  })

  it('restores selected items into a new window and preserves selection order', async () => {
    const saved = {
      version: 1,
      lists: [{
        id: 'work',
        name: 'Work',
        createdAt: 1,
        updatedAt: 2,
        items: [item('https://example.com/one'), item('https://example.com/two')]
      }]
    }
    const createWindow = vi.fn().mockResolvedValue({ id: 8, tabs: [{ id: 80 }] })
    const createTab = vi.fn().mockResolvedValue({ id: 81 })
    const update = vi.fn().mockResolvedValue({})
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({ [STORAGE_KEYS.SAVED_TABS]: saved })
        }
      },
      windows: { create: createWindow },
      tabs: {
        create: createTab,
        update,
        query: vi.fn().mockResolvedValue([{ id: 80 }])
      }
    })
    const { SavedTabsService } = await import('@/shared/services/SavedTabsService')

    const result = await SavedTabsService.restoreSelectedItems([
      { listId: 'work', itemIndex: 1 },
      { listId: 'work', itemIndex: 0 },
      { listId: 'work', itemIndex: 1 }
    ], { target: 'new' })

    expect(result.successfulOperations).toBe(2)
    expect(createWindow).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/two',
      focused: true,
      type: 'normal'
    }))
    expect(createTab).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/one',
      windowId: 8
    }))
    expect(update).toHaveBeenCalledWith(80, { active: true })
  })
})
