# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Recoverable Saved Lists backed by `chrome.storage.local`.
- Save the current window without closing it.
- Save and close selected tabs, with save-before-close behavior across single-tab, batch, keyboard, and group close paths.
- Restore a complete Saved List or an individual item, rename lists, and delete lists with confirmation.
- Versioned Saved List storage, legacy-data normalization, and URL deduplication.
- Unit tests for Saved List data handling and tab close/restore behavior.
- Pull-request CI for type checking, linting, tests, and production builds.
- Chrome Web Store listing and permission documentation.

### Changed

- Repositioned the product documentation around the local tab-collection and recovery workflow.
- Persisted theme mode as `auto`, `light`, or `dark`, including legacy key compatibility and system-theme updates.
- Pinned tabs now remain first and in place during sorting; case-sensitive sorting is honored.
- Grouping skips pinned and already grouped tabs, and respects existing groups when applying limits.
- Automatic sorting and automatic grouping are disabled by default.
- Replaced the incorrectly sized icon assets with real 16, 48, and 128 pixel PNGs.

### Fixed

- Sort moves now move tabs contiguously and preserve pinned tab positions.
- Missing `lastAccessed` values are handled consistently.
- Group colors support automatic, random, and manual strategies.
- Partial restore or close operations report actual success and failure counts.
- Bookmark group collapse state and configuration broadcasts stay synchronized with the popup.
- Removed unused `windows`, `webNavigation`, and `web_accessible_resources` manifest entries.

## [0.1.0]

Initial development version with Manifest V3, Vue 3, tab search, sorting, grouping, multi-select controls, keyboard navigation, settings, and Chinese/English localization.
