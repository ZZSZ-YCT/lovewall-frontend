<template>
  <GlassCard 
    :class="[
      variant === 'list' ? 'post-card-list' : 'post-card',
      'cursor-pointer group relative overflow-hidden',
      'transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-lg',
      'rounded-3xl',
      isMobile && 'rounded-2xl sm:rounded-3xl',
    ]" 
    @click="goDetail"
  >
    <!-- Header -->
    <div
:class="[
      'flex items-center justify-between pb-3',
      isMobile ? 'px-3 pt-3' : 'px-4 pt-4'
    ]">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Author Avatar -->
        <div
          :class="[
            'relative flex-shrink-0 transition-transform hover:scale-110 cursor-pointer avatar-wrapper',
            isMobile ? 'w-10 h-10' : 'w-12 h-12'
          ]"
          @click.stop="navigateToAuthor"
        >
          <!-- 管理员光圈效果 -->
          <template v-if="post.is_author_admin">
            <div
              class="absolute -inset-[4px] rounded-full border-[4px] border-sky-400/95 pointer-events-none"
            />
            <div
              class="absolute -inset-[8px] rounded-full bg-sky-300/40 blur-2xl pointer-events-none"
            />
          </template>

          <!-- 头像容器 -->
          <NuxtImg
            v-if="authorAvatarUrl"
            :src="authorAvatarUrl"
            :alt="authorDisplayName"
            format="webp"
            class="author-avatar"
            :class="post.is_author_admin ? 'border-0' : 'border-2 border-white/20'"
            @error="handleAuthorAvatarError"
          />

          <!-- Default initials when no avatar -->
          <div
            v-else
            class="avatar-placeholder"
            :class="[
              isMobile ? 'text-xs' : 'text-sm',
              post.is_author_admin ? 'border-0' : 'border-2 border-white/20'
            ]"
          >
            {{ authorInitials }}
          </div>

          <!-- 在线状态指示器：总是显示，在线绿色/离线灰色 -->
          <span
            class="online-indicator"
            :class="authorIsOnline ? 'bg-emerald-400' : 'bg-gray-400'"
            :title="authorIsOnline ? (authorOnlineTitle || '在线') : '离线'"
          />
        </div>
        
        <div class="flex-1 min-w-0">
          <!-- 用户名、徽章、标签在同一行 -->
          <div
:class="[
            'flex items-center gap-2 flex-wrap',
            isMobile ? 'mb-0.5' : 'mb-1'
          ]">
            <h3
