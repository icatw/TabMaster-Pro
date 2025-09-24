import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

export default defineConfig({
  // 扫描文件
  content: {
    filesystem: [
      'src/**/*.{vue,js,ts,jsx,tsx}',
      'src/**/*.html'
    ]
  },
  
  // 预设
  presets: [
    presetUno(), // 默认预设
    presetAttributify(), // 属性化模式
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        // 可以添加图标集合
        // carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        // mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
      }
    }),
    presetTypography(), // 排版预设
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'Fira Code:400,500'
      },
      timeout: 5000, // 5秒超时
      inlineImports: false, // 不内联导入，避免构建时网络请求
      provider: 'none' // 关闭自动字体获取，使用本地字体
    })
  ],
  
  // 转换器
  transformers: [
    transformerDirectives(), // 支持 @apply 指令
    transformerVariantGroup() // 支持变体组语法
  ],
  
  // 主题配置
  theme: {
    colors: {
      // 扩展主题色彩
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    animation: {
      'fade-in': 'fadeIn 0.2s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-in': 'bounceIn 0.4s ease-out'
    }
  },
  
  // 自定义规则
  rules: [
    // 自定义动画关键帧
    ['animate-fade-in', {
      animation: 'fadeIn 0.2s ease-in-out'
    }],
    ['animate-slide-up', {
      animation: 'slideUp 0.3s ease-out'
    }]
  ],
  
  // 快捷方式
  shortcuts: [
    // 按钮样式
    ['btn', 'px-4 py-2 rounded-md font-medium transition-colors duration-200'],
    ['btn-primary', 'btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500'],
    ['btn-secondary', 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500'],
    ['btn-ghost', 'btn bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500'],
    
    // 卡片样式
    ['card', 'bg-white rounded-lg shadow-sm border border-gray-200 p-4'],
    ['card-hover', 'card hover:shadow-md transition-shadow duration-200'],
    
    // 输入框样式
    ['input', 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'],
    
    // 布局快捷方式
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    
    // 文本样式
    ['text-muted', 'text-gray-600'],
    ['text-error', 'text-red-600'],
    ['text-success', 'text-green-600']
  ],
  
  // 变体
  variants: [
    // 暗色主题变体
    (matcher) => {
      if (!matcher.startsWith('dark:'))
        return matcher
      return {
        matcher: matcher.slice(5),
        selector: s => `.dark ${s}`
      }
    }
  ],
  
  // 安全列表 - 确保这些类不会被清除
  safelist: [
    'bg-blue-600',
    'bg-red-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-cyan-600',
    'bg-orange-600',
    'bg-gray-600'
  ]
})