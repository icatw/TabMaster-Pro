import { describe, expect, it } from 'vitest'
import type { SavedTabsData } from '@/shared/types'
import { SAVED_TABS_SCHEMA_VERSION, STORAGE_KEYS } from '@/shared/constants'
import { SavedTabsService } from '@/shared/services/SavedTabsService'

describe('saved tabs import', () => {
  it('merges imported lists without replacing existing data or colliding IDs', async () => {
    const initial: SavedTabsData = {
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [{
        id: 'same-id',
        name: 'Existing',
        createdAt: 1,
        updatedAt: 1,
        items: [{ title: 'Existing', url: 'https://existing.example', pinned: false, createdAt: 1 }]
      }]
    }
    let stored: unknown = initial
    const store = {
      get: async () => ({ [STORAGE_KEYS.SAVED_TABS]: stored }),
      set: async (items: Record<string, unknown>) => { stored = items[STORAGE_KEYS.SAVED_TABS] }
    }

    const result = await SavedTabsService.importData({
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [{
        id: 'same-id',
        name: 'Imported',
        createdAt: 2,
        updatedAt: 2,
        items: [{ title: 'Imported', url: 'https://imported.example', pinned: false, createdAt: 2 }]
      }]
    }, store)

    const finalData = stored as SavedTabsData
    expect(result).toEqual({ listCount: 1, itemCount: 1 })
    expect(finalData.lists).toHaveLength(2)
    expect(finalData.lists[0].name).toBe('Imported')
    expect(finalData.lists[0].id).not.toBe('same-id')
    expect(finalData.lists[1].name).toBe('Existing')
  })

  it('assigns distinct IDs when imported lists collide with each other', async () => {
    let stored: unknown = { version: SAVED_TABS_SCHEMA_VERSION, lists: [] }
    const store = {
      get: async () => ({ [STORAGE_KEYS.SAVED_TABS]: stored }),
      set: async (items: Record<string, unknown>) => { stored = items[STORAGE_KEYS.SAVED_TABS] }
    }
    const list = {
      id: 'duplicate-id',
      name: 'Imported',
      createdAt: 1,
      updatedAt: 1,
      items: [{ title: 'Example', url: 'https://example.com', pinned: false, createdAt: 1 }]
    }

    await SavedTabsService.importData({
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [list, { ...list, name: 'Imported again' }]
    }, store)

    const ids = (stored as SavedTabsData).lists.map(item => item.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('saved tabs retention cleanup', () => {
  it('deletes only selected lists that still fall before the cutoff', async () => {
    const data: SavedTabsData = {
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [
        { id: 'old-selected', name: 'Old selected', createdAt: 10, updatedAt: 10, items: [
          { title: 'One', url: 'https://one.example', pinned: false, createdAt: 10 },
          { title: 'Two', url: 'https://two.example', pinned: false, createdAt: 10 }
        ] },
        { id: 'old-unselected', name: 'Old unselected', createdAt: 20, updatedAt: 20, items: [
          { title: 'Three', url: 'https://three.example', pinned: false, createdAt: 20 }
        ] },
        { id: 'new-selected', name: 'New selected', createdAt: 101, updatedAt: 101, items: [
          { title: 'Four', url: 'https://four.example', pinned: false, createdAt: 101 }
        ] }
      ]
    }
    let stored: unknown = data
    const store = {
      get: async () => ({ [STORAGE_KEYS.SAVED_TABS]: stored }),
      set: async (items: Record<string, unknown>) => { stored = items[STORAGE_KEYS.SAVED_TABS] }
    }

    const result = await SavedTabsService.cleanupLists(['old-selected', 'new-selected'], 100, store)

    expect(result).toEqual({ listCount: 1, itemCount: 2 })
    expect(new Set((stored as SavedTabsData).lists.map(list => list.id))).toEqual(new Set(['old-unselected', 'new-selected']))
  })
})

describe('saved tabs snapshots', () => {
  it('keeps the pre-mutation state for recovery', async () => {
    const initial: SavedTabsData = {
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [{
        id: 'before-import',
        name: 'Before import',
        createdAt: 1,
        updatedAt: 1,
        items: [{ title: 'Existing', url: 'https://existing.example', pinned: false, createdAt: 1 }]
      }]
    }
    const values: Record<string, unknown> = {
      [STORAGE_KEYS.SAVED_TABS]: initial,
      [STORAGE_KEYS.SAVED_TABS_SNAPSHOTS]: []
    }
    const store = {
      get: async (key: string) => ({ [key]: values[key] }),
      set: async (items: Record<string, unknown>) => { Object.assign(values, items) }
    }

    await SavedTabsService.importData({
      version: SAVED_TABS_SCHEMA_VERSION,
      lists: [{
        id: 'imported',
        name: 'Imported',
        createdAt: 2,
        updatedAt: 2,
        items: [{ title: 'Imported', url: 'https://imported.example', pinned: false, createdAt: 2 }]
      }]
    }, store)

    const snapshots = await SavedTabsService.getSnapshots(store)
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].reason).toBe('mutation')
    expect(snapshots[0].data).toEqual(initial)
    expect((values[STORAGE_KEYS.SAVED_TABS] as SavedTabsData).lists).toHaveLength(2)
  })

  it('caps recovery history to the latest eight snapshots', async () => {
    const values: Record<string, unknown> = {
      [STORAGE_KEYS.SAVED_TABS]: { version: SAVED_TABS_SCHEMA_VERSION, lists: [] },
      [STORAGE_KEYS.SAVED_TABS_SNAPSHOTS]: []
    }
    const store = {
      get: async (key: string) => ({ [key]: values[key] }),
      set: async (items: Record<string, unknown>) => { Object.assign(values, items) }
    }

    for (let index = 0; index < 10; index += 1) {
      await SavedTabsService.importData({
        version: SAVED_TABS_SCHEMA_VERSION,
        lists: [{
          id: `list-${index}`,
          name: `List ${index}`,
          createdAt: index + 1,
          updatedAt: index + 1,
          items: [{ title: `Tab ${index}`, url: `https://example.com/${index}`, pinned: false, createdAt: index + 1 }]
        }]
      }, store)
    }

    const snapshots = await SavedTabsService.getSnapshots(store)
    expect(snapshots).toHaveLength(8)
  })

  it('bounds recovery history by serialized size for large lists', async () => {
    const values: Record<string, unknown> = {
      [STORAGE_KEYS.SAVED_TABS]: { version: SAVED_TABS_SCHEMA_VERSION, lists: [] },
      [STORAGE_KEYS.SAVED_TABS_SNAPSHOTS]: []
    }
    const store = {
      get: async (key: string) => ({ [key]: values[key] }),
      set: async (items: Record<string, unknown>) => { Object.assign(values, items) }
    }
    const largeTitle = 'x'.repeat(900_000)

    for (let index = 0; index < 3; index += 1) {
      await SavedTabsService.importData({
        version: SAVED_TABS_SCHEMA_VERSION,
        lists: [{
          id: `large-${index}`,
          name: `Large ${index}`,
          createdAt: index + 1,
          updatedAt: index + 1,
          items: [{ title: largeTitle, url: `https://large.example/${index}`, pinned: false, createdAt: index + 1 }]
        }]
      }, store)
    }

    const snapshots = values[STORAGE_KEYS.SAVED_TABS_SNAPSHOTS] as unknown[]
    expect(JSON.stringify(snapshots).length).toBeLessThanOrEqual(2 * 1024 * 1024)
  })

  it('ignores malformed recovery records and normalizes valid payloads', async () => {
    const store = {
      get: async () => ({
        [STORAGE_KEYS.SAVED_TABS_SNAPSHOTS]: [
          null,
          { id: 'missing-data', createdAt: Date.now(), reason: 'mutation' },
          { id: 'bad-date', createdAt: 'now', reason: 'manual', data: {} },
          {
            id: 'valid',
            createdAt: 123,
            reason: 'manual',
            data: { version: 1, lists: [{
              id: 'recovered',
              name: 'Recovered',
              items: [{ title: 'Example', url: 'https://example.com', pinned: false, createdAt: 1 }]
            }] }
          }
        ]
      }),
      set: async () => undefined
    }

    const snapshots = await SavedTabsService.getSnapshots(store)

    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].id).toBe('valid')
    expect(snapshots[0].data.version).toBe(SAVED_TABS_SCHEMA_VERSION)
    expect(snapshots[0].data.lists[0].name).toBe('Recovered')
  })
})
