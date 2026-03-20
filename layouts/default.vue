<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="link in head.link" :key="link.key">
        <Link :id="link.key" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.key">
        <Meta :id="meta.key" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body class="bg-zinc-100 text-zinc-950">
      <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f4f4f5_100%)]">
        <div class="app-shell">
          <aside class="app-sidebar">
            <div class="sticky top-0 flex min-h-screen flex-col px-2 py-6">
              <NuxtLink
                :to="localePath('/')"
                class="mb-5 inline-flex items-center gap-3 rounded-2xl px-2 py-2 text-zinc-950 transition hover:bg-white/70"
              >
                <img
                  src="/badge.png?v=20260320"
                  alt="郑州四中校园墙"
                  class="h-11 w-11 rounded-2xl border border-zinc-200 bg-white object-cover shadow-sm"
                >
                <span class="text-base font-semibold tracking-tight">{{ t('home.title') }}</span>
              </NuxtLink>

              <nav class="space-y-0.5">
                <NuxtLink
                  v-for="item in desktopNavItems"
                  :key="item.to"
                  :to="item.to"
                class="flex items-center gap-4 rounded-full px-4 py-3 text-[15px] font-medium transition"
                :class="isActive(item.match) ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-white hover:text-zinc-950'"
              >
                  <component :is="item.icon" class="h-5 w-5" />
                  <span>{{ item.label }}</span>
                  <span
                    v-if="item.badge && item.badge > 0"
                    class="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] text-white"
                  >
                    {{ item.badge > 99 ? '99+' : item.badge }}
                  </span>
                </NuxtLink>
              </nav>

              <NuxtLink
                :to="localePath('/posts/new')"
                class="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(14,165,233,0.95)] transition hover:bg-sky-600"
              >
                发布新帖
              </NuxtLink>

              <div class="mt-auto rounded-[28px] border border-zinc-200 bg-white/90 p-3.5 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="h-12 w-12 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                    <NuxtImg
                      v-if="auth.currentUser?.avatar_url"
                      :src="assetUrl(auth.currentUser.avatar_url)"
                      :alt="auth.userDisplayName"
                      class="h-full w-full object-cover"
                      width="48"
                      height="48"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-700"
                    >
                      {{ (auth.userDisplayName || 'LW').slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-semibold text-zinc-950">
                      {{ auth.isAuthenticated ? auth.userDisplayName : '未登录' }}
                    </div>
                    <div class="truncate text-xs text-zinc-500">
                      {{ auth.isAuthenticated ? `@${auth.currentUser?.username || ''}` : '登录后可以发帖、点赞、关注' }}
                    </div>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between gap-2">
                  <NuxtLink
                    v-if="!auth.isAuthenticated"
                    :to="localePath('/auth/login')"
                    class="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                  >
                    登录
                  </NuxtLink>
                  <NuxtLink
                    v-else
                    :to="localePath('/me')"
                    class="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                  >
                    个人中心
                  </NuxtLink>
                  <button
                    v-if="auth.isAuthenticated"
                    type="button"
                    class="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    @click="handleLogout"
                  >
                    退出
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main class="min-h-screen min-w-0 flex-1 px-3 py-3 sm:px-4 lg:px-0 lg:py-5">
            <div class="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
              <div class="flex items-center justify-between">
                <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 text-base font-semibold text-zinc-950">
                  <img
                    src="/badge.png?v=20260320"
                    alt="郑州四中校园墙"
                    class="h-8 w-8 rounded-xl border border-zinc-200 bg-white object-cover shadow-sm"
                  >
                  <span class="line-clamp-1">{{ t('home.title') }}</span>
                </NuxtLink>
                <div class="flex items-center gap-2">
                  <NuxtLink
                    v-if="auth.isAuthenticated"
                    :to="localePath('/notifications')"
                    class="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <BellIcon class="h-5 w-5" />
                    <span
                      v-if="unreadCount > 0"
                      class="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500"
                    />
                  </NuxtLink>
                  <NuxtLink
                    :to="auth.isAuthenticated ? localePath('/me') : localePath('/auth/login')"
                    class="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white"
                  >
                    {{ auth.isAuthenticated ? '我的' : '登录' }}
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="pb-24 lg:pb-6">
              <slot />
            </div>
          </main>

        </div>

        <nav
          class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden"
        >
          <div class="grid grid-cols-4">
            <NuxtLink
              v-for="item in mobileNavItems"
              :key="item.to"
              :to="item.to"
              class="relative flex flex-col items-center gap-1 py-3 text-xs font-medium transition"
              :class="isActive(item.match) ? 'text-zinc-950' : 'text-zinc-500'"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.label }}</span>
              <span
                v-if="item.badge && item.badge > 0"
                class="absolute right-[28%] top-2 h-2 w-2 rounded-full bg-rose-500"
              />
            </NuxtLink>
          </div>
        </nav>

        <ClientOnly>
          <ToastContainer />
        </ClientOnly>

        <Transition name="fade">
          <div
            v-if="initializing"
            class="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-2xl bg-zinc-950 px-4 py-3 text-white shadow-xl"
            aria-live="polite"
          >
            <LoadingSpinner size="md" variant="white" />
            <div class="text-sm">正在初始化会话…</div>
          </div>
        </Transition>

        <NuxtRouteAnnouncer />
        <AdminDialog />

        <ClientOnly>
          <AnnouncementModal
            v-if="pageAnnouncement.announcement.value"
            :is-open="pageAnnouncement.isOpen.value"
            :content="pageAnnouncement.announcement.value.content"
            @close="pageAnnouncement.close()"
            @dismiss="pageAnnouncement.dismiss()"
          />
        </ClientOnly>
      </div>
    </Body>
  </Html>
