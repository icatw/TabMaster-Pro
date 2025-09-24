import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n } from '@/i18n'

// 导入样式
import '@/assets/styles/main.css'
import 'uno.css'

// 创建 Vue 应用
const app = createApp(App)

// 使用 Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 使用国际化
app.use(i18n)

// 挂载应用
app.mount('#app')

// 应用加载完成后显示
const appElement = document.getElementById('app')
if (appElement) {
  appElement.classList.add('loaded')
}

// 开发环境下的调试信息
if (import.meta.env.DEV) {
  console.log('Popup app loaded in development mode')
}