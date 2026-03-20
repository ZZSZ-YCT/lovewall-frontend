<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-zinc-950">回复管理</h1>
      <p class="mt-1 text-sm text-zinc-500">这里管理所有以回复形式发布的帖子。</p>
    </div>

    <div class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row">
          <select v-model="filters.status" class="input" @change="loadReplies()">
            <option value="">全部状态</option>
            <option value="0">正常</option>
            <option value="1">已隐藏</option>
          </select>
          <input
            v-model="filters.author_id"
            class="input"
            placeholder="作者 ID"
            @keyup.enter="loadReplies()"
          />
        </div>
        <button type="button" class="btn-secondary" @click="loadReplies()">刷新</button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="text-2xl font-semibold text-zinc-950">{{ replyStats.total }}</div>
        <div class="mt-1 text-sm text-zinc-500">回复总数</div>
      </div>
      <div class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="text-2xl font-semibold text-zinc-950">{{ replyStats.visible }}</div>
        <div class="mt-1 text-sm text-zinc-500">当前页正常</div>
      </div>
      <div class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="text-2xl font-semibold text-zinc-950">{{ replyStats.hidden }}</div>
        <div class="mt-1 text-sm text-zinc-500">当前页隐藏</div>
      </div>
    </div>

    <div class="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div v-if="loading" class="px-4 py-16 text-center">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="replies.length === 0" class="px-4 py-16 text-center text-sm text-zinc-500">
        暂无符合条件的回复。
      </div>

      <template v-else>
        <div
          v-for="reply in replies"
          :key="reply.id"
          class="border-b border-zinc-200 last:border-b-0"
        >
          <TimelinePost
            :post="reply"
            @updated="handleReplyUpdated"
          />
          <div class="flex flex-wrap gap-2 bg-zinc-50 px-4 py-3 sm:px-5">
            <button type="button" class="btn-secondary" @click="openReply(reply)">查看原帖</button>
            <button type="button" class="btn-secondary" @click="toggleHide(reply)">
              {{ reply.status === 1 ? '恢复显示' : '隐藏' }}
            </button>
            <button type="button" class="btn-danger" @click="deleteReply(reply)">删除</button>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="pagination && pagination.page * pagination.page_size < pagination.total"
      class="text-center"
    >
      <button type="button" class="btn-secondary" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? '加载中…' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { Pagination, PostDto } from '~/types'

definePageMeta({
  middleware: 'admin',
  ssr: false,
  title: '回复管理',
})

const localePath = useLocalePath()
const router = useRouter()
const api = useNuxtApp().$api
const toast = useToast()
const { confirm, prompt } = useAdminDialog()

const replies = ref<PostDto[]>([])
const pagination = ref<Pagination<PostDto> | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const filters = reactive({
  status: '',
  author_id: '',
})

const replyStats = computed(() => ({
  total: pagination.value?.total || 0,
  visible: replies.value.filter((item) => item.status === 0).length,
  hidden: replies.value.filter((item) => item.status === 1).length,
}))

const loadReplies = async (page = 1, append = false) => {
  if (page === 1) loading.value = true
  else loadingMore.value = true

  try {
    const data = await api.moderationPosts({
      page,
      page_size: 20,
      type: 'replies',
      status: filters.status === '' ? undefined : Number(filters.status) as 0 | 1,
      author_id: filters.author_id || undefined,
    })
    pagination.value = data
    replies.value = append ? [...replies.value, ...data.items] : [...data.items]
  } catch (error: any) {
    toast.error(error?.message || '加载回复失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (!pagination.value) return
  await loadReplies(pagination.value.page + 1, true)
}

const promptReason = async (title: string) => {
  const result = await prompt({
    title,
    inputLabel: '原因（可选）',
    placeholder: '填写处理原因',
    confirmText: '确认',
    cancelText: '取消',
  })
  if (result === null) return null
  return result.trim()
}

const toggleHide = async (reply: PostDto) => {
  const reason = await promptReason(reply.status === 1 ? '恢复回复' : '隐藏回复')
  if (reason === null) return
  const result = await api.hidePost(reply.id, reply.status === 0, reason || undefined)
  reply.status = result.status as 0 | 1
}

const deleteReply = async (reply: PostDto) => {
  const ok = await confirm({
    title: '删除回复',
    message: '删除后无法恢复，确认继续吗？',
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  const reason = await promptReason('删除回复')
  if (reason === null) return
  await api.deletePost(reply.id, reason || undefined)
  replies.value = replies.value.filter((item) => item.id !== reply.id)
  if (pagination.value) pagination.value.total -= 1
}

const openReply = async (reply: PostDto) => {
  await router.push(localePath(`/posts/${reply.id}`))
}

const handleReplyUpdated = (updated: PostDto) => {
  const index = replies.value.findIndex((item) => item.id === updated.id)
  if (index === -1) return
  replies.value[index] = { ...replies.value[index], ...updated }
}

onMounted(() => {
  loadReplies()
})
</script>