:class="[
              'font-semibold text-gray-900 cursor-pointer hover:text-brand-600 transition-colors truncate',
              isMobile ? 'text-sm' : 'text-base'
            ]" @click.stop="navigateToAuthor">
              {{ authorDisplayName }}
            </h3>
            <span
              v-if="authorDeleted"
              class="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-700 rounded-full"
            >
              已注销
            </span>

            <!-- 用户标签：比用户名小一号 -->
            <span
              v-if="authorTag && authorTag.useCssMode"
              :class="authorTag.className"
              class="inline-block text-xs leading-tight px-2 py-0.5 rounded"
            >
              {{ authorTag.title }}
            </span>
            <span
              v-else-if="authorTag"
              class="inline-block text-xs leading-tight px-2 py-0.5 rounded font-medium"
              :style="authorTag.inlineStyles"
            >
              {{ authorTag.title }}
            </span>

            <!-- 置顶精华徽章 -->
            <span
              v-if="post.status !== 1 && post.is_pinned"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/80 text-white"
            >
              <PinIcon class="w-2.5 h-2.5" />
              置顶
            </span>

            <span
              v-if="post.status !== 1 && post.is_featured"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/80 text-white"
            >
              <StarIcon class="w-2.5 h-2.5" />
              精华
            </span>

            <!-- 已隐藏徽章（仅管理员可见） -->
            <span
              v-if="isModerator && post.status === 1"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/80 text-white"
            >
              已隐藏
            </span>
          </div>

          <!-- 第二行：时间和锁定状态 -->
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>{{ formatDate(post.created_at) }}</span>
            <div
              v-if="post.is_locked"
              class="inline-flex items-center gap-1"
            >
              <LockIcon class="w-3 h-3" />
              <span>已锁定</span>
            </div>
          </div>
        </div>
      </div>

      <ClientOnly>
        <!-- Actions dropdown -->
        <div v-if="showActions && canManage" ref="dropdownRef" class="relative flex-shrink-0" @click.stop>
          <button
            ref="dropdownButtonRef"
            class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/20 transition-colors opacity-80 group-hover:opacity-100"
            @click="toggleDropdown"
          >
            <MoreVerticalIcon class="w-4 h-4" />
          </button>

          <Teleport to="body">
            <div
              v-if="showDropdown"
              ref="dropdownMenuRef"
              :style="dropdownStyle"
              class="fixed w-48 glass-card py-2 shadow-lg z-[9999]"
              @click.stop
            >
            <NuxtLink
              :to="`/posts/${post.id}`"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-white/20"
              @click="showDropdown = false"
            >
              查看详情
            </NuxtLink>

            <template v-if="canManagePost">
              <hr class="my-1 border-white/20">
              <button
                v-if="auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_POSTS'])"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20 flex items-center gap-2"
                @click="handleEdit"
              >
                <EditIcon class="w-4 h-4" />
                <span>✏️ 编辑</span>
              </button>
              <button
                v-if="auth.hasPerm('MANAGE_FEATURED') && post.status === 0"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20"
                @click="handlePin(!post.is_pinned)"
              >
                {{ post.is_pinned ? '取消置顶' : '置顶' }}
              </button>

              <button
                v-if="auth.hasPerm('MANAGE_FEATURED') && post.status === 0"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20"
                @click="handleFeature(!post.is_featured)"
              >
                {{ post.is_featured ? '取消精华' : '设为精华' }}
              </button>

              <button
                v-if="auth.hasPerm('MANAGE_POSTS')"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/20"
                @click="handleHide"
              >
                {{ post.status === 0 ? '隐藏' : '恢复' }}
              </button>

              <button
                v-if="auth.hasPerm('MANAGE_POSTS')"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/20"
                @click="handleDelete"
              >
                删除
              </button>
            </template>
            </div>
          </Teleport>
        </div>
        <template #fallback>
          <div class="relative flex-shrink-0 invisible"></div>
        </template>
      </ClientOnly>
    </div>

    <!-- Content -->
    <div
:class="[
      'pb-3',
      isMobile ? 'px-3' : 'px-4'
    ]">
      <!-- Love declaration -->
      <div :class="isMobile ? 'mb-2' : 'mb-3'">
        <p
          v-if="(post.card_type !== 'communication' && post.card_type !== 'social') && post.target_name"
          :class="[
            'font-medium text-gray-900 mb-2',
            isMobile ? 'text-base' : 'text-lg'
          ]"
        >
          → {{ post.target_name }}
        </p>
        <p
:class="[
          'text-gray-700 leading-relaxed',
          isMobile ? 'text-xs' : 'text-sm',
          { 'line-clamp-3': !expanded && isMobile },
          { 'line-clamp-4': !expanded && !isMobile }
        ]">
          {{ post.content }}
        </p>
        
        <button
          v-if="post.content.length > 150"
          class="mt-2 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          @click.stop="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
        </button>
      </div>
    </div>

    <!-- Images -->
    <div
      v-if="post.images?.length"
      :class="[
        'pb-3',
        isMobile ? 'px-3' : 'px-4'
      ]"
      @click.stop
    >
      <ImageGrid
        :images="post.images"
        :alt-prefix="(post.card_type !== 'communication' && post.card_type !== 'social' && post.target_name) ? (post.author_name + ' 的表白图片') : (post.author_name + ' 的交流图片')"
      />
    </div>

    <!-- Footer -->
    <div
:class="[
      'flex items-center justify-between border-t border-white/10',
      isMobile ? 'px-3 py-2' : 'px-4 py-3'
    ]">
      <div class="flex items-center gap-4">
        <ShareButton
          :data="shareData"
          :show-text="!isMobile"
          :size="isMobile ? 'sm' : 'md'"
          mode="smart"
          @click.stop
        />
      </div>
      
      <div
:class="[
        'text-gray-400',
        isMobile ? 'text-xs' : 'text-sm'
      ]">
        {{ formatTimeAgo(post.created_at) }}
      </div>
    </div>

  </GlassCard>
</template>

<script setup lang="ts">
import {EditIcon, LockIcon, MoreVerticalIcon, PinIcon, StarIcon} from 'lucide-vue-next'
import {onClickOutside} from '@vueuse/core'
import GlassCard from '~/components/ui/GlassCard.vue'
import ShareButton from '~/components/ui/ShareButton.vue'
import type {PostDto} from '~/types'

