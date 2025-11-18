<template>
  <div class="h-screen overflow-hidden relative">
    <!-- Background Image -->
    <div class="fixed inset-0 z-0">
      <img
        v-if="bg.src.value && !bg.loading.value"
        :src="bg.src.value"
        alt="Background"
        class="w-full h-full object-cover animate-fade-in"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
      >

      <!-- Fallback gradient background -->
      <div v-else class="w-full h-full bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100" />
    </div>

    <!-- Blur Overlay -->
    <div class="fixed inset-0 z-10 pointer-events-none bg-white/20 backdrop-blur-strong" />

    <!-- Main Content Wrapper -->
    <div class="relative z-20 h-screen flex flex-col overflow-hidden">
      <!-- Status Bar -->
      <header class="fixed top-0 left-0 right-0 z-50">
        <div class="glass-bar rounded-none h-14 px-3 sm:px-4 flex items-center justify-between">
          <!-- Site name / logo -->
            <NuxtLink to="/" class="flex items-center gap-2 text-brand-600 hover:text-brand-700">
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
            <div ref="userMenuRef" class="relative flex items-center gap-2 overflow-visible z-50">
              <!-- 未登录：登录/注册 -->
              <template v-if="!auth.isAuthenticated">
                <NuxtLink to="/auth/login" class="glass-button-secondary px-3 py-1.5 text-sm font-medium">{{ t('home.login') }}</NuxtLink>
                <NuxtLink to="/auth/register" class="glass-button px-3 py-1.5 text-sm font-medium"> {{ t('home.register') }} </NuxtLink>
              </template>

              <!-- 已登录：通知按钮 + 头像/昵称 + 下拉 -->
              <template v-else>
                <!-- 通知按钮（在头像左侧） -->
                <NuxtLink
                  to="/notifications"
                  class="relative inline-flex items-center justify-center rounded-lg h-9 w-9 text-gray-700 hover:text-brand-600 hover:bg-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                  :title="t('notifications.index')"
                  :aria-label="t('notifications.index')"
                >
                  <BellIcon class="w-5 h-5" />
                  <!-- 未读红点 -->
                  <span v-if="unreadCount > 0" class="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full" />
                </NuxtLink>
                <button
                  class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/20 transition-colors"
                  @click="showUserMenu = !showUserMenu"
                >
                  <NuxtImg
                    v-if="auth.currentUser?.avatar_url"
                    :src="assetUrl(auth.currentUser.avatar_url)"
                    :alt="auth.userDisplayName"
                    class="w-7 h-7 rounded-full"
                  />
                  <UserIcon v-else class="w-6 h-6" />
                  <span class="hidden sm:block">{{ auth.userDisplayName }}</span>
                  <ChevronDownIcon class="w-4 h-4" />
                </button>

                <!-- Dropdown menu -->
                <div v-if="showUserMenu" class="absolute right-0 top-full mt-2 w-56 glass-card backdrop-blur-ultra py-2 shadow-lg z-50">
                  <NuxtLink to="/me" class="block px-4 py-2 text-sm text-gray-700 hover:bg-white/20" @click="showUserMenu = false">{{ t('user.center') }}</NuxtLink>
                  <NuxtLink to="/me/comments" class="block px-4 py-2 text-sm text-gray-700 hover:bg-white/20" @click="showUserMenu = false">{{ t('user.myComments') }}</NuxtLink>
                  <NuxtLink to="/me/tags" class="block px-4 py-2 text-sm text-gray-700 hover:bg-white/20" @click="showUserMenu = false">{{ t('user.myTags') }}</NuxtLink>
                  <button
                    v-if="auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_USERS','MANAGE_ANNOUNCEMENTS','MANAGE_POSTS','MANAGE_TAGS'])"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20"
                    @click="goAdmin"
                  >{{ t('admin.index') }}</button>
                  <hr class="my-1 border-white/20">
                  <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20" @click="handleLogout">{{ t('home.logout') }}</button>
                </div>
              </template>
            </div>
          </ClientOnly>
        </div>
      </header>

      <!-- 固定头部占位 -->
      <div class="pt-14" />

      <!-- Page Content -->
      <main class="flex-1 min-h-0 relative">
        <div class="h-full overflow-auto no-scrollbar">
          <div class="content-container py-6">
            <slot />
          </div>
        </div>
        <!-- Toast Notifications -->
        <ClientOnly>
          <ToastContainer />
        </ClientOnly>
      </main>

      <!-- Footer -->
      <div class="shrink-0">
        <hr class="border-t border-white/40 mb-4" >
        <footer class="glass-card rounded-none py-6 text-sm text-gray-600 overflow-visible">
          <div class="mx-auto flex max-w-6xl items-center justify-between px-4">
            <LocaleSwitcher />

            <div class="flex-1 text-center space-y-2">
              <p>© 2025 {{ t('home.title') }}</p>
              <div class="flex justify-center gap-4">
                <a href="/privacy" class="hover:text-brand-600 transition-colors">
                  {{ t('home.privacy') }}
                </a>
                <a href="/tos" class="hover:text-brand-600 transition-colors">
                  {{ t('home.tos') }}
                </a>
                <a href="#" class="hover:text-brand-600 transition-colors">
                  {{ t('home.contact') }}
                </a>
              </div>
            </div>

            <div class="w-[120px] md:w-[140px]"></div>
          </div>
        </footer>
      </div>
    </div>

    <!-- Loading Screen -->
    <Transition name="fade">
      <div
        v-if="initializing"
        class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-600/95 text-white shadow-glow ring-1 ring-brand-300/60 pointer-events-none"
        aria-live="polite"
      >
        <LoadingSpinner size="md" variant="white" />
        <div class="flex flex-col">
          <span class="text-xs uppercase tracking-[0.2em] text-white/70">Loading</span>
          <span class="text-sm font-semibold">加载中...</span>
        </div>
      </div>
    </Transition>

    <!-- Route announcer for accessibility -->
    <NuxtRouteAnnouncer />

    <!-- 统一使用AdminDialog -->
    <AdminDialog />

    <!-- 公告弹窗（按页面路径） -->
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
</template>

