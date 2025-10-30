<template>
  <div class="space-y-8">
    <!-- Header -->
    <section>
      <div class="page-header">
        <h1 class="page-title">郑州市第四高级中学表白墙</h1>
        <p class="text-gray-600 max-w-2xl mx-auto">
          校园信息交流平台。在这里发布你的想法、分享校园生活，与同学建立联系。
        </p>
      </div>

      <ClientOnly>
        <!-- 快捷操作 -->
        <div v-if="auth.isAuthenticated" class="flex justify-center">
          <NuxtLink
            to="/posts/new"
            class="glass-button-secondary inline-flex items-center gap-2 rounded-full"
          >
            <PlusIcon class="w-5 h-5" />
            发布表白
          </NuxtLink>
        </div>
      </ClientOnly>
    </section>

    <!-- 最新表白 -->
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ClockIcon class="w-5 h-5 text-gray-600" />
          <h2 class="text-xl font-semibold text-gray-800">最新表白</h2>
        </div>
        <div class="flex items-center gap-2">
          <!-- 布局切换 -->
          <div
            v-if="!isMobile"
            class="flex items-center gap-1 p-1 bg-white/20 border border-white/20 backdrop-blur-sm rounded-lg shadow-sm"
          >
            <button
              :class="[
                'p-1.5 rounded text-xs transition-all',
                effectiveLayout === 'grid'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-brand-600'
              ]"
              title="网格布局"
              @click="layoutMode = 'grid'"
            >
              <GridIcon class="w-4 h-4" />
            </button>
            <button
              :class="[
                'p-1.5 rounded text-xs transition-all',
                effectiveLayout === 'list'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-brand-600'
              ]"
              title="列表布局"
              @click="layoutMode = 'list'"
            >
              <ListIcon class="w-4 h-4" />
            </button>
          </div>

          <GlassButton
            :disabled="pending"
            variant="secondary"
            class="!px-3 !py-1.5 text-sm"
            @click="refresh"
          >
            <RefreshCwIcon :class="['w-4 h-4', { 'animate-spin': pending }]" />
            刷新
          </GlassButton>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="space-y-4">
        <!-- 加载中 -->
        <div v-if="pending && posts.length === 0" class="text-center py-12">
          <LoadingSpinner size="lg" />
          <p class="mt-4 text-gray-600">加载表白中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!pending && posts.length === 0" class="text-center py-12">
          <HeartIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600 mb-4">还没有表白哦</p>
          <NuxtLink
            v-if="auth.isAuthenticated"
            to="/posts/new"
            class="glass-button-secondary inline-flex items-center gap-2"
          >
            <PlusIcon class="w-4 h-4" /> 成为第一个
          </NuxtLink>
        </div>

        <!-- 网格布局 -->
        <div v-else-if="effectiveLayout === 'grid'" :class="gridClasses">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :show-actions="auth.isAuthenticated"
            variant="grid"
            class="animate-fade-in-up"
            @refresh="refresh"
          />
        </div>

        <!-- 列表布局 -->
        <div
          v-else
          :class="['space-y-4', isMobile ? 'px-2' : 'max-w-3xl mx-auto']"
        >
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :show-actions="auth.isAuthenticated"
            variant="list"
            class="w-full animate-fade-in-up"
            @refresh="refresh"
          />
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !pending" class="text-center">
        <GlassButton
          :disabled="loadingMore"
          variant="secondary"
          @click="loadMore"
        >
          <LoadingSpinner v-if="loadingMore" size="sm" variant="white" />
          <span>{{ loadingMore ? '加载中...' : '加载更多' }}</span>
        </GlassButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, HeartIcon, ClockIcon, RefreshCwIcon, GridIcon, ListIcon } from 'lucide-vue-next'
import GlassButton from '~/components/ui/GlassButton.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import PostCard from '~/components/PostCard.vue'
import type { PostDto } from '~/types'

// composables
const auth = useAuthStore()
const home = useHomeStore()
const { isMobile, isTablet } = useDeviceSafe()