const ImageGrid = defineAsyncComponent(() => import('~/components/ui/ImageGrid.vue'))

interface Props {
  post: PostDto
  showActions?: boolean
  variant?: 'grid' | 'list'
}

type PostAuthorMeta = {
  author_display_name?: string | null
  author_avatar_url?: string | null
  author_is_online?: boolean
  author_last_heartbeat?: string | null
  author_is_deleted?: boolean
  author_deleted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  variant: 'grid'
})

const emit = defineEmits<{
  refresh: []
}>()

// Stores
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()
const { assetUrl } = useAssetUrl()
const { isMobile } = useDeviceSafe()
const { confirm: confirmDialog, prompt: promptDialog } = useAdminDialog()
const { renderTag } = useTagRenderer()

// State
const expanded = ref(false)
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement>()
const dropdownButtonRef = ref<HTMLElement>()
const dropdownMenuRef = ref<HTMLElement>()
const avatarLoadFailed = ref(false)
const postAuthorMeta = computed(() => props.post as PostDto & PostAuthorMeta)

watch(() => postAuthorMeta.value.author_avatar_url, () => {
  avatarLoadFailed.value = false
})

// Dropdown位置计算
const dropdownStyle = ref<{ top: string; left?: string; right?: string }>({ top: '0px', left: '0px' })

