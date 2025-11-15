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
              @click="switchLayout('grid')"
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
              @click="switchLayout('list')"
            >
              <ListIcon class="w-4 h-4" />
            </button>
          </div>

          <GlassButton
            :disabled="loading"
            variant="secondary"
            class="!px-3 !py-1.5 text-sm"
            @click="handleRefresh"
          >
            <RefreshCwIcon :class="['w-4 h-4', { 'animate-spin': loading }]" />
            刷新
          </GlassButton>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="space-y-4">
        <!-- 加载中 -->
        <div v-if="loading && posts.length === 0" class="text-center py-12">
          <LoadingSpinner size="lg" />
          <p class="mt-4 text-gray-600">加载表白中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && posts.length === 0" class="text-center py-12">
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
            v-for="(post, index) in posts"
            :key="post.id"
            :post="post"
            :show-actions="auth.isAuthenticated"
            :eager="index < 3"
            variant="grid"
            class="animate-fade-in-up"
            @refresh="handleRefresh"
          />
        </div>

        <!-- 列表布局 -->
        <div
          v-else
          :class="['space-y-4', isMobile ? 'px-2' : 'max-w-3xl mx-auto']"
        >
          <PostCard
            v-for="(post, index) in posts"
            :key="post.id"
            :post="post"
            :show-actions="auth.isAuthenticated"
            :eager="index < 3"
            variant="list"
            class="w-full animate-fade-in-up"
            @refresh="handleRefresh"
          />
        </div>
      </div>

      <!-- 无限滚动加载指示器 -->
      <div
        v-if="home.loaded && hasMore && !loading"
        ref="loadMoreTrigger"
        class="text-center py-8"
      >
        <div v-if="loadingMore" class="flex items-center justify-center gap-2 text-gray-600">
          <LoadingSpinner size="sm" />
          <span>加载中...</span>
        </div>
        <div v-else class="text-gray-400 text-sm">
          向下滚动加载更多
        </div>
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
const { confirm } = useConfirm()

// 布局控制 - 强制默认列表布局
const layoutMode = ref<'grid' | 'list'>('list')
const effectiveLayout = computed(() => {
  // 移动端始终列表布局
  if (isMobile.value) return 'list'
  // 桌面端也始终使用layoutMode的值（默认为list）
  return layoutMode.value
})
const gridClasses = computed(() => {
  const base = 'grid gap-4 md:gap-6'
  if (isMobile.value) return `${base} grid-cols-1`
  if (isTablet.value) return `${base} grid-cols-1 sm:grid-cols-2`
  return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`
})

// 切换布局模式
const switchLayout = async (mode: 'grid' | 'list') => {
  if (mode === layoutMode.value) return

  // 切换到网格布局时警告
  if (mode === 'grid') {
    const confirmed = await confirm({
      title: '切换布局',
      message: '网格布局可能存在视觉和显示问题，建议使用列表布局以获得更好的体验。确定要切换吗？',
      confirmText: '确定切换',
      cancelText: '取消'
    })
    if (!confirmed) return
  }

  layoutMode.value = mode
  if (!isMobile.value) {
    localStorage.setItem('love-wall-layout', mode)
  }
}

// 从 localStorage 读取布局偏好（仅限列表布局，忽略网格布局）
onMounted(() => {
  const saved = localStorage.getItem('love-wall-layout')
  // 只接受'list'，忽略'grid'，确保默认始终为列表布局
  if (saved === 'list') {
    layoutMode.value = 'list'
  } else {
    // 清除旧的网格布局偏好
    localStorage.removeItem('love-wall-layout')
    layoutMode.value = 'list'
  }
})
// 只在列表布局时保存
watch(layoutMode, (v) => {
  if (!isMobile.value && v === 'list') {
    localStorage.setItem('love-wall-layout', v)
  }
})

// --- 数据加载 (SSR 友好) ---
const { data, pending, refresh, error } = await useAsyncData(
  'home-posts',
  async () => {
    // ✅ 修复：只调用一次initialLoad，避免重复请求
    await home.initialLoad()
    return {
      posts: home.posts,
      hasMore: home.hasMore,
    }
  },
  { server: true, lazy: false }
)

// ✅ 直接使用store的响应式数据
const posts = computed(() => home.posts)
const hasMore = computed(() => home.hasMore)
const loadingMore = computed(() => home.loadingMore)
const loading = computed(() => home.loading)

// 刷新按钮
const handleRefresh = async () => {
  await home.forceRefresh()
}

// 加载更多
const loadMore = async () => {
  await home.loadMore()
  data.value!!.posts = home.posts
}

// 无限滚动：观察loadMoreTrigger元素
const loadMoreTrigger = ref<HTMLElement>()

onMounted(() => {
  if (!loadMoreTrigger.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0]
      if (target && target.isIntersecting && hasMore.value && !loadingMore.value) {
        loadMore()
      }
    },
    {
      root: null,
      rootMargin: '200px', // 提前200px开始加载
      threshold: 0.1,
    }
  )

  observer.observe(loadMoreTrigger.value)

  onBeforeUnmount(() => {
    observer.disconnect()
  })
})

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

useSeoMeta({
  title: homepageTitle,
  description: homepageDescription,
  keywords: homepageKeywords,

  // --- Open Graph ---
  ogTitle: homepageTitle,
  ogDescription: homepageDescription,
  ogType: 'website',
  ogUrl: computed(() => canonicalUrl.value),
  ogImage: computed(() => homepageOgImage.value),
  ogSiteName: siteName,

  // --- Twitter ---
  twitterCard: 'summary_large_image',
  twitterTitle: homepageTitle,
  twitterDescription: homepageDescription,
  twitterImage: computed(() => homepageOgImage.value),
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => canonicalUrl.value)
    }
  ],
  script: computed(() => {
    if (!homepageStructuredData.value) return []
    return [
      {
        type: 'application/ld+json',
        key: 'ld-homepage',
        children: JSON.stringify(homepageStructuredData.value),
      },
    ]
  }),
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
.posts > .card {
  content-visibility: auto; contain-intrinsic-size: 1px 360px;
}

</style>
