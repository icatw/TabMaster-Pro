# TabMaster Pro

**中文** | [English](./README.en.md) | [问题反馈](https://github.com/icatw/TabMaster-Pro/issues)

TabMaster Pro 是一个基于 Manifest V3、Vue 3、TypeScript 和 Vite 的 Chrome 标签页管理扩展。它提供实时标签页搜索、排序、分组、多选操作，以及可跨浏览器会话恢复的本地标签集合。

![TabMaster Pro 主界面](./screenshots/store-saved-tabs-1280x800.png)

## 与 OneTab 的定位

OneTab 的核心价值是把大量标签低摩擦地收拢到列表中，之后再恢复。TabMaster Pro 现在也提供这条完整路径：可以保存当前窗口，也可以保存并关闭已选标签；保存结果会持久化到 `chrome.storage.local`，浏览器重启后仍可恢复。

TabMaster Pro 同时保留了面向当前窗口的搜索、排序、分组和多选能力。Saved Lists 目前仅保存在当前浏览器内，不提供云同步、跨设备同步或公开分享。

## 功能

### Saved Lists

- 将当前窗口保存为命名列表，不关闭原标签。
- 多选标签后一次性保存并关闭。
- 恢复整个列表，或只恢复其中一个链接。
- 重命名或删除列表；删除前使用原生确认对话框。
- 列表保存后不会因单项恢复而自动删除，可重复使用。
- 同一列表内按 URL 去重；旧存储数据会迁移到版本化格式。
- 保存失败时不会执行关闭；部分恢复或关闭会报告实际成功与失败数量。
- 单标签关闭、批量关闭、键盘 `Delete` 和分组关闭都会先保存可恢复的 URL。

Saved Lists 数据仅存储在本机浏览器的 `chrome.storage.local` 中，不会上传到服务器。

### 标签页工作流

- 同时搜索已打开的标签页和书签，并高亮匹配内容。
- 按域名、标题、URL、最后访问时间或标签顺序排序。
- 按域名分组；固定标签和已有分组中的标签会跳过自动分组。
- 支持多标签选择、批量关闭和批量分组。
- 分组支持折叠和重命名。
- 键盘导航支持方向键、`Enter`、`Delete`、`Escape` 和 `Ctrl/Cmd+A`。

### 界面与配置

- 中文和英文界面。
- 自动、浅色、深色三种主题模式；自动模式会跟随系统主题变化。
- 配置保存在当前浏览器中。
- 弹窗和设置页使用响应式布局，并补充了键盘焦点、可访问名称和对话框语义。

## 安装与开发

### 环境要求

| 工具 | 要求 |
|---|---|
| Node.js | 18 或更高版本，推荐 20 LTS |
| npm | 8 或更高版本 |
| Chrome / Chromium | 100 或更高版本 |

### 本地开发

```bash
git clone https://github.com/icatw/TabMaster-Pro.git
cd TabMaster-Pro
npm ci
npm run dev
```

保持开发服务器运行，然后：

1. 打开 `chrome://extensions/`。
2. 开启右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目中的 `dist` 文件夹。

### 生产构建

```bash
npm run build
```

构建完成后，从 `dist` 目录加载扩展。如需生成 ZIP：

```bash
npm run build:zip
```

### 验证

```bash
npm run type-check
npm run lint:check
npm test -- --run
npm run build
```

## 快捷键

扩展在 Manifest 中提供以下建议快捷键，可在 `chrome://extensions/shortcuts` 查看实际绑定并修改：

| 功能 | Windows / Linux | macOS |
|---|---|---|
| 打开 TabMaster Pro | `Ctrl+Shift+Y` | `Command+Shift+Y` |
| 排序当前窗口 | `Ctrl+Shift+S` | `Command+Shift+S` |
| 按域名分组 | `Ctrl+Shift+X` | `Command+Shift+X` |
| 取消所有分组 | `Ctrl+Shift+U` | `Command+Shift+U` |

浏览器或操作系统可能占用部分组合键；以扩展快捷键设置页显示的结果为准。

## 权限说明

| 权限 | 用途 |
|---|---|
| `tabs` | 读取当前窗口标签、切换或关闭标签、创建恢复标签，以及生成可见标签缩略图。 |
| `tabGroups` | 创建、读取和取消标签分组。 |
| `storage` | 在当前浏览器保存设置和 Saved Lists。 |
| `bookmarks` | 搜索用户已存在的书签。 |
| `<all_urls>` | 允许 Chrome 的 `captureVisibleTab` 获取当前可见标签缩略图；扩展不读取或修改页面内容。 |

## 技术结构

```text
src/
├── background/              # Manifest V3 service worker 和消息处理
├── composables/             # 标签、搜索、键盘、主题等组合式逻辑
├── locales/                 # 中英文文案
├── options/                 # 设置页
├── popup/                   # 扩展弹窗
└── shared/
    ├── services/            # 标签、Saved Lists、缩略图服务
    ├── types/               # 共享类型
    └── utils/               # 排序、分组、存储和数据迁移
```

扩展页面通过 `chrome.runtime.sendMessage` 调用 service worker；共享业务逻辑位于 `src/shared`。测试使用 Vitest，并通过独立的 `vitest.config.ts` 避免开发构建插件影响测试进程。

## 已知限制

- Saved Lists 仅保存在当前浏览器，不支持云同步或跨设备恢复。
- 没有 AI 分组、账户、团队协作或配置导入导出功能。
- `chrome://` 页面、Chrome Web Store 等受保护页面无法由扩展重新打开。
- 自动分组只使用域名规则，不分析页面内容。

## 贡献

欢迎在 [GitHub Issues](https://github.com/icatw/TabMaster-Pro/issues) 报告问题和提出建议。提交代码前请运行“验证”部分列出的命令。

## 许可证

[MIT](./LICENSE)
