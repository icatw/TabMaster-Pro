/// <reference types="vite/client" />
/// <reference types="chrome" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vite 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Chrome Extension 全局类型扩展
declare global {
  interface Window {
    // 如果需要在 window 对象上添加自定义属性
  }
}

// 扩展 Chrome Tab 类型，添加 lastAccessed 属性
declare namespace chrome.tabs {
  interface Tab {
    lastAccessed?: number;
  }
}

export {}