</template>

<script setup lang="ts">
import {
  BellIcon,
  HomeIcon,
  PenSquareIcon,
  UserIcon,
  SparklesIcon,
} from 'lucide-vue-next'
import '~/assets/css/default.css'
import AnnouncementModal from '~/components/AnnouncementModal.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import AdminDialog from '~/components/ui/AdminDialog.vue'

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const head = useLocaleHead()
const route = useRoute()
const auth = useAuthStore()
const pageAnnouncement = useAnnouncement()
const { assetUrl } = useAssetUrl()

const currentLocale = computed(() =>
  locales.value.find((l: any) => l.code === locale.value) || null,
)

const title = computed(() => {
  const meta = route.meta
  if (!meta.title) return t('home.title')
  if (typeof meta.title === 'string') return meta.title
  if ('raw' in meta.title) return meta.title.raw
  const { k, p } = meta.title
  return t(k, p as any)
})

useHead(() => ({
  title,
  meta: [
    { name: 'description', content: t('seo.description') },
    { name: 'keywords', content: t('seo.keywords') },
    { name: 'og:title', content: t('seo.title') },
    { name: 'og:locale', content: (currentLocale.value?.language ?? 'zh-CN').replaceAll('-', '_') },
    { name: 'og:description', content: t('seo.description') },
    { name: 'og:site_name', content: t('seo.title') },
    { name: 'twitter:title', content: t('seo.title') },
    { name: 'twitter:description', content: t('seo.description') },
  ],
}))

const initializing = ref(true)

const initializeApp = async () => {
  try {
    await auth.initAuth()
  } catch (error) {
    console.error('App initialization failed:', error)
  } finally {
    initializing.value = false
    pageAnnouncement.checkAndShow()
  }
}

onMounted(() => {
  initializeApp()
})

const { unreadNotifications, startHeartbeat, stopHeartbeat } = useHeartbeat()
const unreadCount = unreadNotifications

onMounted(() => {
  if (import.meta.client && auth.isAuthenticated) {
    startHeartbeat()
  }
})

onUnmounted(() => {
  stopHeartbeat()
})

watch(() => auth.isAuthenticated, (value) => {
  if (value) startHeartbeat()
  else stopHeartbeat()
})

const handleLogout = async () => {
  await auth.logout()
}

const desktopNavItems = computed(() => {
  const items = [
    { to: localePath('/'), label: '首页', icon: HomeIcon, match: ['/'] },
    { to: localePath('/notifications'), label: '通知', icon: BellIcon, match: ['/notifications'], badge: auth.isAuthenticated ? unreadCount.value : 0 },
    { to: localePath('/posts/new'), label: '发帖', icon: PenSquareIcon, match: ['/posts/new'] },
    { to: localePath('/me'), label: '我的', icon: UserIcon, match: ['/me', '/users'] },
  ]

  if (auth.isAuthenticated && (auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_USERS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_POSTS', 'MANAGE_TAGS']))) {
    items.push({ to: localePath('/admin'), label: '后台', icon: SparklesIcon, match: ['/admin'] })
  }

  return items
})

const mobileNavItems = computed(() => [
  { to: localePath('/'), label: '首页', icon: HomeIcon, match: ['/'] },
  { to: localePath('/notifications'), label: '通知', icon: BellIcon, match: ['/notifications'], badge: auth.isAuthenticated ? unreadCount.value : 0 },
  { to: localePath('/posts/new'), label: '发帖', icon: PenSquareIcon, match: ['/posts/new'] },
  { to: auth.isAuthenticated ? localePath('/me') : localePath('/auth/login'), label: '我的', icon: UserIcon, match: ['/me', '/users', '/auth'] },
])

const isActive = (matches: string[]) => matches.some((item) => route.path === item || route.path.startsWith(`${item}/`))
</script>
