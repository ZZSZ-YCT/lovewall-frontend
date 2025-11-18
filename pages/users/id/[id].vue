<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <GlassCard class="p-8">
        <h2 class="text-2xl font-bold text-red-600 mb-4">用户不存在</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <GlassButton variant="secondary" @click="$router.back()">
          返回上页
        </GlassButton>
      </GlassCard>
    </div>

    <!-- User Profile -->
    <div v-else-if="user" class="space-y-6">
      <!-- User Info Card -->
      <GlassCard class="p-8">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div class="relative w-32 h-32">
              <template v-if="user.is_admin">
                <div
                  class="absolute -inset-[5px] rounded-full border-[4px] border-sky-400/95 pointer-events-none"
                />
                <div
                  class="absolute -inset-[10px] rounded-full bg-sky-300/40 blur-3xl pointer-events-none"
                />
              </template>

              <!-- 头像容器 -->
              <div
                class="relative z-10 w-full h-full rounded-full overflow-hidden shadow-lg"
                :class="user.is_admin ? 'border-0' : 'border-2 border-white/20'"
              >
                <NuxtImg
                  v-if="user.avatar_url"
                  :src="assetUrl(user.avatar_url)"
                  :alt="userDisplayName"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-4xl font-bold"
                >
                  {{ userDisplayName.slice(0, 2) }}
                </div>
              </div>

              <!-- 在线状态指示器：总是显示，在线绿色/离线灰色，部分盖住头像右下角 -->
              <div
                class="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)] z-20"
                :class="userIsOnline ? 'bg-emerald-400' : 'bg-gray-400'"
                :title="userIsOnline ? (formatOnlineStatus(onlineStatusData?.last_heartbeat)) : '离线'"
              />
            </div>
          </div>

          <!-- User Details -->
          <div class="flex-1 text-center md:text-left">
            <div class="mb-4">
              <div class="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 class="text-3xl font-bold text-gray-800">{{ userDisplayName }}</h1>
                <span
                  v-if="isDeleted"
                  class="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full"
                >
                  已注销不可访问
                </span>
                <TagBadge
                  v-if="activeTag"
                  :title="activeTag.title"
                  :background="activeTag.background_color"
                  :text="activeTag.text_color"
                />
                <span
                  v-if="activeTag?.user_deleted"
                  class="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full"
                >
                  标签所属用户已注销
                </span>
              </div>
              <p class="text-gray-600">@{{ user.username }}</p>
            </div>
            
            <!-- Bio -->
            <div v-if="user.bio" class="mb-4">
              <p class="text-gray-700 leading-relaxed">{{ user.bio }}</p>
            </div>
            
            <!-- Stats -->
            <div class="flex justify-center md:justify-start gap-6 text-sm text-gray-600">
              <span>加入于 {{ formatDate(user.created_at) }}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <!-- User Posts Section -->
      <GlassCard class="p-6">
        <div class="border-b border-white/20 pb-4 mb-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ userDisplayName }} 的表白
          </h2>
        </div>

        <!-- Posts Loading -->
        <div v-if="postsLoading" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>

        <!-- No Posts -->
        <div v-else-if="!userPosts.length" class="text-center py-12 text-gray-500">
          <div class="mb-4">
            <HeartIcon class="w-16 h-16 mx-auto text-gray-300" />
          </div>
          <p>{{ userDisplayName }} 还没有发表过表白</p>
        </div>

        <!-- Posts List -->
        <div v-else class="space-y-4">
          <div
            v-for="post in userPosts"
            :key="post.id"
            class="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
            @click="navigateTo(`/posts/${post.id}`)"
          >
            <div class="flex gap-4">
              <!-- Post Image Thumbnail -->
              <div v-if="post.images?.length" class="flex-shrink-0">
                <NuxtPicture
                  :src="assetUrl(post.images[0])"
                  :alt="post.card_type !== 'communication' && post.card_type !== 'social' && post.target_name ? `${post.author_name}对${post.target_name}的表白` : `${post.author_name}的交流`"
                  class="w-20 h-20 object-cover rounded-lg"
                  :modifiers="{ fit: 'cover', quality: 60 }"
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 32px"
                />
              </div>
              
              <!-- Post Content -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-semibold text-gray-800">
                    <template v-if="post.card_type !== 'communication' && post.card_type !== 'social' && post.target_name">
                      {{ post.author_name }} → {{ post.target_name }}
                    </template>
                    <template v-else>
                      {{ post.author_name }} 的交流
                    </template>
                  </h3>
                  <TagBadge
                    v-if="post.author_tag"
                    :title="post.author_tag.title"
                    :background="post.author_tag.background_color"
                    :text="post.author_tag.text_color"
                  />
                  <div class="flex gap-1 ml-auto">
                    <span
                      v-if="post.is_featured"
                      class="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full"
                    >
                      精选
                    </span>
                    <span
                      v-if="post.is_pinned"
                      class="px-2 py-1 text-xs bg-sky-100 text-sky-800 rounded-full"
                    >
                      置顶
                    </span>
                  </div>
                </div>
                
                <p class="text-gray-600 text-sm line-clamp-2 mb-2">{{ post.content }}</p>
                
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  <span>{{ formatDate(post.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More Posts -->
          <div v-if="postsData && postsData.page * postsData.page_size < postsData.total" class="text-center pt-4">
            <GlassButton
              :loading="postsLoading"
              variant="secondary"
              @click="loadMorePosts"
            >
              加载更多表白
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlassCard from '~/components/ui/GlassCard.vue'
import GlassButton from '~/components/ui/GlassButton.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import TagBadge from '~/components/ui/TagBadge.vue'
import { HeartIcon } from 'lucide-vue-next'
import type { User, PostDto, Pagination } from '~/types'
import type { ActiveTagDto } from '~/types/extra'

const { t } = useI18n()

// Get route params
const route = useRoute()
const userId = computed(() => route.params.id as string)

// State
const { data: userData, error: userError, pending } = await useAsyncData(
  `user-${userId.value}`,
  () => useNuxtApp().$api.getUser(userId.value)
)

const user = computed(() => userData.value)
const loading = computed(() => pending.value)
const error = computed(() => userError.value ? '用户不存在或已注销' : null)

const {
  data: userPostsData,
  pending: postsPending,
  refresh: refreshPosts
} = await useAsyncData(
  () => `user-posts-${userId.value}`,
  () => {
    if (!user.value) {
      return Promise.resolve<Pagination<PostDto>>({
        total: 0,
        items: [],
        page: 1,
        page_size: 10
      })
    }
    return useNuxtApp().$api.getUserPosts(user.value.id, { page: 1, page_size: 10 })
  },
  { watch: [user] } // 👈 当 user 加载成功时自动加载帖子
)

const activeTag = ref<ActiveTagDto | null>(null)
const userStatus = ref<{ exists: boolean; is_deleted: boolean; is_banned: boolean; ban_reason?: string | null } | null>(null)

// 获取用户在线状态
const { data: onlineStatusData } = await useAsyncData(
  `user-online-${userId.value}`,
  () => useNuxtApp().$api.getUserOnlineStatus(userId.value),
  { watch: [userId] }
)

const userIsOnline = computed(() => onlineStatusData.value?.online ?? false)

const userPosts = computed(() => userPostsData.value?.items ?? [])
const postsLoading = computed(() => postsPending.value)

const postsData = ref<Pagination<PostDto> | null>(null)

// Composable
const { assetUrl } = useAssetUrl()
const toast = useToast()

// Computed
const userDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.display_name || user.value.username
})

const isDeleted = computed(() => {
  return !!(userStatus.value?.is_deleted)
})

const loadMorePosts = async () => {
  if (postsData.value && user.value) {
    const nextPage = postsData.value.page + 1
    const data = await useNuxtApp().$api.getUserPosts(user.value.id, { page: nextPage, page_size: 10 })
    postsData.value.items.push(...data.items)
    postsData.value.page = nextPage
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化在线状态：在线显示"在线"，离线显示最后心跳时间（GMT+8）
const formatOnlineStatus = (lastHeartbeat?: string | null) => {
  if (!lastHeartbeat) return '在线'

  try {
    const date = new Date(lastHeartbeat)
    // 格式化为 GMT+8 可读时间：2025-01-12 14:30:25
    return `离线 · 最后在线: ${date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })}`
  } catch {
    return '在线'
  }
}

definePageMeta({
  key: (route: any) => `user-id-${(route as any).params?.id ?? ''}`
})

// SEO
const siteName = t('seo.title')
const defaultProfileDescription = t('seo.description')
const runtimeConfig = useRuntimeConfig()

const normalizedSiteOrigin = computed(() => {
  const configured = (runtimeConfig.public?.siteUrl as string | undefined)?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  if (import.meta.client && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '')
  }
  return ''
})

const defaultOgImage = computed(() => {
  const base = normalizedSiteOrigin.value
  if (!base) {
    return '/badge.png'
  }
  return `${base}/badge.png`
})

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const pathValue = route.fullPath || `/users/id/${userId.value}`
  const normalizedPath = pathValue.startsWith('/') ? pathValue : `/${pathValue}`
  if (!base) {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
})

const sanitizeContent = (value?: string | null) => {
  if (!value) {
    return defaultProfileDescription
  }
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) {
    return defaultProfileDescription
  }
  return text.length > 160 ? `${text.slice(0, 157)}...` : text
}

