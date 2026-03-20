<template>
  <div class="page-shell overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
    <div v-if="pending" class="px-4 py-16 text-center sm:px-5">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-sm text-zinc-500">正在加载帖子…</p>
    </div>

    <div v-else-if="errorMessage" class="px-4 py-16 text-center sm:px-5">
      <p class="text-sm text-zinc-500">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white"
        @click="refreshAll"
      >
        重新加载
      </button>
    </div>

    <template v-else-if="post">
      <section v-if="threadAncestors.length" class="border-b border-zinc-200 bg-zinc-50/70">
        <div class="px-4 py-3 text-xs font-medium tracking-wide text-zinc-500 sm:px-5">
          上游线程
        </div>
        <TimelinePost
          v-for="item in threadAncestors"
          :key="item.id"
          :post="item"
        />
      </section>

      <section>
        <div class="border-b border-zinc-200 px-4 py-3 sm:px-5">
          <button
            type="button"
            class="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            @click="$router.back()"
          >
            返回
          </button>
        </div>

        <TimelinePost
          :post="post"
          :interactive="false"
          :highlight="true"
          :eager="true"
          @updated="handlePostUpdated"
        />
      </section>

      <section
        v-if="canManage || canEditOwnPost"
        class="border-b border-zinc-200 bg-zinc-50/70 px-4 py-4 sm:px-5"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-if="canEditOwnPost"
            type="button"
            class="btn-secondary"
            @click="startEdit"
          >
            编辑
          </button>
          <button
            v-if="canFeature"
            type="button"
            class="btn-secondary"
            @click="togglePin"
          >
            {{ post.is_pinned ? '取消置顶' : '置顶' }}
          </button>
          <button
            v-if="canFeature"
            type="button"
            class="btn-secondary"
            @click="toggleFeature"
          >
            {{ post.is_featured ? '取消精选' : '设为精选' }}
          </button>
          <button
            v-if="canManagePosts"
            type="button"
            class="btn-secondary"
            @click="toggleHide"
          >
            {{ post.status === 1 ? '恢复显示' : '隐藏' }}
          </button>
          <button
            v-if="canManagePosts"
            type="button"
            class="btn-secondary"
            @click="toggleLock"
          >
            {{ post.is_locked ? '解锁回复' : '锁定回复' }}
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="btn-danger"
            @click="deletePost"
          >
            删除
          </button>
        </div>

        <form
          v-if="editing"
          class="mt-4 space-y-3 rounded-3xl border border-zinc-200 bg-white p-4"
          @submit.prevent="saveEdit"
        >
          <input
            v-if="post.card_type !== 'social'"
            v-model="editForm.target_name"
            class="input"
            placeholder="表白对象"
          />
          <textarea
            v-model="editForm.content"
            class="input min-h-[140px] resize-none"
            placeholder="编辑内容"
          />
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" @click="cancelEdit">取消</button>
            <button type="submit" class="btn-primary" :disabled="savingEdit">
              {{ savingEdit ? '保存中…' : '保存修改' }}
            </button>
          </div>
        </form>
      </section>

      <section class="border-b border-zinc-200 px-4 py-4 sm:px-5">
        <div class="flex items-start gap-3">
          <div class="hidden h-11 w-11 flex-shrink-0 rounded-full border border-zinc-200 bg-zinc-100 sm:block"></div>
          <div class="min-w-0 flex-1">
            <div
              v-if="post.is_locked && !canManagePosts"
              class="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              当前帖子已锁定，普通用户暂时不能回复。
            </div>

            <div v-else-if="auth.isAuthenticated" class="rounded-3xl border border-zinc-200 bg-white p-4">
              <textarea
                ref="replyInput"
                v-model="replyContent"
                class="min-h-[120px] w-full resize-none border-0 bg-transparent text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="发布你的回复"
              />
              <div class="mt-4 flex items-center justify-between">
                <p class="text-xs text-zinc-500">回复会作为新的帖子记录进线程。</p>
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
                  :disabled="replySubmitting || !replyContent.trim()"
                  @click="submitReply"
                >
                  {{ replySubmitting ? '发送中…' : '回复' }}
                </button>
              </div>
            </div>

            <div v-else class="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              登录后即可参与回复。
              <NuxtLink :to="localePath('/auth/login')" class="ml-2 font-medium text-zinc-900 underline">
                立即登录
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="border-b border-zinc-200 px-4 py-3 sm:px-5">
          <div class="text-sm font-semibold text-zinc-950">
            回复 {{ replies.length }}
          </div>
        </div>

        <div v-if="repliesPending && replies.length === 0" class="px-4 py-12 text-center sm:px-5">
          <LoadingSpinner />
        </div>

        <div v-else-if="replies.length === 0" class="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
          还没有回复，来抢第一个。
        </div>

        <TimelinePost
          v-for="reply in replies"
          :key="reply.id"
          :post="reply"
          @updated="handleReplyUpdated"
        />

        <div
          v-if="repliesData && repliesData.page * repliesData.page_size < repliesData.total"
          class="border-t border-zinc-200 px-4 py-6 text-center sm:px-5"
        >
          <button
            type="button"
            class="btn-secondary"
            :disabled="repliesPending"
            @click="loadMoreReplies"
          >
            {{ repliesPending ? '加载中…' : '加载更多回复' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { Pagination, PostDto } from '~/types'

const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()
const home = useHomeStore()
const { confirm, prompt } = useAdminDialog()

const postId = computed(() => String(route.params.id || ''))

const {
  data: postData,
  pending,
  error,
  refresh: refreshPost,
} = await useAsyncData(
  () => `post-${postId.value}`,
  async () => await api.getPost(postId.value),
  { watch: [postId] },
)

const {
  data: threadData,
  refresh: refreshThread,
} = await useAsyncData(
  () => `post-thread-${postId.value}`,
  async () => await api.getThread(postId.value),
  { watch: [postId] },
)

const {
  data: repliesInit,
  pending: repliesPendingRef,
  refresh: refreshReplies,
} = await useAsyncData(
  () => `post-replies-${postId.value}`,
  async () => await api.listReplies(postId.value, { page: 1, page_size: 20 }),
  { watch: [postId] },
)

const post = computed(() => postData.value || null)
const threadAncestors = computed(() => (threadData.value?.thread || []).filter((item) => item.id !== postId.value))
const replies = ref<PostDto[]>([])
const repliesData = ref<Pagination<PostDto> | null>(null)
const repliesPending = computed(() => repliesPendingRef.value)
const errorMessage = computed(() => error.value?.message || '')

watch(repliesInit, (value) => {
  if (!value) return
  replies.value = [...value.items]
  repliesData.value = { ...value }
}, { immediate: true })

const replyContent = ref('')
const replySubmitting = ref(false)
const replyInput = ref<HTMLTextAreaElement | null>(null)

const editing = ref(false)
const savingEdit = ref(false)
const editForm = reactive({
  target_name: '',
  content: '',
})

const canManagePosts = computed(() => auth.isAuthenticated && (auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')))
const canFeature = computed(() => auth.isAuthenticated && (auth.isSuperadmin || auth.hasPerm('MANAGE_FEATURED')))
const canManage = computed(() => canManagePosts.value || canFeature.value)
const canEditOwnPost = computed(() => auth.isAuthenticated && !!post.value && (post.value.author_id === auth.currentUser?.id || canManagePosts.value))
const canDelete = computed(() => auth.isAuthenticated && !!post.value && (post.value.author_id === auth.currentUser?.id || canManagePosts.value))

const refreshAll = async () => {
  await Promise.all([refreshPost(), refreshThread(), refreshReplies()])
}

const loadMoreReplies = async () => {
  if (!repliesData.value) return
  const nextPage = repliesData.value.page + 1
  const data = await api.listReplies(postId.value, { page: nextPage, page_size: repliesData.value.page_size })
  replies.value.push(...data.items)
  repliesData.value = data
}

const submitReply = async () => {
  if (!replyContent.value.trim()) return
  replySubmitting.value = true
  try {
    const reply = await api.createReply(postId.value, { content: replyContent.value.trim(), confessor_mode: 'self' })
    replies.value.unshift(reply)
    if (repliesData.value) {
      repliesData.value.total += 1
    }
    if (post.value) {
      post.value.reply_count = (post.value.reply_count ?? 0) + 1
    }
    replyContent.value = ''
    toast.success('回复已发布')
  } catch (error: any) {
    toast.error(error?.message || '回复失败')
  } finally {
    replySubmitting.value = false
  }
}

const promptReason = async (label: string) => {
  const result = await prompt({
    title: `${label}原因`,
    inputLabel: '原因（可选）',
    placeholder: '填写这次操作的原因',
    confirmText: '确认',
    cancelText: '取消',
  })
  if (result === null) return null
  return result.trim()
}

const startEdit = () => {
  if (!post.value) return
  editForm.target_name = post.value.target_name || ''
  editForm.content = post.value.content || ''
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
}

const saveEdit = async () => {
  if (!post.value) return
  savingEdit.value = true
  try {
    const updated = await api.updatePost(post.value.id, {
      target_name: editForm.target_name,
      content: editForm.content,
    })
    postData.value = { ...(post.value as PostDto), ...updated }
    editing.value = false
    toast.success('帖子已更新')
  } catch (error: any) {
    toast.error(error?.message || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

const togglePin = async () => {
  if (!post.value) return
  const reason = await promptReason(post.value.is_pinned ? '取消置顶' : '置顶')
  if (reason === null) return
  const result = await api.pinPost(post.value.id, !post.value.is_pinned, reason || undefined)
  post.value.is_pinned = result.is_pinned
}

const toggleFeature = async () => {
  if (!post.value) return
  const reason = await promptReason(post.value.is_featured ? '取消精选' : '设为精选')
  if (reason === null) return
  const result = await api.featurePost(post.value.id, !post.value.is_featured, reason || undefined)
  post.value.is_featured = result.is_featured
}

const toggleHide = async () => {
  if (!post.value) return
  const reason = await promptReason(post.value.status === 1 ? '恢复显示' : '隐藏帖子')
  if (reason === null) return
  const result = await api.hidePost(post.value.id, post.value.status === 0, reason || undefined)
  post.value.status = result.status as 0 | 1
}

const toggleLock = async () => {
  if (!post.value) return
  if (post.value.is_locked) {
    const result = await api.unlockPost(post.value.id)
    post.value.is_locked = result.is_locked
  } else {
    const result = await api.lockPost(post.value.id)
    post.value.is_locked = result.is_locked
  }
}

const deletePost = async () => {
  if (!post.value) return
  const ok = await confirm({
    title: '删除帖子',
    message: '删除后无法恢复，确认继续吗？',
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  const reason = await promptReason('删除帖子')
  if (reason === null) return
  await api.deletePost(post.value.id, reason || undefined)
  home.refreshIfStale().catch(() => {})
  toast.success('帖子已删除')
  await router.push(localePath('/'))
}

const handlePostUpdated = (updated: PostDto) => {
  postData.value = { ...(postData.value as PostDto), ...updated }
}

const handleReplyUpdated = (updated: PostDto) => {
  const index = replies.value.findIndex((item) => item.id === updated.id)
  if (index === -1) return
  replies.value[index] = { ...replies.value[index], ...updated }
}

const focusReply = () => {
  replyInput.value?.focus()
}

if (import.meta.client) {
  onMounted(() => window.addEventListener('timeline:focus-reply', focusReply))
  onUnmounted(() => window.removeEventListener('timeline:focus-reply', focusReply))
}

definePageMeta({
  key: (route: any) => `post-${route.params?.id ?? ''}`,
})

const siteName = '校园墙'
const runtimeConfig = useRuntimeConfig()

const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (import.meta.client && typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '')
  return ''
})

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const pathValue = route.fullPath || `/posts/${postId.value}`
  return base ? `${base}${pathValue.startsWith('/') ? pathValue : `/${pathValue}`}` : pathValue
})

const seoTitle = computed(() => {
  if (!post.value) return `帖子 - ${siteName}`
  const head = post.value.card_type === 'social'
    ? `${post.value.author_display_name || post.value.author_name} 的动态`
    : `${post.value.author_display_name || post.value.author_name} 向 ${post.value.target_name} 的表白`
  return `${head} - ${siteName}`
})

const seoDescription = computed(() => {
  if (!post.value?.content) return '查看帖子详情与回复线程。'
  const text = post.value.content.replace(/\s+/g, ' ').trim()
  return text.length > 160 ? `${text.slice(0, 157)}...` : text
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>
