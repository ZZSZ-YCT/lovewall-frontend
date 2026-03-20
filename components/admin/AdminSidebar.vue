<template>
  <!-- Mobile overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/40 lg:hidden z-30"
    @click="$emit('close')"
  />

  <!-- Sidebar -->
  <aside
    class="fixed left-0 top-0 bottom-0 w-56 bg-gray-800 z-40 lg:z-20 transform transition-transform duration-200 lg:translate-x-0"
    :class="{ '-translate-x-full lg:translate-x-0': !isOpen }"
  >
    <nav class="h-full overflow-y-auto flex flex-col">
      <!-- Header -->
      <div class="px-4 py-4 border-b border-gray-700">
        <h2 class="text-base font-semibold text-white">管理后台</h2>
        <div class="text-xs text-gray-400 mt-1">
          {{ auth.userDisplayName }}
          <span v-if="auth.isSuperadmin" class="text-red-400 font-medium">（超管）</span>
        </div>
      </div>

      <!-- Menu -->
      <div class="flex-1 py-2">
        <AdminSidebarItem :to="localePath('/admin')" icon="LayoutDashboard" title="概览" />
        <AdminSidebarItem v-if="canManagePosts" :to="localePath('/admin/posts')" icon="FileText" title="表白管理" />
        <AdminSidebarItem v-if="canManageUsers" :to="localePath('/admin/users')" icon="Users" title="用户管理" />
        <AdminSidebarItem v-if="canManageComments" :to="localePath('/admin/comments')" icon="MessageSquare" title="回复管理" />
        <AdminSidebarItem v-if="canManageAnnouncements" :to="localePath('/admin/announcements')" icon="Megaphone" title="公告管理" />
        <AdminSidebarItem v-if="canManageTags" :to="localePath('/admin/tags')" icon="Tag" title="标签管理" />
        <AdminSidebarItem v-if="auth.isSuperadmin" :to="localePath('/admin/system')" icon="Settings" title="系统日志" />
      </div>

      <!-- Permissions info -->
      <div class="px-4 py-3 border-t border-gray-700">
        <h4 class="text-xs font-medium text-gray-400 mb-2">当前权限</h4>
        <div class="text-xs text-gray-500 space-y-1">
          <div v-if="auth.isSuperadmin" class="text-red-400 font-medium">超级管理员 - 拥有所有权限</div>
          <template v-else>
            <div v-if="auth.permissions.length === 0" class="text-gray-500">暂无特殊权限</div>
            <div v-for="perm in auth.permissions" :key="perm" class="flex items-center gap-1.5">
              <div class="w-1 h-1 bg-gray-500 rounded-full" />
              {{ getPermissionName(perm) }}
            </div>
          </template>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const localePath = useLocalePath()
const auth = useAuthStore()

const canManagePosts = computed(() => auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_POSTS', 'MANAGE_FEATURED']))
const canManageUsers = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_USERS'))
const canManageComments = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS'))
const canManageAnnouncements = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_ANNOUNCEMENTS'))
const canManageTags = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_TAGS'))

const getPermissionName = (perm: string): string => {
  const names: Record<string, string> = {
    'MANAGE_USERS': '用户管理',
    'MANAGE_POSTS': '帖子/回复管理',
    'MANAGE_FEATURED': '精选管理',
    'MANAGE_ANNOUNCEMENTS': '公告管理',
    'MANAGE_TAGS': '标签管理',
  }
  return names[perm] || perm
}
</script>
