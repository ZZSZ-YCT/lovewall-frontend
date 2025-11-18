<template>
  <div class="flex gap-3 min-w-0">
    <div
      class="relative flex-shrink-0 transition-transform duration-150"
      :class="avatarWrapperClasses"
      :style="avatarStyle"
      @click="handleAvatarClick"
    >
      <template v-if="comment.is_user_admin">
        <div class="absolute -inset-[3px] rounded-full border-[3px] border-sky-400/95 pointer-events-none" />
        <div class="absolute -inset-[7px] rounded-full bg-sky-300/40 blur-2xl pointer-events-none" />
      </template>
      <NuxtImg
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="userDisplayName"
        :width="size"
        :height="size"
        :format="avatarFormat"
        :quality="avatarQuality"
        fit="cover"
        class="relative z-10 w-full h-full rounded-full object-cover"
        :class="comment.is_user_admin ? 'border-0' : 'border-2 border-white/20'"
        loading="lazy"
        @error="onAvatarError"
      />
      <div
        v-else
        class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold"
        :class="placeholderTextClass"
      >
        {{ userInitials }}
      </div>
      <!-- 在线状态指示器：总是显示，在线绿色/离线灰色，部分盖住头像右下角 -->
      <div
        class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)] z-20"
        :class="comment.user_is_online ? 'bg-emerald-400' : 'bg-gray-400'"
        :title="comment.user_is_online ? onlineTitle : '离线'"
      />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-medium text-gray-800 truncate">
          {{ userDisplayName }}
        </span>

        <!-- 用户标签：比用户名小一号 -->
        <span
          v-if="userTag && userTag.useCssMode"
          :class="userTag.className"
          class="inline-block text-xs leading-tight px-1.5 py-0.5 rounded"
        >
          {{ userTag.title }}
        </span>
        <span
          v-else-if="userTag"
          class="inline-block text-xs leading-tight px-1.5 py-0.5 rounded font-medium"
          :style="userTag.inlineStyles"
        >
          {{ userTag.title }}
        </span>

        <span
          v-if="showStatusBadge && comment.status === 1"
          class="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-600 rounded-full"
        >
          已隐藏
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentDto } from '~/types'

const props = withDefaults(defineProps<{
  comment: CommentDto
  size?: number
  clickable?: boolean
  showStatusBadge?: boolean
}>(), {
  size: 48,
  clickable: false,
  showStatusBadge: false,
})

const emit = defineEmits<{
  'avatar-click': []
}>()

const { assetUrl } = useAssetUrl()
const { renderTag } = useTagRenderer()

const avatarFailed = ref(false)

const userDisplayName = computed(() => {
  return props.comment.user_display_name?.trim() ||
    props.comment.user_username ||
    `用户${props.comment.user_id?.slice(0, 6) || ''}`
})

const userInitials = computed(() => {
  const base = userDisplayName.value || ''
  const trimmed = base.trim()
  if (!trimmed) return '匿'
  return trimmed.slice(0, 2).toUpperCase()
})

const isGifAvatar = computed(() => {
  const raw = props.comment.user_avatar_url || ''
  return /\.gif(?:$|\?)/i.test(raw)
})

const avatarUrl = computed(() => {
  if (avatarFailed.value) return null
  const raw = props.comment.user_avatar_url
  if (!raw) return null

  // ✅ 头像URL格式：/uploads/avatars/{userId}-{timestamp}.{ext}
  // URL中已包含时间戳，换头像后URL会自动变化，天然支持缓存
  return assetUrl(raw)
})

const avatarFormat = computed(() => (isGifAvatar.value ? 'gif' : 'webp'))
const avatarQuality = computed(() => (isGifAvatar.value ? undefined : 85))

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

const placeholderTextClass = computed(() => {
  if (props.size <= 28) return 'text-[10px]'
  if (props.size <= 36) return 'text-xs'
  if (props.size <= 48) return 'text-sm'
  return 'text-base'
})

const userTag = computed(() => renderTag(props.comment.user_tag))

const onlineTitle = computed(() => {
  if (!props.comment.user_is_online) return ''
  if (!props.comment.user_last_heartbeat) return '在线'
  return `在线 · ${formatTimeAgo(props.comment.user_last_heartbeat)}`
})

const avatarWrapperClasses = computed(() => (
  props.clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
))

watch(() => props.comment.user_avatar_url, () => {
  avatarFailed.value = false
})

const handleAvatarClick = () => {
  if (!props.clickable) return
  emit('avatar-click')
}

const onAvatarError = () => {
  avatarFailed.value = true
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>
