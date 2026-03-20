<template>
  <article
    :class="[
      'border-b border-zinc-200 bg-white px-4 py-4 transition-colors sm:px-5',
      interactive ? 'cursor-pointer hover:bg-zinc-50/80' : '',
      highlight ? 'bg-sky-50/50' : '',
    ]"
    @click="handleRootClick"
  >
    <div class="flex items-start gap-3">
      <button
        type="button"
        class="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100"
        @click.stop="navigateToAuthor"
      >
        <NuxtImg
          v-if="authorAvatarUrl"
          :src="authorAvatarUrl"
          :alt="authorDisplayName"
          class="h-full w-full object-cover"
          width="44"
          height="44"
        />
        <span
          v-else
          class="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-700"
        >
          {{ authorInitials }}
        </span>
        <span
          class="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white"
          :class="authorIsOnline ? 'bg-emerald-500' : 'bg-zinc-300'"
        />
      </button>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <button
            type="button"
            class="truncate font-semibold text-zinc-950 hover:underline"
            @click.stop="navigateToAuthor"
          >
            {{ authorDisplayName }}
          </button>
          <span
            v-if="authorHandle"
            class="truncate text-zinc-500"
          >
            {{ authorHandle }}
          </span>
          <span class="text-zinc-400">·</span>
          <span class="text-zinc-500">{{ relativeTime }}</span>
          <span
            v-if="post.is_pinned"
            class="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white"
          >
            <PinIcon class="h-3 w-3" />
            置顶
          </span>
          <span
            v-if="post.is_featured"
            class="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700"
          >
            <StarIcon class="h-3 w-3" />
            精选
          </span>
          <span
            v-if="post.is_locked"
            class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
          >
            <LockIcon class="h-3 w-3" />
            已锁定
          </span>
        </div>

        <p
          v-if="replyContext"
          class="mt-1 text-xs text-zinc-500"
        >
          {{ replyContext }}
        </p>

        <p
          v-if="confessionLabel"
          class="mt-2 text-sm font-medium text-zinc-900"
        >
          {{ confessionLabel }}
        </p>

        <div class="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-900">
          {{ post.content }}
        </div>

        <div
          v-if="relatedSummary"
          class="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3"
          @click.stop="navigateToRelated"
        >
          <div class="text-xs text-zinc-500">
            {{ relatedLabel }}
          </div>
          <div class="mt-1 flex items-center gap-2 text-sm">
            <span class="font-medium text-zinc-900">{{ relatedSummary.author_display_name || relatedSummary.author_name }}</span>
            <span class="truncate text-zinc-500">{{ relatedHandle }}</span>
          </div>
          <div class="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm text-zinc-800">
            {{ relatedSummary.content }}
          </div>
        </div>

        <div
          v-if="post.images?.length"
          class="mt-3"
          @click.stop
        >
          <ImageGrid
            :images="post.images"
            :alt-prefix="imageAltPrefix"
            :eager="eager"
          />
        </div>

        <div class="mt-4 flex items-center justify-between gap-2 text-zinc-500">
          <button
            type="button"
            class="inline-flex min-w-[72px] items-center gap-2 rounded-full px-2 py-1 text-sm transition hover:bg-sky-50 hover:text-sky-600"
            @click.stop="goReply"
          >
            <MessageCircleIcon class="h-4 w-4" />
            <span>{{ replyCount }}</span>
          </button>

          <button
            type="button"
            class="inline-flex min-w-[72px] items-center gap-2 rounded-full px-2 py-1 text-sm transition hover:bg-rose-50"
            :class="liked ? 'text-rose-600' : 'hover:text-rose-600'"
            @click.stop="toggleLike"
          >
            <HeartIcon :class="['h-4 w-4', liked ? 'fill-current' : '']" />
            <span>{{ likeCount }}</span>
          </button>

          <div class="inline-flex min-w-[72px] items-center gap-2 rounded-full px-2 py-1 text-sm">
            <Repeat2Icon class="h-4 w-4" />
            <span>{{ repostCount }}</span>
          </div>

          <div class="inline-flex min-w-[72px] items-center gap-2 rounded-full px-2 py-1 text-sm">
            <BarChart2Icon class="h-4 w-4" />
            <span>{{ viewCount }}</span>
          </div>

          <div @click.stop>
            <ShareButton
              :data="shareData"
              :show-text="false"
              size="sm"
              mode="smart"
            />
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  BarChart2Icon,
  HeartIcon,
  LockIcon,
  MessageCircleIcon,
  PinIcon,
  Repeat2Icon,
  StarIcon,
} from 'lucide-vue-next'
import ShareButton from '~/components/ui/ShareButton.vue'
import type { PostDto, PostSummary } from '~/types'

