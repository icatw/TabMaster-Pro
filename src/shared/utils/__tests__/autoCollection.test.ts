import { describe, expect, it } from 'vitest'
import {
  findAutoCollectionCandidates,
  isExcludedDomain,
  parseExcludedDomains
} from '@/shared/utils/autoCollection'

function tab(
  overrides: Partial<chrome.tabs.Tab> & { lastAccessed?: number }
): chrome.tabs.Tab & { lastAccessed?: number } {
  return {
    id: 1,
    windowId: 1,
    index: 0,
    url: 'https://example.com/article',
    title: 'Example article',
    lastAccessed: 1_000,
    active: false,
    pinned: false,
    audible: false,
    incognito: false,
    ...overrides
  } as chrome.tabs.Tab & { lastAccessed?: number }
}

describe('automatic collection rules', () => {
  it('parses domain exclusions and matches subdomains only at label boundaries', () => {
    const excluded = parseExcludedDomains(' example.com\n*.internal.test, bad value ')

    expect(excluded).toEqual(['example.com', 'internal.test'])
    expect(isExcludedDomain('docs.example.com', excluded)).toBe(true)
    expect(isExcludedDomain('notexample.com', excluded)).toBe(false)
  })

  it('keeps only old, inactive, unpinned, non-excluded unsaved web tabs', () => {
    const candidates = findAutoCollectionCandidates([
      tab({ id: 1, lastAccessed: 100, url: 'https://one.test/article' }),
      tab({ id: 2, lastAccessed: 200, url: 'https://two.test/article' }),
      tab({ id: 3, lastAccessed: 300, active: true }),
      tab({ id: 4, lastAccessed: 400, pinned: true }),
      tab({ id: 5, lastAccessed: 500, url: 'https://docs.example.com/page' }),
      tab({ id: 6, lastAccessed: 600, url: 'chrome://settings' }),
      tab({ id: 7, lastAccessed: 700, url: 'https://saved.example.com/page' }),
      tab({ id: 8, lastAccessed: 800, status: 'loading', url: 'https://loading.test/page' })
    ], {
      now: 10 * 24 * 60 * 60 * 1000,
      afterDays: 1,
      excludedDomains: ['example.com'],
      savedUrls: new Set(['https://saved.example.com/page'])
    })

    expect(candidates.map(candidate => candidate.tabId)).toEqual([1, 2])
  })

  it('sorts by age and caps the preview size', () => {
    const candidates = findAutoCollectionCandidates([
      tab({ id: 1, lastAccessed: 100, url: 'https://one.test/article' }),
      tab({ id: 2, lastAccessed: 200, url: 'https://two.test/article' }),
      tab({ id: 3, lastAccessed: 300, url: 'https://three.test/article' })
    ], {
      now: 10 * 24 * 60 * 60 * 1000,
      afterDays: 1,
      excludedDomains: [],
      limit: 2
    })

    expect(candidates.map(candidate => candidate.tabId)).toEqual([1, 2])
  })
})
