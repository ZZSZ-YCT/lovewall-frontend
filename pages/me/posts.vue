<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('user.myPosts') }}</h1>
      <p class="text-gray-600 mt-2">{{ t('user.posts.description') }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-brand-600 mb-1">{{ postsData?.total || 0 }}</div>
        <div class="text-sm text-gray-600">{{ t('user.posts.totalPosts') }}</div>
      </GlassCard>
      
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{{ featuredCount }}</div>
        <div class="text-sm text-gray-600">{{ t('user.posts.totalFeatured') }}</div>
      </GlassCard>
      
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">{{ pinnedCount }}</div>
        <div class="text-sm text-gray-600">{{ t('user.posts.totalPinned') }}</div>
      </GlassCard>
    </div>

    <!-- Controls -->
    <GlassCard class="p-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex gap-3">
          <NuxtLink :to="localePath('/posts/new')" class="btn-primary">
            <PlusIcon class="w-4 h-4 mr-2" />
            {{ t('posts.publish.index') }}
          </NuxtLink>
        </div>

        <!-- Filters -->
        <div class="flex gap-2">
          <select
            v-model="filters.status"
            class="input px-3 py-2 text-sm"
            @change="applyFilters"
          >
            <option value="">{{ t('user.posts.allState') }}</option>
            <option value="0">{{ t('user.posts.published') }}</option>
            <option value="1">{{ t('user.posts.hidden') }}</option>
          </select>
          
          <select
            v-model="filters.featured"
            class="input px-3 py-2 text-sm"
            @change="applyFilters"
          >
            <option value="">{{ t('user.posts.allState') }}</option>
            <option value="true">{{ t('common.feature') }}</option>
            <option value="false">{{ t('user.posts.common') }}</option>
          </select>
        </div>
      </div>
    </GlassCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!posts.length" class="text-center py-12">
      <GlassCard class="p-12">
        <div class="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HeartIcon class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ t('user.posts.noPosts') }}</h3>
        <!-- 移除底部发布按钮，保留顶部入口 -->
      </GlassCard>
    </div>

    <!-- Posts List -->
    <div v-else class="space-y-4">
      <div
        v-for="post in sortedPosts"
        :key="post.id"
        class="group relative"
      >
        <GlassCard class="p-6 hover:shadow-md transition-all cursor-pointer" @click="handleCardClick(post)">
          <div class="flex gap-4">
            <!-- Image -->
            <div class="w-24 flex-shrink-0">
              <NuxtPicture
                v-if="post.images?.length"
                :src="assetUrl(post.images[0])"
                :alt="t('posts.confessionTo', { author: post.author_name, target: post.target_name})"
                class="w-24 h-24 object-cover rounded-lg"
                :modifiers="{ fit: 'cover', quality: 60 }"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 32px"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-gray-800">
                    {{ post.author_name }} → {{ post.target_name }}
                  </h3>
                  
                  <!-- Badges -->
                  <div class="flex gap-1">
                    <span
                      v-if="post.status === 0 && post.is_featured"
                      class="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {{ t('common.feature') }}
                    </span>
                    <span
                      v-if="post.status === 0 && post.is_pinned"
                      class="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full"
                    >
                      {{ t('common.pin') }}
                    </span>
                    <span
                      v-if="post.status === 1"
                      class="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full"
                    >
                      {{ t('user.posts.hidden') }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <GlassButton
                    variant="secondary"
                    class="!p-2 !text-red-600 hover:!bg-red-50"
                    :title="t('common.delete')"
                    @click.stop="confirmDelete(post)"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>

              <p class="text-gray-700 leading-relaxed line-clamp-3 mb-3">{{ post.content }}</p>
              
              <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <CalendarIcon class="w-4 h-4" />
                    {{ formatDate(post.created_at) }}
                  </span>
                  
                  <span v-if="post.updated_at && post.updated_at !== post.created_at" class="flex items-center gap-1">
                    <ClockIcon class="w-4 h-4" />
                    {{ t('common.edited') }}
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <MessageSquareIcon class="w-4 h-4" />
                    {{ post.comment_count ?? '—' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <EyeIcon class="w-4 h-4" />
                    {{ post.view_count ?? '—' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <!-- Load More -->
      <div
        v-if="postsData && postsData.page * postsData.page_size < postsData.total"
        class="text-center pt-6"
      >
        <GlassButton
          :loading="loadingMore"
          variant="secondary"
          @click="loadMore"
        >
          {{ t('common.loadMore') }}
        </GlassButton>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 "
    >
      <GlassCard class="p-6 max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">{{ t('user.posts.confirmDeletion') }}</h3>
        <p class="text-gray-600 mb-6">
          确定要删除表白"{{ deleteModal.post?.author_name }} → {{ deleteModal.post?.target_name }}"吗？
          删除后无法恢复。
        </p>
        <div class="flex gap-3 justify-end">
          <GlassButton
            variant="secondary"
            @click="deleteModal.show = false"
          >
            取消
          </GlassButton>
          <GlassButton
            :loading="deleting"
            class="!bg-red-600 hover:!bg-red-700"
            @click="deletePost"
          >
            确认删除
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import {
  PlusIcon,
  HeartIcon,
  EyeIcon,
  Trash2Icon,
  CalendarIcon,
  ClockIcon,
  MessageSquareIcon
} from 'lucide-vue-next'
import type { PostDto, Pagination } from '~/types'
import GlassButton from "~/components/ui/GlassButton.vue";
import GlassCard from "~/components/ui/GlassCard.vue";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: { k: 'user.myPostsTitle' }
})

// Stores
const auth = useAuthStore()
const toast = useToast()
const router = useRouter()
const { assetUrl } = useAssetUrl()

// State
const posts = ref<PostDto[]>([])
const postsData = ref<Pagination<PostDto> | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)

const filters = reactive({
  status: '',
  featured: ''
})

const deleteModal = reactive({
  show: false,
  post: null as PostDto | null
})

// Computed
const featuredCount = computed(() => {
  return posts.value.filter(post => post.is_featured).length
})

const pinnedCount = computed(() => {
  return posts.value.filter(post => post.is_pinned).length
})

// Methods
const loadPosts = async (page = 1, reset = false) => {
  if (page === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const api = useNuxtApp().$api
    // Note: We need a "my posts" endpoint. For now, we'll simulate it
    // In real implementation, there should be an endpoint like `/my/posts`
    const params: any = {
      page,
      page_size: 20
    }
    
    if (filters.status) {
      params.status = parseInt(filters.status)
    }
    
    if (filters.featured) {
      params.featured = filters.featured === 'true'
    }

    // Fetch my posts via backend endpoint
    const data = await api.getUserPosts(auth.currentUser!.id, params)
    if (reset || page === 1) {
      posts.value = data.items
    } else {
      posts.value.push(...data.items)
    }
    postsData.value = data
  } catch (error: any) {
    toast.error(t('error.messages.unknown'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (postsData.value) {
    loadPosts(postsData.value.page + 1)
  }
}

const applyFilters = () => {
  loadPosts(1, true)
}

const refresh = () => {
  loadPosts(1, true)
}

// Counts are returned inline per item; no extra stats fetch

const goDetail = (post: PostDto) => {
  router.push(localePath(`/posts/${post.id}`))
}

const handleCardClick = (post: PostDto) => {
  if (post.status !== 0) return
  goDetail(post)
}
const confirmDelete = (post: PostDto) => {
  deleteModal.post = post
  deleteModal.show = true
}

const deletePost = async () => {
  if (!deleteModal.post) return
  
  deleting.value = true
  try {
    const api = useNuxtApp().$api
    await api.deletePost(deleteModal.post.id)
    
    // Remove from local list
    posts.value = posts.value.filter(p => p.id !== deleteModal.post!.id)
    if (postsData.value) {
      postsData.value.total -= 1
    }
    
    toast.success(t('common.success'))
    deleteModal.show = false
    deleteModal.post = null
  } catch (error) {
    toast.error(t('error.messages.unknown'))
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 全局排序优先级: 置顶+精华 > 置顶 > 精华 > 普通 > 隐藏(> 已删除)
const sortedPosts = computed(() =>
  posts.value.slice().sort((a, b) => {
    const score = (p: PostDto) => {
      if ((p as any).status === 2) return 5
      if ((p as any).status === 1) return 4
      if (p.is_pinned && p.is_featured) return 0
      if (p.is_pinned) return 1
      if (p.is_featured) return 2
      return 3
    }
    const sa = score(a)
    const sb = score(b)
    if (sa !== sb) return sa - sb
    const at = new Date(a.created_at).getTime()
    const bt = new Date(b.created_at).getTime()
    return bt - at
  })
)

// Initialize
onMounted(() => {
  loadPosts()
})

</script>

