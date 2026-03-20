<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <AdminSidebar
      :is-open="sidebarOpen"
      @close="sidebarOpen = false"
    />

    <!-- Main Content -->
    <div class="flex-1 lg:ml-56">
      <!-- Top Bar -->
      <header class="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
        <div class="flex items-center gap-3">
          <button
            class="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            @click="sidebarOpen = true"
          >
            <MenuIcon class="w-5 h-5" />
          </button>
          <nav class="hidden sm:flex items-center gap-1.5 text-sm">
            <NuxtLink to="/admin" class="text-brand-600 hover:text-brand-700 font-medium">管理后台</NuxtLink>
            <ChevronRightIcon v-if="currentPageName" class="w-3.5 h-3.5 text-gray-400" />
            <span v-if="currentPageName" class="text-gray-600">{{ currentPageName }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <HomeIcon class="w-4 h-4" />
            <span>返回首页</span>
          </NuxtLink>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon class="w-4 h-4" />
            <span class="font-medium">{{ auth.userDisplayName }}</span>
            <span v-if="auth.isSuperadmin" class="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-medium">超管</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6">
        <slot />
      </main>
    </div>

    <!-- Announcement -->
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
import { MenuIcon, ChevronRightIcon, HomeIcon, UserIcon } from 'lucide-vue-next'
import AnnouncementModal from '~/components/AnnouncementModal.vue'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)
const pageAnnouncement = useAnnouncement()

onMounted(() => {
  if (import.meta.client && window.innerWidth >= 1024) {
    sidebarOpen.value = true
  }
  pageAnnouncement.checkAndShow()
})

const currentPageName = computed(() => {
  const pathMap: Record<string, string> = {
    '/admin': '',
    '/admin/posts': '表白管理',
    '/admin/users': '用户管理',
    '/admin/comments': '回复管理',
    '/admin/announcements': '公告管理',
    '/admin/tags': '标签管理',
    '/admin/system': '系统日志',
    '/admin/system-logs': '系统日志',
  }
  return pathMap[route.path] || ''
})

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>
