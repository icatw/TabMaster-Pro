import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import manifest from './src/manifest.config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    crx({ manifest })
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    }
  },
  
  build: {
    rollupOptions: {
      input: {
        // 主要入口点将由 manifest 配置自动处理
        // 这里可以添加额外的入口点
      },
      // 防止资源重复输出
      output: {
        assetFileNames: (assetInfo) => {
          // 图标文件保持原路径，避免重复
          if (assetInfo.name && assetInfo.name.includes('icon-')) {
            return 'assets/icons/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // 优化构建输出
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    target: 'es2020'
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      'vue-i18n'
    ]
  },
  
  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
    __DEV__: process.env.NODE_ENV === 'development',
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false
  }
})