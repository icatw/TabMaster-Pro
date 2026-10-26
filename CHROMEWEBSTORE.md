# Chrome Web Store Listing — TabMaster Pro

> Last Updated: 2026-10-26

## Store Listing

**Extension Name**

TabMaster Pro

**Short Description**

管理 Chrome 标签页：搜索、排序、分组，并将当前窗口或选中标签保存到本机，随时恢复。

**Detailed Description**

TabMaster Pro 帮你在整理当前标签页和保存稍后阅读内容之间顺畅切换。

搜索并管理已打开的标签页和书签。按域名、标题、网址、最后访问时间或标签顺序整理窗口；也可以按域名创建标签组。多选功能支持批量关闭和分组，键盘用户可以完成导航、打开、选择和关闭操作。

Saved Lists 提供类似 OneTab 的标签收集流程。你可以保存整个当前窗口，也可以多选标签后一键保存并关闭。每个列表都可重命名、删除、整组恢复或单项恢复。扩展会先确认标签网址已保存，再执行支持的关闭操作；保存失败时不会关闭标签。

使用方法：点击工具栏中的 TabMaster Pro 图标；选择“保存当前窗口”，或进入多选模式选中标签后点击“保存并关闭已选标签”。Saved Lists 会保留在扩展弹窗中，浏览器重启后仍可恢复。

Saved Lists 和设置仅保存在当前浏览器的本地扩展存储中，不会上传到服务器，也不需要账户。扩展不读取或修改网页内容；访问网站的权限仅用于生成当前可见标签的缩略图。

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
| Screenshot 1 | 1280×800 或 640×400 | 🟡 Needs update | `screenshots/main-interface.png` |
| Screenshot 2 | 1280×800 或 640×400 | 🟡 Needs update | `screenshots/search-feature.png` |
| Screenshot 3 | 1280×800 或 640×400 | 🟡 Needs update | `screenshots/settings-page.png` |
| Small Promo Tile | 440×280 | ⬜ Not created | TODO |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | TODO |

Existing screenshots document the interface but do not use the Chrome Web Store's required dimensions. Capture updated screenshots that include Saved Lists before submission.

## Permissions Justification

| Permission | Type | Justification |
|---|---|---|
| `tabs` | `permissions` | Lists tabs in the current window, switches or closes user-selected tabs, creates tabs when restoring a saved list, and captures a thumbnail of the visible tab. |
| `tabGroups` | `permissions` | Reads, creates, and removes Chrome tab groups at the user's request. |
| `storage` | `permissions` | Stores settings and Saved Lists locally in the current browser so they survive popup and service-worker restarts. |
| `bookmarks` | `permissions` | Searches the user's existing bookmarks alongside open tabs. No bookmark is modified. |
| `<all_urls>` | `host_permissions` | Required by Chrome's `captureVisibleTab` to generate a thumbnail for the currently visible tab. The extension does not read or modify page content. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No data is transmitted off the device. The extension processes open-tab titles and URLs, bookmarks, settings, and saved links locally to provide its tab-management features. Saved Lists and settings remain in `chrome.storage.local` on the current browser. There is no analytics, account system, cloud sync, or remote API.

No item in the table below is transmitted to the developer or a third party.

| Data Type | Collected Off-Device? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|---|---|---|---|---|
| Personally identifiable info | No | No | Not used | No |
| Health info | No | No | Not used | No |
| Financial info | No | No | Not used | No |
| Authentication info | No | No | Not used | No |
| Personal communications | No | No | Not used | No |
| Location | No | No | Not used | No |
| Web history | No | No | Local tab and Saved Lists functionality only | No |
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

## Review Notes

### Known Issues / Limitations

- Saved Lists are local to the current browser and do not sync across devices.
- Chrome prevents extensions from reopening protected pages such as `chrome://` pages and the Chrome Web Store.
- Host access is requested for visible-tab thumbnails; reviewers should confirm the justification matches the published build.

### Rejection History

None.