// 布局控制
const layoutMode = ref<'grid' | 'list' | 'auto'>('auto')
const effectiveLayout = computed(() => {
  if (isMobile.value) return 'list'
  if (layoutMode.value === 'auto') return 'grid'
  return layoutMode.value
})
const gridClasses = computed(() => {
  const base = 'grid gap-4 md:gap-6'
  if (isMobile.value) return `${base} grid-cols-1`
  if (isTablet.value) return `${base} grid-cols-1 sm:grid-cols-2`
  return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`
})

// 从 localStorage 读取布局偏好
onMounted(() => {
  const saved = localStorage.getItem('love-wall-layout')
  if (saved && ['grid', 'list', 'auto'].includes(saved)) layoutMode.value = saved as any
})
watch(layoutMode, (v) => !isMobile.value && localStorage.setItem('love-wall-layout', v))

// --- 数据加载 (SSR 友好) ---
const { data, pending, refresh, error } = await useAsyncData(
  'home-posts',
  async () => {
    await home.initialLoad()
    return {
      posts: home.posts,
      hasMore: home.hasMore,
    }
  },
  { server: true, lazy: false }
)

const posts = computed(() => (data.value?.posts ?? []) as PostDto[])
const hasMore = computed(() => data.value?.hasMore ?? false)
const loadingMore = computed(() => home.loadingMore)

// 加载更多
const loadMore = async () => {
  await home.loadMore()
  data.value.posts = home.posts
}

// Use Vue Router 4 composition guard signature (no next)
onBeforeRouteUpdate((to, from) => {
  if (to.fullPath === from.fullPath) {
    return
  }

  home.refreshIfStale().catch((error) => {
    console.error('Index: onBeforeRouteUpdate refresh failed', error)
  })
})

// When returning to this page via in-app navigation, refresh to ensure data is shown
onActivated(async () => {
  try {
    await home.refreshIfStale()
  } catch (e) {
    console.error('Index: onActivated refresh failed', e)
  }
})

// Set page meta
const homepageMetaTitle = '郑州四中表白墙'
const homepageTitle = '郑州四中表白墙 - 校园信息交流平台'
const homepageDescription = '郑州四中官方校园信息交流平台，帮助同学匿名分享心声、表白与校园资讯，营造温暖真实的互动社区。'
const homepageKeywords = '郑州四中表白墙,郑州四中,校园表白墙,学生互动,校园社区'
const siteName = '郑州四中表白墙'

const runtimeConfig = useRuntimeConfig()
const route = useRoute()

const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  if (import.meta.client && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '')
  }
  return ''
})

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const path = route.fullPath || '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
})

const homepageOgImage = computed(() => {
  const base = normalizedSiteOrigin.value
  if (!base) {
    return '/badge.png'
  }
  return `${base}/badge.png`
})

const homepageStructuredData = computed(() => {
  const base = normalizedSiteOrigin.value
  if (!base) {
    return null
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: base,
    description: homepageDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
})

definePageMeta({
  title: homepageMetaTitle,
  description: homepageDescription,
  key: (route: any) => `index-${(route as any).fullPath || '/'}`
})

useHead(() => {
  const canonical = canonicalUrl.value
  const ogImage = homepageOgImage.value
  const structured = homepageStructuredData.value

  return {
    title: homepageTitle,
    meta: [
      { name: 'description', content: homepageDescription },
      { name: 'keywords', content: homepageKeywords },
      { property: 'og:title', content: homepageTitle },
      { property: 'og:description', content: homepageDescription },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: ogImage },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: homepageTitle },
      { name: 'twitter:description', content: homepageDescription },
      { name: 'twitter:image', content: ogImage }
    ],
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'zh-CN', href: canonical }
    ],
    script: structured
      ? [
          {
            type: 'application/ld+json',
            key: 'ld-homepage',
            children: JSON.stringify(structured)
          }
        ]
      : []
  }
})
</script>

<style scoped>
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}
.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}
</style>
