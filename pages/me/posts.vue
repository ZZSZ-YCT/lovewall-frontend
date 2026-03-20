<template>
  <div class="page-shell overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
    <section class="border-b border-zinc-200 px-4 py-4 sm:px-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-zinc-950">我的帖子</h1>
          <p class="mt-1 text-sm text-zinc-500">这里展示你发布的公开帖子和引用内容，不包含回复。</p>
        </div>

        <NuxtLink
          :to="localePath('/posts/new')"
          class="btn-primary inline-flex items-center justify-center"
        >
          发新帖
        </NuxtLink>
      </div>

      <div class="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span class="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1">
          总数 {{ pagination?.total ?? posts.length }}
        </span>
        <span class="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1">
          已加载 {{ posts.length }}
        </span>
      </div>
    </section>

    <section v-if="loading" class="px-4 py-16 text-center sm:px-5">
      <LoadingSpinner size="lg" />
    </section>

    <section v-else-if="posts.length === 0" class="px-4 py-16 text-center text-sm text-zinc-500 sm:px-5">
      你还没有发布过公开帖子。
    </section>

    <section v-else>
      <div
        v-for="post in posts"
        :key="post.id"
        class="bg-white"
      >
        <TimelinePost
          :post="post"
          @updated="replacePost"
        />

        <div class="flex items-center justify-end gap-2 px-4 pb-4 sm:px-5">
          <button
            type="button"
            class="btn-secondary text-sm"
            @click="openPost(post.id)"
          >
            查看详情
          </button>
          <button
            type="button"
            class="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            @click="confirmDelete(post)"
          >
            删除
          </button>
        </div>
      </div>

      <div
        v-if="pagination && pagination.page * pagination.page_size < pagination.total"
        class="border-t border-zinc-200 px-4 py-6 text-center sm:px-5"
      >
        <button
          type="button"
          class="btn-secondary"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </section>

    <div
      v-if="deleteModal.post"
      class="fixed inset-0 z-[1200] flex items-center justify-center bg-zinc-950/50 px-4"
    >
      <div class="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <h2 class="text-lg font-semibold text-zinc-950">删除帖子</h2>
        <p class="mt-3 text-sm leading-6 text-zinc-600">
          删除后内容、图片与互动记录都会从当前列表中移除，且无法恢复。
        </p>
        <div class="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            class="btn-secondary"
            @click="deleteModal.post = null"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            :disabled="deleting"
            @click="deletePost"
          >
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { Pagination, PostDto } from '~/types'

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: '我的帖子',
})

const localePath = useLocalePath()
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()

const posts = ref<PostDto[]>([])
const pagination = ref<Pagination<PostDto> | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)
const deleteModal = reactive<{ post: PostDto | null }>({
  post: null,
})

const fetchPosts = async (page = 1, append = false) => {
  if (!auth.currentUser?.id) return
  if (page === 1) loading.value = true
  else loadingMore.value = true

  try {
    const data = await api.getUserPosts(auth.currentUser.id, {
      page,
      page_size: 20,
      type: 'posts',
    })
    pagination.value = data
    posts.value = append ? [...posts.value, ...data.items] : [...data.items]
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (!pagination.value) return
  await fetchPosts(pagination.value.page + 1, true)
}

const openPost = async (postId: string) => {
  await navigateTo(localePath(`/posts/${postId}`))
}

const replacePost = (updated: PostDto) => {
  const index = posts.value.findIndex((item) => item.id === updated.id)
  if (index === -1) return
  posts.value[index] = { ...updated }
}

const confirmDelete = (post: PostDto) => {
  deleteModal.post = post
}

const deletePost = async () => {
  if (!deleteModal.post) return
  deleting.value = true
  try {
    await api.deletePost(deleteModal.post.id)
    posts.value = posts.value.filter((item) => item.id !== deleteModal.post?.id)
    if (pagination.value) {
      pagination.value.total = Math.max(0, pagination.value.total - 1)
    }
    deleteModal.post = null
    toast.success('帖子已删除')
  } catch (error: any) {
    toast.error(error?.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>
