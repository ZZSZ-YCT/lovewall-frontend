<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-xl font-bold text-gray-900">管理后台</h1>
      <p class="text-gray-500 text-sm mt-1">系统管理和内容审核</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PermissionGuard :any-perms="['MANAGE_POSTS','MANAGE_FEATURED']">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <FileTextIcon class="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.posts }}</div>
                <div class="text-xs text-gray-500">总表白数</div>
              </div>
            </div>
          </div>
        </PermissionGuard>

        <PermissionGuard :any-perms="['MANAGE_USERS']">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UsersIcon class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.users }}</div>
                <div class="text-xs text-gray-500">总用户数</div>
              </div>
            </div>
          </div>
        </PermissionGuard>

        <PermissionGuard :any-perms="['MANAGE_POSTS']">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageSquareIcon class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.comments }}</div>
                <div class="text-xs text-gray-500">总回复数</div>
              </div>
            </div>
          </div>
        </PermissionGuard>

        <PermissionGuard :any-perms="['MANAGE_TAGS']">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TagIcon class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ stats.tags }}</div>
                <div class="text-xs text-gray-500">标签数</div>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </div>

      <!-- Today Stats -->
      <div class="bg-white rounded-lg border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">今日概览</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-xl font-bold text-brand-600">{{ todayStats.posts }}</div>
            <div class="text-xs text-gray-500 mt-1">新表白</div>
          </div>
          <div>
            <div class="text-xl font-bold text-green-600">{{ todayStats.comments }}</div>
            <div class="text-xs text-gray-500 mt-1">新增互动</div>
          </div>
          <div>
            <div class="text-xl font-bold text-blue-600">{{ todayStats.users }}</div>
            <div class="text-xs text-gray-500 mt-1">新用户</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <PermissionGuard :any-perms="['MANAGE_POSTS', 'MANAGE_FEATURED']">
          <NuxtLink to="/admin/posts" class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
            <FileTextIcon class="w-5 h-5 text-brand-600 mb-2" />
            <h3 class="font-medium text-gray-900 text-sm">表白管理</h3>
            <p class="text-xs text-gray-500 mt-1">审核、置顶和精华表白</p>
          </NuxtLink>
        </PermissionGuard>

        <PermissionGuard :any-perms="['MANAGE_USERS']">
          <NuxtLink to="/admin/users" class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
            <UsersIcon class="w-5 h-5 text-blue-600 mb-2" />
            <h3 class="font-medium text-gray-900 text-sm">用户管理</h3>
            <p class="text-xs text-gray-500 mt-1">管理用户账户和权限</p>
          </NuxtLink>
        </PermissionGuard>

        <PermissionGuard :any-perms="['MANAGE_POSTS']">
          <NuxtLink to="/admin/comments" class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
            <MessageSquareIcon class="w-5 h-5 text-green-600 mb-2" />
            <h3 class="font-medium text-gray-900 text-sm">回复管理</h3>
            <p class="text-xs text-gray-500 mt-1">审核和管理回复型帖子</p>
          </NuxtLink>
        </PermissionGuard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UsersIcon, FileTextIcon, MessageSquareIcon, TagIcon, SettingsIcon, MegaphoneIcon } from 'lucide-vue-next'
import type { PostDto, CommentDto } from '~/types'
import PermissionGuard from "~/components/ui/PermissionGuard.vue"
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue"

definePageMeta({
  middleware: 'admin',
  ssr: false,
  title: '管理后台 - 郑州四中校园墙'
})

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const stats = reactive({ users: 0, posts: 0, comments: 0, tags: 0 })
const todayStats = reactive({ posts: 0, comments: 0, users: 0 })

const loadDashboardData = async () => {
  loading.value = true
  try {
    const api = useNuxtApp().$api
    let gotMetrics = false
    if (auth.hasPerm('MANAGE_USERS') || auth.isSuperadmin) {
      try {
        const m = await api.getAdminMetrics()
        stats.users = m.total_users
        stats.posts = m.total_posts
        stats.comments = m.total_comments
        todayStats.users = m.today_new_users
        todayStats.posts = m.today_new_posts
        todayStats.comments = m.today_comments
        gotMetrics = true
      } catch (error) { console.warn('Failed to load admin metrics:', error) }
    }
    try {
      const postsData = await api.listPosts({ page: 1, page_size: 5 })
      if (!gotMetrics) stats.posts = postsData.total
      if (!auth.hasPerm('MANAGE_USERS') && !auth.isSuperadmin) {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        todayStats.posts = postsData.items.filter((post: PostDto) => new Date(post.created_at) >= today).length
      }
    } catch (error) { console.warn('Failed to load posts:', error) }
    if (auth.hasPerm('MANAGE_POSTS')) {
      try {
        const repliesData = await api.moderationPosts({ page: 1, page_size: 1, type: 'replies' })
        if (!auth.hasPerm('MANAGE_USERS') && !auth.isSuperadmin) stats.comments = repliesData.total
      } catch (error) { console.warn('Failed to load replies:', error) }
    }
    if ((auth.hasPerm('MANAGE_USERS') || auth.isSuperadmin) && !gotMetrics) {
      try {
        const usersData = await api.listUsers({ page: 1, page_size: 1 })
        stats.users = usersData.total
      } catch (error) { console.warn('Failed to load users:', error) }
    }
    if (auth.hasPerm('MANAGE_TAGS')) {
      try {
        const tagsData = await api.listTags({ page: 1, page_size: 1 })
        stats.tags = tagsData.total
      } catch (error) { console.warn('Failed to load tags:', error) }
    }
  } catch (error: any) {
    console.error('Dashboard loading error:', error)
    toast.error('加载仪表板数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadDashboardData() })
</script>
