<template>
  <div class="page-shell overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
    <section class="border-b border-zinc-200 px-4 py-4 sm:px-5">
      <h1 class="text-xl font-semibold text-zinc-950">我的回复</h1>
      <p class="mt-1 text-sm text-zinc-500">这里展示你作为回复发布的帖子。</p>
    </section>

    <section v-if="loading" class="px-4 py-16 text-center sm:px-5">
      <LoadingSpinner size="lg" />
    </section>

    <section v-else-if="replies.length === 0" class="px-4 py-16 text-center text-sm text-zinc-500 sm:px-5">
      你还没有发布过回复。
    </section>

    <section v-else>
      <TimelinePost
        v-for="reply in replies"
        :key="reply.id"
        :post="reply"
      />

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
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { Pagination, PostDto } from '~/types'

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: '我的回复',
})

const auth = useAuthStore()
const api = useNuxtApp().$api

const replies = ref<PostDto[]>([])
const pagination = ref<Pagination<PostDto> | null>(null)
const loading = ref(true)
const loadingMore = ref(false)

const fetchReplies = async (page = 1, append = false) => {
  if (!auth.currentUser?.id) return
  if (page === 1) loading.value = true
  else loadingMore.value = true

  try {
    const data = await api.getUserPosts(auth.currentUser.id, {
      page,
      page_size: 20,
      type: 'replies',
    })
    pagination.value = data
    replies.value = append ? [...replies.value, ...data.items] : [...data.items]
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (!pagination.value) return
  await fetchReplies(pagination.value.page + 1, true)
}

onMounted(() => {
  fetchReplies()
})
</script>
