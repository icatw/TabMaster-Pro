import { describe, expect, it } from 'vitest'
import type { SavedTabList } from '../../types'
import { getExpiredSavedLists, getSavedListStats } from '../savedListStats'

function makeList(id: string, createdAt: number, count: number): SavedTabList {
  return {
    id,
    name: id,
    createdAt,
    updatedAt: createdAt,
    workspaceId: 'workspace-inbox',
    items: Array.from({ length: count }, (_, index) => ({
      title: `Tab ${index}`,
      url: `https://example.com/${id}/${index}`,
      pinned: false,
      createdAt
    }))
  }
}

describe('saved list statistics and retention', () => {
  it('counts lists and saved tabs and finds the oldest list date', () => {
    const lists = [makeList('new', 300, 1), makeList('old', 100, 2)]

    expect(getSavedListStats(lists)).toEqual({
      listCount: 2,
      itemCount: 3,
      oldestCreatedAt: 100
    })
  })

  it('returns no oldest date when there are no lists', () => {
    expect(getSavedListStats([])).toEqual({
      listCount: 0,
      itemCount: 0,
      oldestCreatedAt: null
    })
  })

  it('includes only lists strictly older than the retention cutoff', () => {
    const lists = [makeList('old', 99, 1), makeList('boundary', 100, 2), makeList('new', 101, 3)]

    expect(getExpiredSavedLists(lists, 100).map(list => list.id)).toEqual(['old'])
    expect(getExpiredSavedLists(lists, Number.NaN)).toEqual([])
  })
})