<script setup lang="ts">
import { UserIcon, ChevronDownIcon, BellIcon } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import AdminDialog from '~/components/ui/AdminDialog.vue'
import AnnouncementModal from '~/components/AnnouncementModal.vue'
import '~/assets/css/default.css'
import LocaleSwitcher from "~/components/ui/LocaleSwitcher.vue";

const { t } = useI18n()

// Stores
const auth = useAuthStore()

// 页面公告系统
const pageAnnouncement = useAnnouncement()

// Background image
const bg = useRandomBg()
const { assetUrl } = useAssetUrl()

// State
const initializing = ref(true)
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()
onClickOutside(userMenuRef, () => { showUserMenu.value = false })

const handleLogout = async () => {
  showUserMenu.value = false
  await auth.logout()
}

const goAdmin = async () => {
  showUserMenu.value = false
  await navigateTo('/admin')
}

// Initialize app
const initializeApp = async () => {
  try {
    await auth.initAuth()
  } catch (error) {
    console.error('App initialization failed:', error)
  } finally {
    initializing.value = false
    // 鉴权完成后检查公告
    pageAnnouncement.checkAndShow()
  }
}

onMounted(() => {
  initializeApp()
})

// 通知红点：使用heartbeat合并后的unread_notifications
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

watch(() => auth.isAuthenticated, (v) => {
  if (v) {
    startHeartbeat()
  } else {
    stopHeartbeat()
  }
})

// 路由变化时关闭菜单
const route = useRoute()
watch(() => route.path, () => {
  showUserMenu.value = false
})
</script>

<style>

</style>
