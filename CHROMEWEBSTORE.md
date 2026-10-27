# Chrome Web Store Listing — TabMaster Pro

> Last Updated: 2026-10-27

## Store Listing

**Extension Name**

TabMaster Pro

**Short Description**

管理 Chrome 标签页：搜索、排序、分组，并将当前窗口或选中标签保存到本机，随时恢复。

**Detailed Description**

TabMaster Pro 帮你在整理当前标签页和保存稍后阅读内容之间顺畅切换。

搜索并管理已打开的标签页和书签。按域名、标题、网址、最后访问时间或标签顺序整理窗口；也可以按域名创建标签组。多选功能支持批量关闭和分组，键盘用户可以完成导航、打开、选择和关闭操作。

Saved Lists 提供类似 OneTab 的标签收集流程。你可以保存整个当前窗口，保存并关闭当前窗口，或多选标签后一键保存并关闭。每个列表都可重命名、删除、整组恢复或单项恢复。列表可以放入本地工作区，方便按项目整理；新列表会进入当前工作区，也可以在列表操作区移动。列表搜索会和当前标签、书签搜索一起工作。扩展会先确认标签网址已保存，再执行支持的关闭操作；保存失败时不会关闭标签。重复检测会在当前窗口按完整网址分组，并优先建议保留活动、有声音或固定的标签；关闭前会先把其余标签保存为列表。每次列表变更都会保留本地快照，便于撤销误删或从浏览器重启后的状态恢复。你也可以导出本地 JSON 备份，并在预览后导入，导入不会覆盖现有列表；右键标签页可直接保存当前标签、选中标签或整个窗口。

使用方法：点击工具栏中的 TabMaster Pro 图标；选择“保存当前窗口”，或进入多选模式选中标签后点击“保存并关闭已选标签”。Saved Lists 会保留在扩展弹窗中，浏览器重启后仍可恢复。

Saved Lists 和设置默认保存在当前浏览器的本地扩展存储中，不需要账户。可选的 AI 摘要默认使用 Chrome 本机模型。若用户在设置中选择自定义 OpenAI 兼容服务并主动请求摘要，扩展会将列表名称、标签标题和网站域名发送到用户配置的服务；不会发送完整网址。API 密钥保存在本机扩展存储中，并仅用于向该服务发起认证请求。扩展不读取或修改网页内容；网站访问权限用于生成当前可见标签的缩略图和连接用户配置的模型服务。

问题与建议请提交至 https://github.com/icatw/TabMaster-Pro/issues 。

**Category**

Productivity

**Single Purpose**

查找、整理并恢复 Chrome 标签页和本地保存的标签集合。

**Primary Language**

Chinese (Simplified)

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|---|---|---|---|
| Store Icon | 128×128 PNG | ✅ Ready | `src/assets/icons/icon-128.png` |
| Screenshot 1 | 1280×800 PNG | ✅ Ready for workspace review | `screenshots/store-workspaces-1280x800.png` |
| Screenshot 2 | 1280×800 PNG | 🟡 Refresh after workspace release | `screenshots/store-confirmation-1280x800.png` |
| Screenshot 3 | 1280×800 PNG | 🟡 Refresh after workspace release | `screenshots/store-dark-mode-1280x800.png` |
| Screenshot 4 | 1280×800 PNG | 🟡 Refresh after workspace release | `screenshots/store-settings-1280x800.png` |
| Small Promo Tile | 440×280 | ⬜ Not created | TODO |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | TODO |

The primary workspace screenshot is a 1280×800 product capture based on the current
popup layout. The popup itself remains 620×600; use a fresh Chromium capture before
submitting the listing if the store review requires raw browser screenshots.

## Validation Evidence

Validated on 2026-10-27 with the production `dist` build loaded as an unpacked
extension in Chromium 131:

- The Manifest V3 manifest, service worker, popup, options page, declared
  permissions, and 16×16, 48×48, and 128×128 icons loaded successfully.
- The tested popup exposed accessible names for all 20 visible buttons.
- Saving the current window persisted across a popup reload; restoring one
  saved item created a new tab.
- Delete confirmation cancel and confirm paths worked with native modal dialog
  behavior.
- “Save and close selected” preserved the selected tabs in Saved Lists before
  closing them.
- Creating a workspace selected it for new lists; moving a list updated its
  workspace without changing its saved items.
- A legacy Saved Lists backup without workspace data migrated into the default
  Inbox workspace, and a current backup preserved workspace assignments.
