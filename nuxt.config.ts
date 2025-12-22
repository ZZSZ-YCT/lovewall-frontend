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
      enabled: true
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
    '@nuxt/scripts',
    '@nuxtjs/i18n'
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
      xPermittedCrossDomainPolicies: 'none',
      referrerPolicy: 'no-referrer-when-downgrade',
      contentSecurityPolicy: {
        'base-uri': ["'none'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'frame-src': ["'self'", 'https://player.bilibili.com'],
        'img-src': ["'self'", 'data:', 'https://picsum.photos', ...imageDomains.map(host => `https://${host}`)],
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

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json', language: 'en' },
      { code: 'ja', name: '日本語', file: 'ja.json', language: 'ja' },
      { code: 'zh_cn', name: '中文（简体）', file: 'zh_cn.json', language: 'zh-CN' },
      { code: 'zh_tw', name: '中文（繁體）', file: 'zh_tw.json', language: 'zh-TW' },
      { code: 'es', name: 'Español', file: 'es.json', language: 'es' },
      { code: 'fr', name: 'Français', file: 'fr.json', language: 'fr' },
      { code: 'de', name: 'Deutsch', file: 'de.json', language: 'de' },
      { code: 'ko', name: '한국어', file: 'ko.json', language: 'ko' },
      { code: 'ru', name: 'Русский', file: 'ru.json', language: 'ru' },
      { code: 'pt', name: 'Português', file: 'pt.json', language: 'pt' },
      { code: 'it', name: 'Italiano', file: 'it.json', language: 'it' },
      { code: 'ar', name: 'العربية', file: 'ar.json', language: 'ar' },
      { code: 'hi', name: 'हिन्दी', file: 'hi.json', language: 'hi' },
      { code: 'th', name: 'ไทย', file: 'th.json', language: 'th' },
      { code: 'vi', name: 'Tiếng Việt', file: 'vi.json', language: 'vi' },
      { code: 'id', name: 'Bahasa Indonesia', file: 'id.json', language: 'id' },
      { code: 'ms', name: 'Bahasa Melayu', file: 'ms.json', language: 'ms' },
      { code: 'nl', name: 'Nederlands', file: 'nl.json', language: 'nl' },
      { code: 'sv', name: 'Svenska', file: 'sv.json', language: 'sv' },
      { code: 'da', name: 'Dansk', file: 'da.json', language: 'da' },
      { code: 'fi', name: 'Suomi', file: 'fi.json', language: 'fi' },
      { code: 'pl', name: 'Polski', file: 'pl.json', language: 'pl' },
      { code: 'tr', name: 'Türkçe', file: 'tr.json', language: 'tr' },
      { code: 'he', name: 'עברית', file: 'he.json', language: 'he' },
      { code: 'el', name: 'Ελληνικά', file: 'el.json', language: 'el' },
      { code: 'ro', name: 'Română', file: 'ro.json', language: 'ro' },
      { code: 'hu', name: 'Magyar', file: 'hu.json', language: 'hu' },
      { code: 'uk', name: 'Українська', file: 'uk.json', language: 'uk' },
      { code: 'bn', name: 'বাংলা', file: 'bn.json', language: 'bn' },
      { code: 'fa', name: 'فارسی', file: 'fa.json', language: 'fa' },
      { code: 'sw', name: 'Kiswahili', file: 'sw.json', language: 'sw' }
    ],

    defaultLocale: 'zh_cn',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    baseUrl: SITE_URL
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
        { name: 'theme-color', content: '#ffffff' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:image', content: `${SITE_URL.replace(/\/+$/, '')}/badge.png` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${SITE_URL.replace(/\/+$/, '')}/badge.png` }
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'icon', type: 'image/png', href: '/badge.png' },
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
