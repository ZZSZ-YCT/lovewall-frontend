<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
    :class="isActive
      ? 'bg-gray-900 text-white border-l-4 border-brand-500'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white border-l-4 border-transparent'"
  >
    <component :is="iconComponent" class="w-4 h-4 flex-shrink-0" />
    <span>{{ title }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import {
  LayoutDashboardIcon,
  FileTextIcon,
  UsersIcon,
  MessageSquareIcon,
  MegaphoneIcon,
  TagIcon,
  SettingsIcon
} from 'lucide-vue-next'

interface Props {
  to: string
  icon: string
  title: string
  description?: string
}

const props = defineProps<Props>()
const route = useRoute()

const isActive = computed(() => {
  if (props.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(props.to)
})

const iconComponents = {
  LayoutDashboard: LayoutDashboardIcon,
  FileText: FileTextIcon,
  Users: UsersIcon,
  MessageSquare: MessageSquareIcon,
  Megaphone: MegaphoneIcon,
  Tag: TagIcon,
  Settings: SettingsIcon,
}

const iconComponent = computed(() => iconComponents[props.icon as keyof typeof iconComponents])
</script>
