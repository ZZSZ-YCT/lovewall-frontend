<template>
  <div class="page-shell overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
    <div v-if="loading" class="px-4 py-16 text-center sm:px-5">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else-if="errorMessage" class="px-4 py-16 text-center sm:px-5">
      <p class="text-sm text-zinc-500">{{ errorMessage }}</p>
    </div>

    <template v-else-if="user">
      <section class="relative">
        <div
          class="h-40 bg-[linear-gradient(135deg,_#0f172a_0%,_#0ea5e9_100%)]"
          :style="bannerStyle"
        />
        <div class="px-4 pb-4 sm:px-5">
          <div class="-mt-16 flex items-end justify-between gap-4">
            <div class="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-lg">
              <NuxtImg
                v-if="user.avatar_url"
                :src="assetUrl(user.avatar_url)"
                :alt="displayName"
                class="h-full w-full object-cover"
                width="112"
                height="112"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-700"
              >
                {{ displayName.slice(0, 2).toUpperCase() }}
              </div>
            </div>

            <div class="pb-3">
              <button
                v-if="showFollowButton"
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition"
                :class="isFollowing ? 'border border-zinc-200 bg-white text-zinc-900 hover:border-rose-300 hover:text-rose-600' : 'bg-zinc-950 text-white hover:bg-zinc-800'"
                :disabled="followLoading"
                @click="toggleFollow"
              >
                {{ followLoading ? '处理中…' : isFollowing ? '取消关注' : '关注' }}
              </button>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold text-zinc-950">{{ displayName }}</h1>
              <TagBadge
                v-if="activeTag"
                :title="activeTag.title"
                :background="activeTag.background_color"
                :text="activeTag.text_color"
              />
            </div>
            <p class="mt-1 text-sm text-zinc-500">@{{ user.username }}</p>
            <p v-if="user.bio" class="mt-4 whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-900">
              {{ user.bio }}
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <span>加入于 {{ formatDate(user.created_at) }}</span>
              <span>{{ user.follower_count || 0 }} 关注者</span>
              <span>{{ user.following_count || 0 }} 正在关注</span>
            </div>
          </div>
        </div>
      </section>

      <section class="border-y border-zinc-200">
        <div class="grid grid-cols-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="border-b-2 px-4 py-3 text-sm font-medium transition"
            :class="currentTab === tab.key ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'"
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <section v-if="postsPending && posts.length === 0" class="px-4 py-16 text-center sm:px-5">
        <LoadingSpinner />
      </section>

      <section v-else-if="posts.length === 0" class="px-4 py-16 text-center text-sm text-zinc-500 sm:px-5">
        当前标签页还没有内容。
      </section>

      <section v-else>
        <TimelinePost
          v-for="item in posts"
          :key="item.id"
          :post="item"
        />

        <div
          v-if="postsData && postsData.page * postsData.page_size < postsData.total"
          class="border-t border-zinc-200 px-4 py-6 text-center sm:px-5"
        >
          <button
            type="button"
            class="btn-secondary"
            :disabled="postsPending"
            @click="loadMore"
          >
            {{ postsPending ? '加载中…' : '加载更多' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import TagBadge from '~/components/ui/TagBadge.vue'
import TimelinePost from '~/components/timeline/TimelinePost.vue'
import type { Pagination, PostDto, User } from '~/types'
import type { ActiveTagDto } from '~/types/extra'

type ProfileTab = 'posts' | 'replies' | 'likes'

const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()
const { assetUrl } = useAssetUrl()

const username = computed(() => String(route.params.username || ''))
const currentTab = ref<ProfileTab>((route.query.tab as ProfileTab) || 'posts')

const {
  data: profileData,
  pending,
  error,
} = await useAsyncData(
  () => `user-${username.value}`,
  async () => {
    const status = await api.getUserStatusByUsername(username.value)
    if (!status.exists) {
      throw new Error('用户不存在')
    }
    const [user, activeTag] = await Promise.all([
      api.getUserByUsername(username.value),
      api.getUserActiveTagByUsername(username.value),
    ])
    return { user, activeTag }
  },
  { watch: [username] },
)

const user = computed<User | null>(() => profileData.value?.user ?? null)
const activeTag = computed<ActiveTagDto | null>(() => profileData.value?.activeTag ?? null)
const displayName = computed(() => user.value?.display_name || user.value?.username || '')
const loading = computed(() => pending.value)
const errorMessage = computed(() => error.value?.message || '')

const posts = ref<PostDto[]>([])
const postsData = ref<Pagination<PostDto> | null>(null)
const postsPending = ref(false)

const isFollowing = ref(false)
const followLoading = ref(false)

const tabs = [
  { key: 'posts' as const, label: '帖子' },
  { key: 'replies' as const, label: '回复' },
  { key: 'likes' as const, label: '点赞' },
]

const bannerStyle = computed(() => {
  if (!user.value?.banner_url) return undefined
  return { backgroundImage: `url(${assetUrl(user.value.banner_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
})

const showFollowButton = computed(() => auth.isAuthenticated && !!user.value && user.value.id !== auth.currentUser?.id)

const fetchPosts = async (page = 1, append = false) => {
  if (!user.value) return
  postsPending.value = true
  try {
    const data = await api.getUserPosts(user.value.id, {
      page,
      page_size: 20,
      type: currentTab.value,
    })
    postsData.value = data
    posts.value = append ? [...posts.value, ...data.items] : [...data.items]
  } finally {
    postsPending.value = false
  }
}

const loadMore = async () => {
  if (!postsData.value) return
  await fetchPosts(postsData.value.page + 1, true)
}

const selectTab = async (tab: ProfileTab) => {
  currentTab.value = tab
  await router.replace({ query: { ...route.query, tab } })
  await fetchPosts(1, false)
}

const fetchFollowStatus = async () => {
  if (!showFollowButton.value || !user.value) return
  try {
    const status = await api.getFollowStatus(user.value.id)
    isFollowing.value = !!status.following
  } catch (error) {
    console.warn('Fetch follow status failed:', error)
  }
}

const toggleFollow = async () => {
  if (!user.value) return
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await api.unfollowUser(user.value.id)
      isFollowing.value = false
      user.value.follower_count = Math.max(0, (user.value.follower_count || 0) - 1)
    } else {
      await api.followUser(user.value.id)
      isFollowing.value = true
      user.value.follower_count = (user.value.follower_count || 0) + 1
    }
  } catch (error: any) {
    toast.error(error?.message || '关注操作失败')
  } finally {
    followLoading.value = false
  }
}

watch([user, currentTab], async ([currentUser]) => {
  if (!currentUser) return
  await fetchPosts(1, false)
  await fetchFollowStatus()
}, { immediate: true })

watch(() => route.query.tab, (value) => {
  const tab = value as ProfileTab | undefined
  if (tab && ['posts', 'replies', 'likes'].includes(tab)) {
    currentTab.value = tab
  }
})

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-CN')

definePageMeta({
  key: (route: any) => `user-${route.params?.username ?? ''}`,
})

const runtimeConfig = useRuntimeConfig()
const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (import.meta.client && typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '')
  return ''
})

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const pathValue = route.fullPath || `/users/${username.value}`
  return base ? `${base}${pathValue.startsWith('/') ? pathValue : `/${pathValue}`}` : pathValue
})

const seoTitle = computed(() => user.value ? `${displayName.value} (@${user.value.username})` : '用户主页')
const seoDescription = computed(() => user.value?.bio || '查看用户主页、帖子、回复与点赞。')

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