const profileDescription = computed(() => {
  if (!user.value) {
    return defaultProfileDescription
  }
  if (user.value.bio) {
    return sanitizeContent(user.value.bio)
  }
  return t('user.description', { nickname: userDisplayName.value, siteName: siteName })
})

const profileOgImage = computed(() => {
  if (!user.value?.avatar_url) {
    return defaultOgImage.value
  }
  const resolved = assetUrl(user.value.avatar_url)
  if (resolved) {
    if (/^(https?:)?\/\//i.test(resolved)) {
      return resolved.startsWith('//') ? `https:${resolved}` : resolved
    }
    if (normalizedSiteOrigin.value) {
      const normalizedPath = resolved.startsWith('/') ? resolved : `/${resolved}`
      return `${normalizedSiteOrigin.value}${normalizedPath}`
    }
    return resolved
  }
  return defaultOgImage.value
})

const toIsoString = (value?: string | null) => {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

const profileTitle = computed(() => {
  if (!user.value) {
    return `${t('user.center')} - ${siteName}`
  }
  const uname = user.value.username ? `(@${user.value.username})` : ''
  return `${userDisplayName.value} ${uname} - ${siteName}`.trim()
})

const profileStructuredData = computed(() => {
  if (!user.value) {
    return null
  }
  const canonical = canonicalUrl.value
  const image = profileOgImage.value
  const mainEntity: Record<string, any> = {
    '@type': 'Person',
    name: userDisplayName.value,
    alternateName: user.value.username || undefined,
    identifier: user.value.id,
    description: user.value.bio ? sanitizeContent(user.value.bio) : undefined,
  }
  if (image) {
    mainEntity.image = image
  }
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonical,
    name: profileTitle.value,
    description: profileDescription.value,
    dateCreated: toIsoString(user.value.created_at),
    inLanguage: 'zh-CN',
    mainEntity,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: normalizedSiteOrigin.value || undefined,
    },
  }
  if (!mainEntity.description) {
    delete mainEntity.description
  }
  if (!mainEntity.alternateName) {
    delete mainEntity.alternateName
  }
  if (!image) {
    delete mainEntity.image
  }
  if (!data.publisher.url) {
    delete data.publisher.url
  }
  return data
})

useSeoMeta({
  // 标题与描述
  title: computed(() => profileTitle.value),
  description: computed(() => profileDescription.value),

  // --- Open Graph ---
  ogTitle: computed(() => profileTitle.value),
  ogDescription: computed(() => profileDescription.value),
  ogType: 'profile',
  ogUrl: computed(() => canonicalUrl.value),
  ogImage: computed(() => profileOgImage.value),
  ogSiteName: siteName,

  // --- Twitter ---
  twitterCard: computed(() =>
    user.value?.avatar_url ? 'summary_large_image' : 'summary'
  ),
  twitterTitle: computed(() => profileTitle.value),
  twitterDescription: computed(() => profileDescription.value),
  twitterImage: computed(() => profileOgImage.value),

  // --- Profile-specific OG fields ---
  profileUsername: computed(() => user.value?.username || ''),
  profileFirstName: computed(() => userDisplayName.value),
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => canonicalUrl.value)
    }
  ],
  script: computed(() => {
    if (!profileStructuredData.value) return []
    return [
      {
        type: 'application/ld+json',
        key: 'ld-profile-page-id',
        children: JSON.stringify(profileStructuredData.value),
      },
    ]
  }),
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

