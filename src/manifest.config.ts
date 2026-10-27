import { defineManifest } from '@crxjs/vite-plugin'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string
  description: string
}

const { version, description } = packageJson

// 将 semver 版本转换为 Chrome 扩展版本格式
const [major, minor, patch, label = '0'] = version
  .replace(/[^\d.-]+/g, '')
  .split(/[.-]/)

export default defineManifest(async (env) => ({
  manifest_version: 3,

  // 基本信息
  name: env.mode === 'development' ? '[DEV] TabMaster Pro' : 'TabMaster Pro',
  description,
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,

  // 图标配置
  icons: {
    16: 'src/assets/icons/icon-16.png',
    48: 'src/assets/icons/icon-48.png',
    128: 'src/assets/icons/icon-128.png'
  },

  // 权限配置 - 遵循最小权限原则
  permissions: [
    'tabs',        // 标签页基础操作
    'tabGroups',   // 标签页分组 API (Chrome 89+)
    'storage',     // 配置存储
    'alarms',      // 周期性检查自动收纳建议
    'bookmarks',   // 书签搜索和访问
    'contextMenus' // 右键保存标签页
  ],

  // 主机权限 - 缩略图功能需要访问所有URL
  host_permissions: [
    '<all_urls>' // 需要此权限才能使用chrome.tabs.captureVisibleTab()获取缩略图
  ],

  // The tab context menu is available from Chrome 150.
  minimum_chrome_version: '150',

  // 扩展操作 (工具栏图标)
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'TabMaster Pro',
    default_icon: {
      16: 'src/assets/icons/icon-16.png',
      48: 'src/assets/icons/icon-48.png',
      128: 'src/assets/icons/icon-128.png'
    }
  },

  // 选项页面
  options_page: 'src/options/index.html',

  // 键盘快捷键
  commands: {
    '_execute_action': {
      suggested_key: {
        default: 'Ctrl+Shift+Y',
        mac: 'Command+Shift+Y'
      },
      description: '打开TabMaster Pro'
    },
    'sort-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S'
      },
      description: '一键排序标签页'
    },
    'group-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+X',
        mac: 'Command+Shift+X'
      },
      description: '一键分组标签页'
    },
    'ungroup-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+U',
        mac: 'Command+Shift+U'
      },
      description: '取消所有分组'
    }
  },

  // Service Worker (后台脚本)
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },

  // 内容安全策略
  content_security_policy: {
    extension_pages: 'script-src \'self\'; object-src \'self\''
  },

  // 开发模式下的额外配置
  ...(env.mode === 'development' && {
    // 开发模式下可以添加额外的权限或配置
  })
}))
