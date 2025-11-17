const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const API_BASE = process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8124/api'
const RANDOM_IMAGE_API_URL = process.env.NUXT_PUBLIC_RANDOM_IMAGE_API_URL || 'https://pic.zz4th.space/'

const resolveOrigin = (input?: string | null) => {
  if (!input) return null
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

const resolveHost = (input?: string | null) => {
  if (!input) return null
  try {
    return new URL(input).host
  } catch {
    return null
  }
}

const imageDomains = [
  resolveHost(API_BASE),
  resolveHost(RANDOM_IMAGE_API_URL),
  resolveHost(SITE_URL)
].filter(Boolean) as string[]

const uniqueImageDomains = Array.from(new Set(imageDomains))

const apiOrigin = resolveOrigin(API_BASE)
const randomImageOrigin = resolveOrigin(RANDOM_IMAGE_API_URL)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
    timeline: {
      enabled: false  // Disable timeline to speed up dev server
    }
  },
  components: true,
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/image',
    'nuxt-delay-hydration',
    'nuxt-security',
    '@nuxt/scripts'
  ],

  security: {
    nonce: true,
    ssg: {
      meta: true,
      hashScripts: true,
      hashStyles: true
    },
    headers: {
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'cross-origin',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'SAMEORIGIN',
      xPermittedCrossDomainPolicies: 'none',
      referrerPolicy: 'no-referrer-when-downgrade',
      contentSecurityPolicy: {
        'base-uri': ["'none'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:', ...imageDomains.map(host => `https://${host}`)],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': ["'self'", 'https:', "'unsafe-inline'", "'nonce-{{nonce}}'"],
        'upgrade-insecure-requests': true
      },
    },
    rateLimiter: false,
    requestSizeLimiter: false
  },

  image: {
    provider: 'ipx',
    domains: uniqueImageDomains,
    formats: ['webp'],
    inject: true,
    presets: {
      default: {
        modifiers: {
          format: 'webp'
        }
      }
    },
    screens: {
      xxs: 32,
      xs: 64,
      s: 96,
      sm: 320,
      md: 640,
      lg: 768,
      xl: 1024,
      '2xl': 1280,
    }
  },

  delayHydration: {
    mode: 'init'
  },

  nitro: {
    preset: 'node-server',
    compressPublicAssets: true
  },
  ssr: true,
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
        // KaTeX CSS for LaTeX rendering in announcements（使用非阻塞加载）
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
          crossorigin: 'anonymous',
        },
        // Preconnect to API and image origins for faster resource loading
        ...(apiOrigin ? [
          { rel: 'dns-prefetch', href: apiOrigin },
          { rel: 'preconnect', href: apiOrigin, crossorigin: 'anonymous' as const }
        ] : []),
        ...(randomImageOrigin ? [
          { rel: 'dns-prefetch', href: randomImageOrigin },
          { rel: 'preconnect', href: randomImageOrigin, crossorigin: 'anonymous' as const }
        ] : []),
      ] as any
    }
  },

  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
        'lucide-vue-next',
        'dompurify',
        'axios',
        'photoswipe/lightbox',
        'photoswipe',
        'zod'
      ]
    },
    build: {
      cssCodeSplit: true,
      inlineCssModuleChunks: true,
      minify: 'esbuild',
      rollupOptions: {
        output: { manualChunks: { vendor: ['vue', 'vue-router'] } }
      }
    } as Record<string, any>
  },
  
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteUrl: SITE_URL,
      randomImageApiUrl: process.env.NUXT_PUBLIC_RANDOM_IMAGE_API_URL || 'https://pic.zz4th.space/',
      pageSize: process.env.NUXT_PUBLIC_PAGE_SIZE,
      // Mainland-friendly jsDelivr origin (used when building CDN links)
      jsdelivrOrigin: process.env.NUXT_PUBLIC_JSDELIVR_ORIGIN || 'https://fastly.jsdelivr.net',
    }
  },
  
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
    '/tos': { prerender: true },
    '/privacy': { prerender: true },

    '/sitemap.xml': {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },

    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/**/*.{css,js,woff2,png,jpg,webp,avif,svg}': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },

  // Some Experimental Optimizations
  experimental: {
    componentIslands: true,
    buildCache: true,
    viewTransition: true,
    asyncContext: true,
    renderJsonPayloads: true,
    inlineSSRStyles: true,
  } as Record<string, any>
})
