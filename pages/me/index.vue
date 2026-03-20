<template>
  <div class="page-shell space-y-5">
    <section class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
      <div class="flex items-start gap-4">
        <div class="h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          <NuxtImg
            v-if="auth.currentUser?.avatar_url"
            :src="assetUrl(auth.currentUser.avatar_url)"
            :alt="auth.userDisplayName"
            class="h-full w-full object-cover"
            width="64"
            height="64"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-700"
          >
            {{ auth.userDisplayName.slice(0, 2).toUpperCase() }}
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-semibold text-zinc-950">{{ auth.userDisplayName }}</h1>
          <p class="mt-1 text-sm text-zinc-500">@{{ auth.currentUser?.username }}</p>
          <p v-if="auth.currentUser?.bio" class="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800">
            {{ auth.currentUser.bio }}
          </p>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl bg-zinc-50 px-4 py-3">
          <div class="text-xl font-semibold text-zinc-950">{{ stats.posts }}</div>
          <div class="mt-1 text-xs text-zinc-500">帖子</div>
        </div>
        <div class="rounded-2xl bg-zinc-50 px-4 py-3">
          <div class="text-xl font-semibold text-zinc-950">{{ stats.replies }}</div>
          <div class="mt-1 text-xs text-zinc-500">回复</div>
        </div>
        <div class="rounded-2xl bg-zinc-50 px-4 py-3">
          <div class="text-xl font-semibold text-zinc-950">{{ stats.likes }}</div>
          <div class="mt-1 text-xs text-zinc-500">点赞</div>
        </div>
        <div class="rounded-2xl bg-zinc-50 px-4 py-3">
          <div class="text-xl font-semibold text-zinc-950">{{ stats.tags }}</div>
          <div class="mt-1 text-xs text-zinc-500">标签</div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-3">
      <NuxtLink
        v-for="item in quickLinks"
        :key="item.to"
        :to="item.to"
        class="rounded-3xl border border-zinc-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300"
      >
        <div class="text-sm font-semibold text-zinc-950">{{ item.title }}</div>
        <div class="mt-1 text-xs leading-5 text-zinc-500">{{ item.description }}</div>
      </NuxtLink>
    </section>

    <section class="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div class="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-950">
        最近帖子
      </div>
      <div v-if="recentPosts.length === 0" class="px-4 py-8 text-center text-sm text-zinc-500">
        暂无内容
      </div>
      <TimelinePost
        v-for="post in recentPosts"
        :key="post.id"
        :post="post"
      />
    </section>

    <section class="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div class="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-950">
        最近回复
      </div>
      <div v-if="recentReplies.length === 0" class="px-4 py-8 text-center text-sm text-zinc-500">
        暂无内容
      </div>
      <TimelinePost
        v-for="reply in recentReplies"
        :key="reply.id"
        :post="reply"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import TimelinePost from '~/components/timeline/TimelinePost.vue'

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: '我的',
})

const localePath = useLocalePath()
const auth = useAuthStore()
const api = useNuxtApp().$api
const { assetUrl } = useAssetUrl()

const recentPosts = ref([])
const recentReplies = ref([])
const stats = reactive({
  posts: 0,
  replies: 0,
  likes: 0,
  tags: 0,
})

const quickLinks = computed(() => [
  { to: localePath('/posts/new'), title: '发布新帖', description: '发表表白或动态内容' },
  { to: localePath('/me/comments'), title: '我的回复', description: '查看你发布过的所有回复' },
  { to: localePath('/me/tags'), title: '我的标签', description: '管理已拥有和启用的标签' },
  { to: localePath(`/users/${auth.currentUser?.username || ''}`), title: '公开主页', description: '查看你的外部展示页' },
])

const loadDashboard = async () => {
  if (!auth.currentUser?.id) return
  const [postsData, repliesData, likesData, tagsData] = await Promise.all([
    api.getUserPosts(auth.currentUser.id, { page: 1, page_size: 3, type: 'posts' }),
    api.getUserPosts(auth.currentUser.id, { page: 1, page_size: 3, type: 'replies' }),
    api.getUserPosts(auth.currentUser.id, { page: 1, page_size: 1, type: 'likes' }),
    api.getMyTags(),
  ])

  recentPosts.value = postsData.items
  recentReplies.value = repliesData.items
  stats.posts = postsData.total
  stats.replies = repliesData.total
  stats.likes = likesData.total
  stats.tags = tagsData.total
}

onMounted(() => {
  loadDashboard().catch((error) => console.error('Load dashboard failed:', error))
})
</script>
