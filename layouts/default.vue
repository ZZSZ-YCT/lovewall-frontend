<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
  <Head>
    <Title>{{ title }}</Title>
    <template v-for="link in head.link" :key="link.key">
      <Link :id="link.key" :rel="link.rel" :href="link.href" :hreflang="link.hreflang"/>
    </template>
    <template v-for="meta in head.meta" :key="meta.key">
      <Meta :id="meta.key" :property="meta.property" :content="meta.content"/>
    </template>
  </Head>
  <Body>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2 text-gray-900 hover:text-brand-600">
          <NuxtImg
            src="/badge.png"
            :alt="t('home.title')"
            class="w-8 h-8 rounded-lg"
            :modifiers="{ fit: 'cover', quality: 50 }"
            sizes="32px"
            format="webp"
            densities="x1 x2"
            width="32"
            height="32"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <span class="font-bold text-lg hidden sm:block">{{ t('home.title') }}</span>
        </NuxtLink>

        <!-- Auth Area -->
        <ClientOnly>
          <div ref="userMenuRef" class="relative flex items-center gap-2">
            <!-- Not logged in -->
            <template v-if="!auth.isAuthenticated">
              <NuxtLink :to="localePath('/auth/login')" class="btn-ghost px-3 py-1.5 text-sm font-medium">
                {{ t('home.login') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/auth/register')" class="btn-primary px-3 py-1.5 text-sm font-medium rounded-md">
                {{ t('home.register') }}
              </NuxtLink>
            </template>

            <!-- Logged in -->
            <template v-else>
              <!-- Notifications -->
              <NuxtLink
                :to="localePath('/notifications')"
                class="relative inline-flex items-center justify-center rounded-md h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                :title="t('notifications.index')"
              >
                <BellIcon class="w-5 h-5"/>
                <span v-if="unreadCount > 0"
                      class="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full"/>
              </NuxtLink>

              <!-- User menu -->
              <button
                class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                @click="showUserMenu = !showUserMenu"
              >
                <NuxtImg
                  v-if="auth.currentUser?.avatar_url"
                  :src="assetUrl(auth.currentUser.avatar_url)"
                  :alt="auth.userDisplayName"
                  class="w-7 h-7 rounded-full"
                />
                <UserIcon v-else class="w-6 h-6"/>
                <span class="hidden sm:block">{{ auth.userDisplayName }}</span>
                <ChevronDownIcon class="w-4 h-4"/>
              </button>

              <!-- Dropdown -->
              <div v-if="showUserMenu"
                   class="absolute right-0 top-full mt-1 w-52 bg-white rounded-md border border-gray-200 shadow-lg py-1 z-50">
                <NuxtLink :to="localePath('/me')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          @click="showUserMenu = false">{{ t('user.center') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/me/comments')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          @click="showUserMenu = false">{{ t('user.myComments') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/me/tags')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          @click="showUserMenu = false">{{ t('user.myTags') }}
                </NuxtLink>
                <button
                  v-if="auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_USERS','MANAGE_ANNOUNCEMENTS','MANAGE_POSTS','MANAGE_TAGS'])"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="goAdmin"
                >{{ t('admin.index') }}
                </button>
                <hr class="my-1 border-gray-100">
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        @click="handleLogout">{{ t('home.logout') }}
                </button>
              </div>
            </template>
          </div>
        </ClientOnly>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <slot/>
      </div>
      <!-- Toast Notifications -->
      <ClientOnly>
        <ToastContainer/>
      </ClientOnly>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-white py-6 text-sm text-gray-500">
      <div class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">
        <LocaleSwitcher/>
        <div class="flex-1 text-center space-y-1">
          <p>&copy; 2025 {{ t('home.title') }}</p>
          <div class="flex justify-center gap-4">
            <a href="/privacy" class="hover:text-gray-700 transition-colors">{{ t('home.privacy') }}</a>
            <a href="/tos" class="hover:text-gray-700 transition-colors">{{ t('home.tos') }}</a>
            <a href="#" class="hover:text-gray-700 transition-colors">{{ t('home.contact') }}</a>
          </div>
        </div>
        <div class="w-[120px] md:w-[140px]"></div>
      </div>
    </footer>

    <!-- Loading indicator -->
    <Transition name="fade">
      <div
        v-if="initializing"
        class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-600 text-white shadow-lg pointer-events-none"
        aria-live="polite"
      >
        <LoadingSpinner size="md" variant="white"/>
        <div class="flex flex-col">
          <span class="text-xs uppercase tracking-wider text-white/70">Loading</span>
          <span class="text-sm font-semibold">{{ t('common.loading') }}</span>
        </div>
      </div>
    </Transition>

    <NuxtRouteAnnouncer/>
    <AdminDialog/>

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
const {t, locale, locales} = useI18n()
const localePath = useLocalePath()

import {UserIcon, ChevronDownIcon, BellIcon} from 'lucide-vue-next'
import {onClickOutside} from '@vueuse/core'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import AdminDialog from '~/components/ui/AdminDialog.vue'
import AnnouncementModal from '~/components/AnnouncementModal.vue'
import '~/assets/css/default.css'
import LocaleSwitcher from "~/components/ui/LocaleSwitcher.vue";
import {computed} from "vue";

const head = useLocaleHead()
const route = useRoute()

const currentLocale = computed(() =>
  locales.value.find((l: any) => l.code === locale.value) || null,
)

const title = computed(() => {
  const meta = route.meta
  if (!meta.title) return t('home.title')
  if (typeof meta.title === 'string') return meta.title
  if ('raw' in meta.title) return meta.title.raw
  const {k, p} = meta.title
  return t(k, p as any)
});

useHead(() => ({
  title: title,
  meta: [
    { name: 'description', content: t('seo.description') },
    { name: 'keywords', content: t('seo.keywords') },
    { name: 'og:title', content: t('seo.title') },
    { name: 'og:locale', content: (currentLocale.value?.language ?? "zh-CN").replaceAll('-', '_') },
    { name: 'og:description', content: t('seo.description') },
    { name: 'og:site_name', content: t('seo.title') },
    { name: 'twitter:title', content: t('seo.title') },
    { name: 'twitter:description', content: t('seo.description') }
  ]
}))

const auth = useAuthStore()
const pageAnnouncement = useAnnouncement()
const {assetUrl} = useAssetUrl()

const initializing = ref(true)
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()
onClickOutside(userMenuRef, () => {
  showUserMenu.value = false
})

const handleLogout = async () => {
  showUserMenu.value = false
  await auth.logout()
}

const goAdmin = async () => {
  showUserMenu.value = false
  await navigateTo(localePath('/admin'))
}

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

const {unreadNotifications, startHeartbeat, stopHeartbeat} = useHeartbeat()
const unreadCount = unreadNotifications

onMounted(() => {
  if (import.meta.client && auth.isAuthenticated) {
    startHeartbeat()
  }
})

onUnmounted(() => {
  stopHeartbeat()
})

watch(() => auth.isAuthenticated, (v) => {
  if (v) startHeartbeat()
  else stopHeartbeat()
})

watch(() => route.path, () => {
  showUserMenu.value = false
})
</script>
