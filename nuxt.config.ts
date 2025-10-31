const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  components: true,
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/image'
  ],

  image: {
    provider: 'ipx',
    domains: [
      new URL(process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost").host,
      new URL(process.env.NUXT_PUBLIC_RANDOM_IMAGE_API_URL ?? "http://localhost").host,
      new URL(SITE_URL).host
    ],
    formats: ['webp'],
    inject: true,
    presets: {
      default: {
        modifiers: {
          format: 'webp'
        }
      }
    }
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        prependPath: true,
        ws: true
      }
    },
    preset: process.env.NUXT_PRESET ?? 'bun',
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      title: '郑州四中表白墙',
      htmlAttrs: {
        lang: 'zh-CN'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'description', content: '郑州市第四高级中学校园信息交流平台，分享校园生活、表达心声的正规社区' },
        { name: 'keywords', content: '郑州四中,郑州市第四高级中学,表白墙,校园社区,学生交流' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
        { name: 'theme-color', content: '#ffffff' },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: '郑州四中表白墙' },
        { property: 'og:description', content: '郑州市第四高级中学校园信息交流平台，分享校园生活、表达心声的正规社区' },
        { property: 'og:site_name', content: '郑州四中表白墙' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:image', content: `${SITE_URL.replace(/\/+$/, '')}/badge.png` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '郑州四中表白墙' },
        { name: 'twitter:description', content: '郑州市第四高级中学校园信息交流平台，分享校园生活、表达心声的正规社区' },
        { name: 'twitter:image', content: `${SITE_URL.replace(/\/+$/, '')}/badge.png` }
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'alternate', hreflang: 'zh-CN', href: SITE_URL },
        { rel: 'icon', type: 'image/png', href: '/badge.png' },
        { rel: 'preconnect', href: 'https://static.geetest.com' },
        { rel: 'dns-prefetch', href: 'https://static.geetest.com' }
      ]
    }
  },

  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
  },
  
  runtimeConfig: {
    // Private runtime config (server only)
    geeTestKey: process.env.NUXT_GEETEST_KEY,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteUrl: SITE_URL,
      randomImageApiUrl: process.env.NUXT_PUBLIC_RANDOM_IMAGE_API_URL || 'https://pic.zz4th.space/',
      pageSize: process.env.NUXT_PUBLIC_PAGE_SIZE,
      // GeeTest Login ID
      geeTestId: process.env.NUXT_PUBLIC_GEETEST_ID,
      // GeeTest Register ID
      geeTestRegisterId: process.env.NUXT_PUBLIC_GEETEST_REGISTER_ID,
      // Mainland-friendly jsDelivr origin (used when building CDN links)
      jsdelivrOrigin: process.env.NUXT_PUBLIC_JSDELIVR_ORIGIN || 'https://fastly.jsdelivr.net',
    }
  },
  
  css: ['~/assets/css/main.css'],
  
  tailwindcss: {
    configPath: '~/tailwind.config.js'
  },

  build: {
    transpile: [],
    analyze: true
  },

  routeRules: {
    '/': { isr: 60 },
    '/posts/**': { isr: 600 },
    '/users/**': { isr: 600 },
    '/admin/**': { ssr: false },
    '/auth/**': { ssr: false },
    '/me/**': { ssr: false },
    '/debug': { ssr: false },
    '/test-**': { ssr: false },
    '/terminal': { ssr: false },

    '/sitemap.xml': {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },

    '/api/__proxy/posts/**/comments': { swr: 30 },
  },

  // Some Experimental Optimizations
  experimental: {
    componentIslands: true,
    buildCache: true,
    viewTransition: true,
    asyncContext: true
  }
})
