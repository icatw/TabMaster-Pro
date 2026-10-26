import type { SavedTabList } from '../types'

export interface SavedListStats {
  listCount: number
  itemCount: number
  oldestCreatedAt: number | null
}

export function getSavedListStats(lists: SavedTabList[]): SavedListStats {
  return {
    listCount: lists.length,
    itemCount: lists.reduce((total, list) => total + list.items.length, 0),
    oldestCreatedAt: lists.reduce<number | null>((oldest, list) =>
      oldest === null || list.createdAt < oldest ? list.createdAt : oldest, null)
  }
}

export function getExpiredSavedLists(
  lists: SavedTabList[],
  olderThan: number
): SavedTabList[] {
  if (!Number.isFinite(olderThan)) return []
  return lists.filter(list => list.createdAt < olderThan)
}