const props = withDefaults(defineProps<{
  post: PostDto
  interactive?: boolean
  highlight?: boolean
  eager?: boolean
}>(), {
  interactive: true,
  highlight: false,
  eager: false,
})

const emit = defineEmits<{
  updated: [post: PostDto]
}>()

const localePath = useLocalePath()
const route = useRoute()
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()
const { assetUrl } = useAssetUrl()
const { renderTag } = useTagRenderer()

const liked = ref(!!props.post.liked_by_me)
const likeCount = ref(props.post.like_count ?? 0)

watch(() => props.post.liked_by_me, (value) => {
  liked.value = !!value
})

watch(() => props.post.like_count, (value) => {
  likeCount.value = value ?? 0
})

const authorDisplayName = computed(() => props.post.author_display_name?.trim() || props.post.author_name || '匿名用户')
const authorInitials = computed(() => authorDisplayName.value.trim().slice(0, 2).toUpperCase() || 'LW')
const authorAvatarUrl = computed(() => {
  if (!props.post.author_avatar_url) return null
  return assetUrl(props.post.author_avatar_url)
})
const authorIsOnline = computed(() => !!props.post.author_is_online)
const authorTag = computed(() => renderTag(props.post.author_tag))
const authorHandle = computed(() => {
  const raw = props.post.author_name?.trim()
  if (!raw) return ''
  if (raw === authorDisplayName.value.trim()) return ''
  return `@${raw.replace(/\s+/g, '').slice(0, 24)}`
})

const replyCount = computed(() => props.post.reply_count ?? props.post.comment_count ?? 0)
const repostCount = computed(() => (props.post.repost_count ?? 0) + (props.post.quote_count ?? 0))
const viewCount = computed(() => props.post.view_count ?? 0)

const confessionLabel = computed(() => {
  if (props.post.card_type === 'social') return ''
  if (!props.post.target_name) return ''
  return `向 ${props.post.target_name} 说`
})

const replyContext = computed(() => {
  if (props.post.reply_to) {
    return `回复 ${(props.post.reply_to.author_display_name || props.post.reply_to.author_name).trim()}`
  }
  return ''
})

const relatedSummary = computed<PostSummary | null>(() => {
  if (props.post.quote_of) return props.post.quote_of
  if (props.post.repost_of) return props.post.repost_of
  return null
})

const relatedLabel = computed(() => {
  if (props.post.quote_of) return '引用'
  if (props.post.repost_of) return '转发'
  return ''
})

const relatedHandle = computed(() => {
  const summary = relatedSummary.value
  if (!summary) return ''
  const raw = summary.author_name?.trim()
  const display = summary.author_display_name?.trim()
  if (!raw || raw === display) return ''
  return `@${raw.replace(/\s+/g, '').slice(0, 24)}`
})

const imageAltPrefix = computed(() => props.post.card_type === 'social'
  ? `${authorDisplayName.value} 的动态图片`
  : `${authorDisplayName.value} 的表白图片`,
)

const relativeTime = computed(() => formatTimeAgo(props.post.created_at))

const shareData = computed(() => {
  const origin = import.meta.client ? window.location.origin : ''
  return {
    title: confessionLabel.value || authorDisplayName.value,
    text: props.post.content.length > 100 ? `${props.post.content.slice(0, 100)}...` : props.post.content,
    url: `${origin}${localePath(`/posts/${props.post.id}`)}`,
  }
})

const handleRootClick = async () => {
  if (!props.interactive) return
  await navigateTo(localePath(`/posts/${props.post.id}`))
}

const navigateToAuthor = async () => {
  if (!props.post.author_id) return
  await navigateTo(localePath(`/users/id/${props.post.author_id}`))
}

const navigateToRelated = async () => {
  if (!relatedSummary.value?.id) return
  await navigateTo(localePath(`/posts/${relatedSummary.value.id}`))
}

const goReply = async () => {
  if (route.params.id === props.post.id) {
    window.dispatchEvent(new CustomEvent('timeline:focus-reply'))
    return
  }
  await navigateTo(localePath(`/posts/${props.post.id}`))
}

const toggleLike = async () => {
  if (!auth.isAuthenticated) {
    toast.info('请先登录后再点赞')
    return
  }

  const previousLiked = liked.value
  const previousCount = likeCount.value
  liked.value = !previousLiked
  likeCount.value = Math.max(0, previousCount + (previousLiked ? -1 : 1))

  try {
    if (previousLiked) {
      await api.unlikePost(props.post.id)
    } else {
      await api.likePost(props.post.id)
    }
    props.post.liked_by_me = liked.value
    props.post.like_count = likeCount.value
    emit('updated', props.post)
  } catch (error: any) {
    liked.value = previousLiked
    likeCount.value = previousCount
    toast.error(error?.message || '点赞失败')
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>

<style scoped>
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