const updateDropdownPosition = () => {
  if (!dropdownButtonRef.value) return
  const rect = dropdownButtonRef.value.getBoundingClientRect()
  const menuWidth = 192 // w-48 = 12rem = 192px

  // 计算是否右侧空间足够
  const spaceOnRight = window.innerWidth - rect.right
  const spaceOnLeft = rect.left

  if (spaceOnRight >= menuWidth) {
    // 右侧空间足够，右对齐按钮
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.right - menuWidth}px`,
      right: undefined
    }
  } else if (spaceOnLeft >= menuWidth) {
    // 右侧不够，左侧对齐
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      right: undefined
    }
  } else {
    // 两侧都不够，贴右边
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: undefined,
      right: '8px'
    }
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    nextTick(() => {
      updateDropdownPosition()
    })
  }
}

// 监听窗口变化和滚动，更新dropdown位置
watch(showDropdown, (isOpen) => {
  if (isOpen) {
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
  } else {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  showDropdown.value = false
})

const authorDisplayName = computed(() => {
  const displayName = postAuthorMeta.value.author_display_name?.trim()
  return displayName && displayName.length > 0 ? displayName : props.post.author_name
})

const authorInitials = computed(() => {
  const source = authorDisplayName.value || props.post.author_name || ''
  const trimmed = source.trim()
  if (!trimmed) return '匿'
  return trimmed.slice(0, 2).toUpperCase()
})

const authorAvatarUrl = computed(() => {
  if (avatarLoadFailed.value) return null
  const avatar = postAuthorMeta.value.author_avatar_url
  return avatar ? assetUrl(avatar) : null
})

const authorIsOnline = computed(() => postAuthorMeta.value.author_is_online ?? false)
const authorLastHeartbeat = computed(() => postAuthorMeta.value.author_last_heartbeat ?? null)

const authorOnlineTitle = computed(() => {
  if (!authorIsOnline.value) return ''
  if (!authorLastHeartbeat.value) return '在线'
  return `在线 · ${formatTimeAgo(authorLastHeartbeat.value)}`
})

const authorTag = computed(() => renderTag(postAuthorMeta.value.author_tag))

const authorDeleted = computed(() =>
  Boolean(postAuthorMeta.value.author_is_deleted ?? postAuthorMeta.value.author_deleted)
)

const handleAuthorAvatarError = () => {
  avatarLoadFailed.value = true
}

// Computed
const canManage = computed(() => {
  return auth.isAuthenticated && (
    auth.isSuperadmin ||
    auth.hasAnyPerm(['MANAGE_FEATURED', 'MANAGE_POSTS'])
  )
})

const canManagePost = computed(() => {
  return auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_FEATURED', 'MANAGE_POSTS'])
})

const isModerator = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS'))

// 分享数据
const shareData = computed(() => {
  const origin = import.meta.client ? window.location.origin : 'https://your-domain.com'
  const isConfession = props.post.card_type !== 'communication' && props.post.card_type !== 'social'
  const title = isConfession && props.post.target_name
    ? `${props.post.author_name} 对 ${props.post.target_name} 的表白`
    : `${props.post.author_name} 的交流`
  return {
    title,
    text: props.post.content.length > 100 ?
      `${props.post.content.substring(0, 100)}...` :
      props.post.content,
    url: `${origin}/posts/${props.post.id}`
  }
})

const goDetail = async () => {
  await navigateTo(`/posts/${props.post.id}`)
}

const handleEdit = async () => {
  showDropdown.value = false
  await navigateTo(`/posts/${props.post.id}?edit=1`)
}

// Navigate to author profile
const navigateToAuthor = () => {
  if (authorDeleted.value) {
    toast.info('该用户已注销，无法访问主页')
    return
  }
  // 如果有author_id，使用ID路由，否则使用用户名（临时方案）
  if (props.post.author_id) {
    navigateTo(`/users/id/${props.post.author_id}`)
  } else {
    // 备用方案：通过作者名称导航（不推荐，因为名称可能重复）
    navigateTo(`/users/${encodeURIComponent(props.post.author_name)}`)
  }
}

// Actions
const handlePin = async (pin: boolean) => {
  try {
    const reason = await promptModerationReason(pin ? '置顶' : '取消置顶')
    if (reason === null) return
    await api.pinPost(props.post.id, pin, reason || undefined)
    toast.success(pin ? '已置顶' : '已取消置顶')
    emit('refresh')
  } catch (error) {
    console.error('Pin post failed:', error)
  }
  showDropdown.value = false
}

const handleFeature = async (feature: boolean) => {
  try {
    const reason = await promptModerationReason(feature ? '设为精华' : '取消精华')
    if (reason === null) return
    await api.featurePost(props.post.id, feature, reason || undefined)
    toast.success(feature ? '已设为精华' : '已取消精华')
    emit('refresh')
  } catch (error) {
    console.error('Feature post failed:', error)
  }
  showDropdown.value = false
}

const handleHide = async () => {
  const hide = props.post.status === 0
  if (hide) {
    const confirmed = await confirmDialog({
      title: '确认隐藏',
      message: '确定要隐藏这个帖子吗？',
      confirmText: '确认隐藏',
      cancelText: '取消'
    })
    if (!confirmed) return
  }
  try {
    const reason = await promptModerationReason(hide ? '隐藏' : '恢复')
    if (reason === null) return
    await api.hidePost(props.post.id, hide, reason || undefined)
    toast.success(hide ? '已隐藏帖子' : '已恢复帖子')
    emit('refresh')
  } catch (error) {
    console.error('Hide/unhide post failed:', error)
  }
  showDropdown.value = false
}

const handleDelete = async () => {
  const confirmed = await confirmDialog({
    title: '删除帖子',
    message: '确定要删除这个帖子吗？此操作不可恢复！',
    confirmText: '删除',
    cancelText: '取消'
  })
  if (!confirmed) return
  
  try {
    const reason = await promptModerationReason('删除')
    if (reason === null) return
    await api.deletePost(props.post.id, reason || undefined)
    toast.success('已删除帖子')
    emit('refresh')
  } catch (error) {
    console.error('Delete post failed:', error)
  }
  showDropdown.value = false
}


const promptModerationReason = async (action: string): Promise<string | null> => {
  if (!import.meta.client) return ''

  const input = await promptDialog({
    title: `${action}处理`,
    inputLabel: '处理原因(可选)',
    placeholder: '请输入处理原因(可选)',
    confirmText: '确定',
    cancelText: '取消'
  })

  if (input === null) return null
  return input.trim()
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 5) return '几分钟前'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// Added: absolute date formatter used in header
const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return String(dateString)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return String(dateString)
  }
}
</script>

<style scoped>
.author-avatar {
  @apply relative z-10 w-full h-full rounded-full object-cover;
}

.avatar-placeholder {
  @apply relative z-10 w-full h-full rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold uppercase;
}

.avatar-wrapper {
  @apply relative;
}

.online-indicator {
  @apply absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)] z-20;
}

.tag-badge {
  @apply inline-block text-xs px-2 py-1 rounded font-medium leading-none;
}

.admin-badge {
  @apply inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700 font-medium;
}
</style>