- Live light/dark theme switching and the options page worked.
- All four shortcuts were bound: `Ctrl+Shift+Y` (open), `Ctrl+Shift+S` (sort),
  `Ctrl+Shift+X` (group), and `Ctrl+Shift+U` (ungroup).
- No console errors were captured during the tested workflows.

These checks supplement the automated type, lint, unit-test, and production
build checks documented in the repository.

## Permissions Justification

| Permission | Type | Justification |
|---|---|---|
| `tabs` | `permissions` | Lists tabs in the current window, switches or closes user-selected tabs, creates tabs when restoring a saved list, and captures a thumbnail of the visible tab. |
| `tabGroups` | `permissions` | Reads, creates, and removes Chrome tab groups at the user's request. |
| `storage` | `permissions` | Stores settings and Saved Lists locally in the current browser so they survive popup and service-worker restarts. |
| `bookmarks` | `permissions` | Searches the user's existing bookmarks alongside open tabs. No bookmark is modified. |
| `contextMenus` | `permissions` | Adds explicit right-click actions for saving the current tab, highlighted tabs, or the current window. |
| `<all_urls>` | `host_permissions` | Required by Chrome's `captureVisibleTab` to generate a thumbnail for the currently visible tab, and to connect to a model endpoint only after the user configures a custom provider and requests an AI summary. The extension does not read or modify page content. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** The developer does not collect user data. The extension processes open-tab titles and URLs, bookmarks, settings, and saved links locally to provide its tab-management features. Saved Lists and settings remain in `chrome.storage.local` on the current browser. Optional AI summaries use Chrome's on-device model by default. If a user configures a custom OpenAI-compatible provider and explicitly requests a summary, the extension sends the saved-list name, tab titles, and hostnames (not full URLs) to that user-selected provider. The API key is stored locally and sent to that provider only for authentication. There is no analytics, account system, or cloud sync.

The developer does not receive this data. The user-selected AI provider may process the summary input under its own privacy terms.

| Data Type | Collected Off-Device? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|---|---|---|---|---|
| Personally identifiable info | No | No | Not used | No |
| Health info | No | No | Not used | No |
| Financial info | No | No | Not used | No |
| Authentication info | No | Yes, the API key is sent to the user-selected model provider for authentication | Optional custom AI summaries | Only the provider chosen by the user |
| Personal communications | No | No | Not used | No |
| Location | No | No | Not used | No |
| Web history | No | Yes, only to a user-selected AI provider after an explicit summary request | Local tab and Saved Lists functionality; optional summary input includes hostnames and tab titles, not full URLs | Only the provider chosen by the user, for requested summaries |
| User activity | No | No | Local UI preferences and tab actions only | No |
| Website content | No | No | Not read or modified | No |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**

TODO — 上架前托管公开隐私政策并填入 URL。政策需要说明标签网址、书签、设置和 Saved Lists 仅保存在本机。

## Distribution

**Visibility**: Public

**Regions**: All regions

## Developer Info

**Publisher Name**: icatw

**Contact Email**: TODO

**Support URL / Email**: https://github.com/icatw/TabMaster-Pro/issues

**Homepage URL**: https://github.com/icatw/TabMaster-Pro

## Version History

| Version | Date | Changes | Status |
|---|---|---|---|
| 0.1.0 | Unreleased | Initial development version | Draft |
| 0.2.0 | 2026-10-26 | Added exact-URL duplicate review with save-before-close behavior, local JSON backup import/export, and optional saved-list AI summaries using Chrome's on-device model or a user-configured OpenAI-compatible provider. Custom summaries send list names, tab titles, and hostnames to the selected provider after the user requests them. Refresh store screenshots before submission. | Release candidate |
| 0.2.1 | 2026-10-26 | Fixed popup layout so open tabs remain visible and scrollable; saved-list management is collapsed by default. Refresh store screenshots before submission. | Release candidate |
| Unreleased | 2026-10-27 | Added save-and-close-current-window, unified Saved Lists search, local mutation snapshots with recovery, and right-click save actions for tabs and windows. Refresh store screenshots before submission. | Draft |
| Unreleased | 2026-10-27 | Added local workspaces for Saved Lists, workspace-aware saving, and moving lists between workspaces. Refresh store screenshots before submission. | Draft |

## Review Notes

### Known Issues / Limitations

- Saved Lists are local to the current browser and do not sync across devices.
- Chrome prevents extensions from reopening protected pages such as `chrome://` pages and the Chrome Web Store.
- Host access is requested for visible-tab thumbnails; reviewers should confirm the justification matches the published build.

### Rejection History

None.
