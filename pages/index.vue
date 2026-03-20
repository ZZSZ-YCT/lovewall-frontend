<template>
  <div class="page-shell overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
    <section class="border-b border-zinc-200 px-4 py-4 sm:px-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-zinc-950">{{ t('home.title') }}</h1>
          <p class="mt-1 text-sm text-zinc-500">表白、动态、回复，统一在一条时间线里浏览。</p>
        </div>
        <NuxtLink
          :to="localePath('/posts/new')"
          class="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          发布
        </NuxtLink>
      </div>

      <div class="mt-4 flex rounded-full bg-zinc-100 p-1">
        <button
          type="button"
          class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="home.feed === 'recommended' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'"
          @click="switchFeed('recommended')"
        >
          推荐
        </button>
        <button
          type="button"
          class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="home.feed === 'following' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'"
          @click="switchFeed('following')"
        >
          正在关注
        </button>
      </div>
    </section>

    <section
      v-if="auth.isAuthenticated"
      class="border-b border-zinc-200 px-4 py-4 sm:px-5"
    >
      <div class="flex items-start gap-3">
        <div class="h-11 w-11 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          <NuxtImg
            v-if="auth.currentUser?.avatar_url"
            :src="assetUrl(auth.currentUser.avatar_url)"
            :alt="auth.userDisplayName"
            class="h-full w-full object-cover"
            width="44"
            height="44"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-700"
          >
            {{ auth.userDisplayName.slice(0, 2).toUpperCase() }}
          </div>
        </div>
        <NuxtLink
          :to="localePath('/posts/new')"
          class="flex-1 rounded-3xl border border-zinc-200 px-4 py-3 text-sm text-zinc-500 transition hover:border-sky-400 hover:text-zinc-700"
        >
          有什么想说的？
        </NuxtLink>
      </div>
    </section>

    <section v-if="loading && posts.length === 0" class="px-4 py-16 text-center sm:px-5">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-sm text-zinc-500">{{ t('common.loading') }}</p>
    </section>

    <section
      v-else-if="home.feed === 'following' && !auth.isAuthenticated"
      class="px-4 py-16 text-center sm:px-5"
    >
      <p class="text-sm text-zinc-500">登录后即可查看你关注用户的时间线。</p>
      <NuxtLink
        :to="localePath('/auth/login')"
        class="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white"
      >
        立即登录
      </NuxtLink>
    </section>

    <section
      v-else-if="!loading && posts.length === 0"
      class="px-4 py-16 text-center sm:px-5"
    >
      <p class="text-sm text-zinc-500">
        {{ home.feed === 'following' ? '你还没有关注任何人，时间线暂时是空的。' : t('posts.empty') }}
      </p>
    </section>

    <section v-else>
      <TimelinePost
        v-for="(post, index) in posts"
        :key="post.id"
        :post="post"
        :eager="index < 2"
      />

      <div
        v-if="home.loaded && hasMore"
        ref="loadMoreTrigger"
        class="border-t border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 sm:px-5"
      >
        <div v-if="loadingMore" class="inline-flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>{{ t('common.loading') }}</span>
        </div>
        <div v-else>继续滚动以加载更多</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { HomeFeedType } from '~/stores/home'

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const home = useHomeStore()
const { assetUrl } = useAssetUrl()

const posts = computed(() => home.posts)
const hasMore = computed(() => home.hasMore)
const loading = computed(() => home.loading)
const loadingMore = computed(() => home.loadingMore)

const switchFeed = async (feed: HomeFeedType) => {
  try {
    await home.setFeed(feed)
  } catch (error) {
    console.error('Index: switch feed failed', error)
  }
}

const loadMore = async () => {
  try {
    await home.loadMore()
  } catch (error) {
    console.error('Index: load more failed', error)
  }
}

const ensureHomeReady = async () => {
  if (home.loading) return
  if (!home.loaded || home.posts.length === 0) {
    await home.forceRefresh()
  }
}

onMounted(() => {
  ensureHomeReady().catch((error) => console.error('Index: ensure home ready failed', error))
})

watch(() => auth.isAuthenticated, async (isAuthenticated) => {
  if (!isAuthenticated && home.feed === 'following') {
    await home.setFeed('recommended')
    return
  }
  if (isAuthenticated && !home.loaded) {
    await home.initialLoad()
  }
})

onActivated(() => {
  ensureHomeReady().catch((error) => console.error('Index: activated refresh failed', error))
})

const loadMoreTrigger = ref<HTMLElement | null>(null)
watch(
  () => loadMoreTrigger.value,
  (el, _, onCleanup) => {
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target?.isIntersecting && hasMore.value && !loadingMore.value) {
          loadMore()
        }
      },
      { root: null, rootMargin: '240px', threshold: 0.1 },
    )
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  },
  { flush: 'post' },
)

definePageMeta({
  title: { k: 'seo.title' },
  keepalive: false,
})

const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const siteName = t('seo.title')
const homepageDescription = t('seo.description')

const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (import.meta.client && typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '')
  return ''
})

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const path = route.fullPath || '/'
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
})

const ogImage = computed(() => normalizedSiteOrigin.value ? `${normalizedSiteOrigin.value}/badge.png` : '/badge.png')

useSeoMeta({
  title: siteName,
  description: homepageDescription,
  ogTitle: siteName,
  ogDescription: homepageDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogImage,
  twitterCard: 'summary_large_image',
  twitterTitle: siteName,
  twitterDescription: homepageDescription,
  twitterImage: ogImage,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>
