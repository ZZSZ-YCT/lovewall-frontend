<template>
  <div class="space-y-6">
    <!-- Header -->
    <section>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('home.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ t('home.description') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <ClientOnly>
            <NuxtLink
              v-if="auth.isAuthenticated"
              :to="localePath('/posts/new')"
              class="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <PlusIcon class="w-4 h-4" />
              {{ t('posts.post') }}
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- Controls -->
    <section class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ClockIcon class="w-4 h-4 text-gray-400" />
        <h2 class="text-base font-semibold text-gray-800">{{ t('posts.recently') }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <!-- Layout toggle (desktop only) -->
        <div
          v-if="!isMobile"
          class="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-md"
        >
          <button
            :class="[
              'p-1.5 rounded text-xs transition-colors',
              effectiveLayout === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            ]"
            :title="t('common.layouts.grid')"
            @click="switchLayout('grid')"
          >
            <GridIcon class="w-4 h-4" />
          </button>
          <button
            :class="[
              'p-1.5 rounded text-xs transition-colors',
              effectiveLayout === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            ]"
            :title="t('common.layouts.list')"
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
          {{ t('common.refresh') }}
        </GlassButton>
      </div>
    </section>

    <!-- Posts -->
    <section>
      <!-- Loading -->
      <div v-if="loading && posts.length === 0" class="text-center py-16">
        <LoadingSpinner size="lg" />
        <p class="mt-4 text-gray-500 text-sm">{{ t('common.loading') }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
        <HeartIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500 mb-4">{{ t('posts.empty') }}</p>
        <NuxtLink
          v-if="auth.isAuthenticated"
          :to="localePath('/posts/new')"
          class="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <PlusIcon class="w-4 h-4" /> {{ t('posts.beFirst') }}
        </NuxtLink>
      </div>

      <!-- Grid layout -->
      <div
        v-else-if="effectiveLayout === 'grid'"
        :class="['posts', gridClasses]"
      >
        <PostCard
          v-for="(post, index) in posts"
          :key="post.id"
          :post="post"
          :show-actions="auth.isAuthenticated"
          :eager="index < 3"
          variant="grid"
          @refresh="handleRefresh"
        />
      </div>

      <!-- List layout -->
      <div
        v-else
        :class="['posts space-y-3', isMobile ? 'px-0' : 'max-w-3xl mx-auto']"
      >
        <PostCard
          v-for="(post, index) in posts"
          :key="post.id"
          :post="post"
          :show-actions="auth.isAuthenticated"
          :eager="index < 3"
          variant="list"
          class="w-full"
          @refresh="handleRefresh"
        />
      </div>

      <!-- Load more trigger -->
      <div
        v-if="home.loaded && hasMore && !loading"
        ref="loadMoreTrigger"
        class="text-center py-8"
      >
        <div v-if="loadingMore" class="flex items-center justify-center gap-2 text-gray-500">
          <LoadingSpinner size="sm" />
          <span>{{ t('common.loading') }}</span>
        </div>
        <div v-else class="text-gray-400 text-sm">
          {{ t('common.pullDownLoading') }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import { PlusIcon, HeartIcon, ClockIcon, RefreshCwIcon, GridIcon, ListIcon } from 'lucide-vue-next'
import GlassButton from '~/components/ui/GlassButton.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { PostDto } from '~/types'

const PostCard = defineAsyncComponent(() => import('~/components/PostCard.vue'))

const auth = useAuthStore()
const home = useHomeStore()
const { isMobile, isTablet } = useDeviceSafe()

const layoutMode = ref<'grid' | 'list'>('grid')
const effectiveLayout = computed(() => isMobile.value ? 'list' : layoutMode.value)
const gridClasses = computed(() => {
  const base = 'grid gap-4'
  if (isMobile.value) return `${base} grid-cols-1`
  if (isTablet.value) return `${base} grid-cols-1 sm:grid-cols-2`
  return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
})

const switchLayout = async (mode: 'grid' | 'list') => {
  if (mode === layoutMode.value) return
  layoutMode.value = mode
  if (!isMobile.value) localStorage.setItem('love-wall-layout', mode)
}

const posts = computed<PostDto[]>(() => home.posts)
const hasMore = computed(() => home.hasMore)
const loadingMore = computed(() => home.loadingMore)
const loading = computed(() => home.loading)

onMounted(() => {
  if (!home.loaded && !home.loading) {
    home.initialLoad().catch((error) => console.error('Index: initial home load failed', error))
  }
})

const handleRefresh = async () => {
  try { await home.forceRefresh() }
  catch (error) { console.error('Index: manual refresh failed', error) }
}

const loadMore = async () => {
  try { await home.loadMore() }
  catch (error) { console.error('Index: load more failed', error) }
}

const loadMoreTrigger = ref<HTMLElement>()
onMounted(() => {
  if (!loadMoreTrigger.value) return
  const observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0]
      if (target && target.isIntersecting && hasMore.value && !loadingMore.value) loadMore()
    },
    { root: null, rootMargin: '200px', threshold: 0.1 }
  )
  observer.observe(loadMoreTrigger.value)
  onBeforeUnmount(() => observer.disconnect())
})

onBeforeRouteUpdate((to, from) => {
  if (to.fullPath === from.fullPath) return
  home.refreshIfStale().catch((error) => console.error('Index: onBeforeRouteUpdate refresh failed', error))
})

onActivated(async () => {
  try { await home.refreshIfStale() }
  catch (e) { console.error('Index: onActivated refresh failed', e) }
})

// SEO
const homepageTitle = t('seo.title')
const homepageDescription = t('seo.description')
const homepageKeywords = t('seo.keywords')
const siteName = t('seo.title')
const runtimeConfig = useRuntimeConfig()
const route = useRoute()

const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (import.meta.client && typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '')
  return ''
})
const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const path = route.fullPath || '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalizedPath}` : normalizedPath
})
const homepageOgImage = computed(() => {
  const base = normalizedSiteOrigin.value
  return base ? `${base}/badge.png` : '/badge.png'
})
const homepageStructuredData = computed(() => {
  const base = normalizedSiteOrigin.value
  if (!base) return null
  return {
    '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: base,
    description: homepageDescription,
    potentialAction: { '@type': 'SearchAction', target: `${base}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' }
  }
})

definePageMeta({
  title: { k: 'seo.title' },
  key: (route: any) => `index-${(route as any).fullPath || '/'}`
})

useSeoMeta({
  title: homepageTitle, description: homepageDescription, keywords: homepageKeywords,
  ogTitle: homepageTitle, ogDescription: homepageDescription, ogType: 'website',
  ogUrl: computed(() => canonicalUrl.value), ogImage: computed(() => homepageOgImage.value), ogSiteName: siteName,
  twitterCard: 'summary_large_image', twitterTitle: homepageTitle, twitterDescription: homepageDescription,
  twitterImage: computed(() => homepageOgImage.value),
})

useHead({
  link: [{ rel: 'canonical', href: computed(() => canonicalUrl.value) }],
  script: computed(() => {
    if (!homepageStructuredData.value) return []
    return [{ type: 'application/ld+json', key: 'ld-homepage', children: JSON.stringify(homepageStructuredData.value) }]
  }),
})
</script>

<style scoped>
:deep(.posts > .card) {
  content-visibility: auto;
  contain-intrinsic-size: 1px 300px;
}
</style>
