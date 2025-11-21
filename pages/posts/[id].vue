<template>
  <div class="w-full">
    <div class="max-w-5xl mx-auto space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="glass-card p-8">
        <h2 class="text-2xl font-bold text-red-600 mb-4">{{ t('error.titles.unknown') }}</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <GlassButton variant="secondary" @click="() => refresh()">
          {{ t('common.refresh') }}
        </GlassButton>
      </div>
    </div>

    <!-- Post Content -->
    <div v-else-if="post" class="space-y-6">
      <!-- Post Card -->
      <GlassCard class="p-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Images or Author Avatar -->
          <div class="lg:w-1/3 space-y-4">
            <ImageGrid
              v-if="post.images?.length"
              :images="post.images"
              :alt-prefix="post.card_type !== 'communication' && post.card_type !== 'social' && post.target_name ? t('posts.confessionTo', { author: post.author_name, target: post.target_name }) : t('posts.socialFrom', { author: post.author_name })"
            />
            <div
              v-if="!post.images?.length"
              class="relative w-24 h-24 mx-auto flex-shrink-0 transition-transform hover:scale-105 cursor-pointer"
              @click="navigateToUser(post)"
            >
              <!-- 管理员光圈效果 -->
              <template v-if="post.is_author_admin">
                <div
                  class="absolute -inset-[4px] rounded-full border-[4px] border-sky-400/95 pointer-events-none"
                />
                <div
                  class="absolute -inset-[10px] rounded-full bg-sky-300/40 blur-3xl pointer-events-none"
                />
              </template>

              <!-- 头像容器 -->
              <NuxtImg
                v-if="authorAvatar"
                :src="authorAvatar"
                :alt="post.author_name"
                class="relative z-10 w-full h-full rounded-full object-cover"
                :class="post.is_author_admin ? 'border-0' : 'border-2 border-white/20'"
                width="96"
                height="96"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <div
                v-else
                class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-lg font-medium"
                :class="post.is_author_admin ? 'border-0' : 'border-2 border-white/20'"
              >
                {{ post.author_name.slice(0, 2) }}
              </div>

              <!-- 在线状态指示器：总是显示，在线绿色/离线灰色，部分盖住头像右下角 -->
              <div
                class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)] z-20"
                :class="post.author_is_online ? 'bg-emerald-400' : 'bg-gray-400'"
                :title="post.author_is_online ? t('user.online') : t('user.offline')"
              />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1">
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <!-- Author avatar (if post has image) -->
                  <div
                    v-if="post.images?.length"
                    class="relative w-8 h-8 flex-shrink-0 transition-transform hover:scale-110 cursor-pointer"
                    @click="navigateToUser(post)"
                  >
                    <!-- 管理员光圈效果 -->
                    <template v-if="post.is_author_admin">
                      <div
                        class="absolute -inset-[3px] rounded-full border-[3px] border-sky-400/95 pointer-events-none"
                      />
                      <div
                        class="absolute -inset-[7px] rounded-full bg-sky-300/40 blur-2xl pointer-events-none"
                      />
                    </template>

                    <!-- 头像容器 -->
                    <NuxtImg
                      v-if="authorAvatar"
                      :src="authorAvatar"
                      :alt="post.author_name"
                      class="relative z-10 w-full h-full rounded-full object-cover"
                      :class="post.is_author_admin ? 'border-0' : 'border border-white/20'"
                      width="32"
                      height="32"
                      loading="lazy"
                      fetchpriority="auto"
                      decoding="async"
                    />
                    <div
                      v-else
                      class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      :class="post.is_author_admin ? 'border-0' : 'border border-white/20'"
                    >
                      {{ post.author_name.slice(0, 2) }}
                    </div>

                    <!-- 在线状态指示器：总是显示，在线绿色/离线灰色，部分盖住头像右下角 -->
                    <div
                      class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)] z-20"
                      :class="post.author_is_online ? 'bg-emerald-400' : 'bg-gray-400'"
                      :title="post.author_is_online ? t('user.online') : t('user.offline')"
                    />
                  </div>

                  <h1 class="text-2xl font-bold text-gray-800">
                    {{ post.author_name }}
                    <template v-if="(post.card_type !== 'communication' && post.card_type !== 'social') && post.target_name">
                      → {{ post.target_name }}
                    </template>
                  </h1>
                  <!-- Author Active Tag：比作者名小一号 -->
                  <span
                    v-if="post.author_tag && renderTag(post.author_tag)?.useCssMode"
                    :class="renderTag(post.author_tag)?.className"
                    class="inline-block text-lg leading-tight px-2 py-0.5 rounded"
                  >
                    {{ renderTag(post.author_tag)?.title }}
                  </span>
                  <span
                    v-else-if="post.author_tag && renderTag(post.author_tag)"
                    class="inline-block text-lg leading-tight px-2 py-0.5 rounded font-medium"
                    :style="renderTag(post.author_tag)?.inlineStyles"
                  >
                    {{ renderTag(post.author_tag)?.title }}
                  </span>
                </div>
              </div>

                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarIcon class="w-4 h-4" />
                  <span>{{ formatDate(post.created_at) }}</span>

                  <!-- Admin badges -->
                  <div class="flex items-center gap-2 ml-auto flex-wrap">
                    <!-- 审核状态 -->
                    <span
                      v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.is_pending_review"
                      class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full"
                      :title="post.audit_msg || t('posts.reviewRequired')"
                    >
                      {{ t('posts.pendingAudit') }}
                    </span>

                    <span
                      v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.manual_review_requested"
                      class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full"
                      :title="t('posts.review')"
                    >
                      {{ t('posts.requestReview') }}
                    </span>

                    <span
                    v-if="post.is_featured"
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {{ t('common.feature') }}
                  </span>
                  <span
                    v-if="post.is_pinned"
                    class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                  >
                    {{ t('common.pin') }}
                  </span>
                  <span
                    v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.status === 1"
                    class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                  >
                    {{ t('common.hide') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Post content -->
            <div class="prose prose-lg max-w-none">
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ post.content }}</p>
            </div>

            <!-- AI审核信息（仅管理员可见） -->
            <div
              v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.is_pending_review && post.audit_msg"
              class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-yellow-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-yellow-800 mb-1">审核意见</p>
                  <p class="text-sm text-yellow-700">{{ post.audit_msg }}</p>
                  <p v-if="post.manual_review_requested" class="text-xs text-orange-600 mt-1">
                    用户已申请人工复核，请管理员审查。
                  </p>
                </div>
              </div>
            </div>

            <ClientOnly>
              <!-- Admin actions -->
              <div v-if="showAdminActions" class="mt-6 pt-4 border-t border-white/20">
                <div class="flex flex-wrap gap-2">
                  <template v-if="post.status === 0">
                    <button
                      v-if="auth.hasPerm('MANAGE_FEATURED')"
                      type="button"
                      class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                      :disabled="actionLoading"
                      @click="togglePin"
                    >
                      {{ post.is_pinned ? t('common.unpin') : t('common.pin') }}
                    </button>

                    <button
                      v-if="auth.hasPerm('MANAGE_FEATURED')"
                      type="button"
                      class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                      :disabled="actionLoading"
                      @click="toggleFeature"
                    >
                      {{ post.is_featured ? t('common.unfeature') : t('common.feature') }}
                    </button>
                  </template>

                  <button
                    v-if="canEditPost"
                    type="button"
                    class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors inline-flex items-center gap-1"
                    @click="openEditPost"
                  >
                    <EditIcon class="w-3 h-3" />
                    <span>{{ t('posts.publish.edit') }}</span>
                  </button>

                  <button
                    v-if="auth.hasPerm('MANAGE_POSTS')"
                    type="button"
                    class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                    :disabled="actionLoading"
                    @click="toggleHide"
                  >
                    {{ post.status === 1 ? t('common.show') : t('common.hide') }}
                  </button>

                  <button
                    v-if="auth.hasPerm('MANAGE_POSTS')"
                    type="button"
                    class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                    :disabled="actionLoading"
                    @click="toggleLock"
                  >
                    {{ lockStatus?.is_locked ? '解锁' : '锁定' }}
                  </button>

                  <button
                    v-if="auth.hasPerm('MANAGE_POSTS')"
                    type="button"
                    class="px-2 py-1 text-xs text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded transition-colors disabled:opacity-50"
                    :disabled="actionLoading"
                    @click="confirmDelete"
                  >
                    {{ t('common.delete') }}
                  </button>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </GlassCard>

      <!-- Comments Section -->
      <GlassCard class="p-6">
        <div class="border-b border-white/20 pb-4 mb-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ t('common.comment') }} ({{ commentsData?.total || 0 }})
          </h2>
        </div>

        <!-- Hidden posts: block entire comments area -->
        <div v-if="post?.status === 1" class="text-center py-12">
          <p class="text-gray-600">隐藏的条目不应当拥有评论，请先取消隐藏</p>
        </div>
        <template v-else>
          <ClientOnly>
            <template #default>
              <!-- Locked post notice (only for non-admin users) -->
              <div v-if="isLockedForCurrentUser" class="mb-6 text-center py-8">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>该帖子已被锁定，暂时无法评论</span>
                </div>
              </div>

              <!-- Comment Form (if authenticated and allowed to comment) -->
              <div v-else-if="auth.isAuthenticated" class="mb-6">
                <form class="space-y-4" @submit.prevent="submitComment">
                  <div class="relative">
                    <GlassTextarea
                      v-model="commentForm.content"
                      :placeholder="t('comment.placeholder')"
                      :rows="5"
                      :error="commentErrors.content"
                      :input-class="'pr-28 min-h-[140px]'"
                      required
                    />
                    <GlassButton
                      type="submit"
                      :loading="commentSubmitting"
                      :disabled="!commentForm.content.trim()"
                      class="absolute right-3 bottom-3 rounded-full h-10 px-5 !bg-pink-500 hover:!bg-pink-600 !text-white !shadow-md !border-pink-400/30"
                    >
                      {{ t('comment.send') }}
                    </GlassButton>
                  </div>
                </form>
              </div>

              <div v-else class="mb-6 text-center py-8">
                <p class="text-gray-600 mb-4">{{ t('comment.loginRequired') }}</p>
                <NuxtLink :to="localePath('/auth/login')" class="glass-button">
                  {{ t('home.login') }}
                </NuxtLink>
              </div>
            </template>

            <template #fallback>
              <div class="mb-6 text-center py-8 opacity-0 select-none">
                {{ t('comment.loginRequired') }}
              </div>
            </template>
          </ClientOnly>

          <ClientOnly>
            <!-- Comments List -->
            <div class="space-y-4">
              <!-- Loading comments -->
              <div v-if="commentsLoading" class="flex justify-center py-4">
                <LoadingSpinner />
              </div>

              <!-- No comments -->
              <div v-else-if="!comments.length" class="text-center py-8 text-gray-500">
                {{ t('comment.noComments') }}
              </div>

              <!-- Comments -->
              <div v-else>
                <div
                  v-for="(comment, index) in comments"
                  :key="comment.id"
                  class="relative"
                >
                  <hr
                    v-if="index > 0 && !comment.is_pinned && comments[index - 1] && comments[index - 1]!.is_pinned"
                    class="my-6 border-white/20"
                  />
                  <div
                    :class="[
                    'rounded-xl border border-white/10',
                    comment.is_pinned ? 'pinned-comment backdrop-blur-xl' : 'p-4 bg-white/10'
                  ]"
                  >
                    <div
                      v-if="comment.is_pinned"
                      class="flex items-center gap-2 mb-3"
                    >
                      <PinIcon class="w-4 h-4 text-brand-600" />
                      <span class="text-sm font-medium text-brand-600">{{ t('common.pin') }}</span>
                    </div>
                    <div class="flex flex-wrap items-start gap-3">
                      <CommentUserInfo
                        class="flex-1 min-w-0"
                        :comment="comment"
                        clickable
                        @avatar-click="navigateToUser(comment)"
                      />
                      <div class="ml-auto flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                        <span>{{ formatDate(comment.created_at) }}</span>
                        <button
                          v-if="auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_POSTS'])"
                          type="button"
                          class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors"
                          @click="toggleCommentPin(comment)"
                        >
                          {{ comment.is_pinned ? '取消置顶' : '置顶' }}
                        </button>
                        <button
                          v-if="canManageComment(comment)"
                          class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors"
                          @click="hideComment(comment)"
                        >
                          {{ comment.status === 0 ? '隐藏' : '恢复' }}
                        </button>
                      </div>
                    </div>
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ comment.content }}</p>
                  </div>
                </div>

                <!-- 无限滚动加载指示器 -->
                <div
                  v-if="commentsData && commentsData.page * commentsData.page_size < commentsData.total"
                  ref="commentsLoadMoreTrigger"
                  class="text-center pt-6 pb-4"
                >
                  <div v-if="commentsLoading" class="flex items-center justify-center gap-2 text-gray-600">
                    <LoadingSpinner size="sm" />
                    <span>{{ t('common.loadMore') }}</span>
                  </div>
                  <div v-else class="text-gray-400 text-sm">
                    {{ t('common.pullDownLoading') }}
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>
        </template>
      </GlassCard>
    </div>

    <!-- Edit Post Modal -->
    <GlassModal
      :is-open="isEditingPost"
      :title="t('posts.publish.edit')"
      max-width="max-w-2xl"
      @close="closeEditPost"
    >
      <form class="space-y-4" @submit.prevent="savePostEdit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.nickname') }}</label>
          <GlassInput v-model="editForm.author_name" autocomplete="nickname" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('posts.publish.targetName') }}</label>
          <GlassInput v-model="editForm.target_name" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.content') }}</label>
          <GlassTextarea
            v-model="editForm.content"
            :rows="6"
            :input-class="'min-h-[200px]'"
            :placeholder="t('posts.contentPlaceholder')"
            required
          />
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <GlassButton
            type="button"
            variant="outline"
            @click="closeEditPost"
          >
            {{ t('common.cancel') }}
          </GlassButton>
          <GlassButton
            type="submit"
            :loading="editSaving"
            :disabled="!editForm.content.trim()"
            class="!bg-pink-500 hover:!bg-pink-600 !text-white !shadow-md !border-pink-400/30"
          >
            {{ t('common.save') }}
          </GlassButton>
        </div>
      </form>
    </GlassModal>

    <!-- AI Rejection Modal -->
    <GlassModal
      :is-open="showAIRejectionModal"
      :title="t('posts.deniedAudit')"
      max-width="max-w-lg"
      @close="showAIRejectionModal = false"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span class="text-red-600 text-sm font-bold">!</span>
          </div>
          <div class="flex-1">
            <p class="text-gray-700">{{ aiRejectionInfo.message }}</p>
            <div class="mt-3 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-1">{{ t('common.content') }}</p>
              <p class="text-sm font-medium text-gray-800 whitespace-pre-wrap">{{ aiRejectionInfo.content }}</p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            {{ t('posts.description_review') }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <GlassButton
            variant="secondary"
            @click="showAIRejectionModal = false"
          >
            {{ t('common.known') }}
          </GlassButton>
          <GlassButton
            :loading="reviewRequesting"
            @click="requestReview"
          >
            {{ t('posts.requestReview') }}
          </GlassButton>
        </div>
      </template>
    </GlassModal>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import { CalendarIcon, EditIcon, PinIcon } from 'lucide-vue-next'
import {type LocationQueryRaw, type LocationQueryValue} from 'vue-router'
import GlassButton from '~/components/ui/GlassButton.vue'
import GlassTextarea from '~/components/ui/GlassTextarea.vue'
import GlassModal from '~/components/ui/GlassModal.vue'
import GlassInput from '~/components/ui/GlassInput.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import GlassCard from '~/components/ui/GlassCard.vue'
import ImageGrid from '~/components/ui/ImageGrid.vue'
import CommentUserInfo from '~/components/comments/CommentUserInfo.vue'
import type { PostDto, CommentDto, Pagination, CommentForm } from '~/types'

interface PostEditFormState {
  author_name: string
  target_name: string
  content: string
}

// --- 基础 setup ---
const route = useRoute()
const router = useRouter()
const postId = computed(() => route.params.id as string)

const auth = useAuthStore()
const toast = useToast()
const { assetUrl } = useAssetUrl()
const home = useHomeStore()
const api = useNuxtApp().$api
const { renderTag } = useTagRenderer()

// --- 表单状态与局部UI ---
const comments = ref<CommentDto[]>([])
const commentsData = ref<Pagination<CommentDto> | null>(null)
const commentsLoading = ref(false)
const commentSubmitting = ref(false)
const actionLoading = ref(false)
const lockStatus = ref<{ id: string; is_locked: boolean } | null>(null)
const isEditingPost = ref(false)
const editSaving = ref(false)
const editForm = ref<PostEditFormState>({ author_name: '', target_name: '', content: '' })
const pendingOpenEdit = ref(false)
const showAIRejectionModal = ref(false)
const aiRejectionInfo = ref({ message: '', type: 'comment' as const, content: '' })
const reviewRequesting = ref(false)
const authorAvatar = ref<string | null>(null)
const myActiveTagPreview = ref<{ name: string; title: string; background_color: string; text_color: string } | null>(null)
const commentForm = reactive<CommentForm>({ content: '' })
const commentErrors = ref<Partial<CommentForm>>({})
const commentsLoadMoreTrigger = ref<HTMLElement>()

const {
  data: postData,
  pending,
  error,
  refresh
} = await useAsyncData(
  () => `post-${postId.value}`,
  async () => {
    const post = await api.getPost(postId.value)

    // ✅ 修复N+1问题：直接使用API响应中的数据，不再额外请求
    // API响应已包含：author_avatar_url, author_display_name, author_is_online, is_locked等
    return {
      post,
      authorAvatar: (post as any).author_avatar_url ? assetUrl((post as any).author_avatar_url) : null,
      lockStatus: { id: post.id, is_locked: (post as any).is_locked ?? false }
    }
  },
  { watch: [postId] }
)

onMounted(async () => {
  if (auth.isAuthenticated && (auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS'))) {
    try {
      const adminPost = await api.getPostForAdmin(postId.value)
      postData.value = {
        authorAvatar: postData.value?.authorAvatar ?? '',
        lockStatus: postData.value?.lockStatus ?? { id: adminPost.id, is_locked: (adminPost as any).is_locked ?? false },
        post: adminPost
      }
    } catch (err) {
      console.warn('Client-side admin post fetch failed:', err)
    }
  }

  // 评论区无限滚动
  if (commentsLoadMoreTrigger.value) {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (!target) {
          return
        }
        const hasMoreComments = commentsData.value &&
          commentsData.value.page * commentsData.value.page_size < commentsData.value.total

        if (target.isIntersecting && hasMoreComments && !commentsLoading.value) {
          loadMoreComments()
        }
      },
      {
        root: null,
        rootMargin: '200px', // 提前200px开始加载
        threshold: 0.1,
      }
    )

    observer.observe(commentsLoadMoreTrigger.value)

    onBeforeUnmount(() => {
      observer.disconnect()
    })
  }
})

const post = computed(() => postData.value?.post)

watchEffect(() => {
  if (postData.value?.authorAvatar) authorAvatar.value = postData.value.authorAvatar
  if (postData.value?.lockStatus) lockStatus.value = postData.value.lockStatus
})

// ✅ 2. SSR加载评论
const { data: commentsInit, pending: commentsPending, refresh: refreshComments } = await useAsyncData(
  () => `post-comments-${postId.value}`,
  async () => await fetchComments(1),
  {
    server: false,
    lazy: true,
  }
)

watch(commentsInit, (val) => {
  if (val) {
    comments.value = val.items
    commentsData.value = val
  }
})

// --- 计算属性 ---
const loading = computed(() => pending.value)
const errorMsg = computed(() => error.value?.message || null)
const showAdminActions = computed(() => auth.isAuthenticated && (auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_FEATURED', 'MANAGE_POSTS'])))
const canEditPost = computed(() => auth.isSuperadmin || auth.hasAnyPerm(['MANAGE_POSTS']))

// ✅ 判断当前用户是否因帖子锁定而无法评论
// 拥有 MANAGE_POSTS 权限的管理员即使帖子被锁定也可以评论
const isLockedForCurrentUser = computed(() => {
  if (!lockStatus.value?.is_locked) return false
  // 管理员不受锁定限制
  if (auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) return false
  return true
})

async function fetchComments(page = 1) {
  return await api.listComments(postId.value, { page, page_size: 20 })
}

// --- 方法（保留原逻辑） ---
const loadMoreComments = () => {
  if (commentsData.value) loadComments(commentsData.value.page + 1)
}
async function loadComments(page = 1) {
  commentsLoading.value = true
  try {
    const data = await fetchComments(page)
    if (page === 1) comments.value = data.items
    else comments.value.push(...data.items)
    commentsData.value = data
  } finally {
    commentsLoading.value = false
  }
}

const savePostEdit = async () => {
  if (!post.value || !canEditPost.value) return

  editSaving.value = true
  try {
    const api = useNuxtApp().$api
    const payload = {
      author_name: editForm.value.author_name,
      target_name: editForm.value.target_name,
      content: editForm.value.content
    }
    const updated = await api.updatePost(post.value.id, payload)

    const index = home.posts.findIndex(item => item.id === updated.id)
    if (index !== -1) {
      home.posts[index] = { ...home.posts[index], ...updated }
    }

    toast.success(t('common.success'))
    isEditingPost.value = false
    pendingOpenEdit.value = false
    removeEditQuery()
  } catch (error: any) {
    toast.error(error?.message || t('error.messages.unknown'))
  } finally {
    editSaving.value = false
  }
}

// --- 评论/管理/编辑相关逻辑原封保留 ---
const submitComment = async () => {
  if (!commentForm.content.trim()) return
  if (commentForm.content.length > 500) {
    commentErrors.value = { content: t('comment.commentOversize') }
    toast.error(t('comment.commentOversize'))
    return
  }
  commentSubmitting.value = true
  try {
    const newComment = await api.createComment(postId.value, commentForm)
    const enriched = {
      ...newComment,
      user_display_name: (newComment as any).user_display_name || auth.userDisplayName,
      user_avatar_url: auth.currentUser?.avatar_url || null,
      user_username: auth.currentUser?.username || null,
      user_tag: myActiveTagPreview.value ? { ...myActiveTagPreview.value } : undefined,
      user_is_online: true,
      user_last_heartbeat: new Date().toISOString()
    }
    comments.value.unshift(enriched as any)
    commentForm.content = ''
    toast.success(t('common.success'))
  } catch (err: any) {
    toast.error(t('error.messages.unknown'))
  } finally {
    commentSubmitting.value = false
  }
}

const openEditPost = () => {
  if (!post.value || !canEditPost.value) return
  editForm.value = {
    author_name: post.value.author_name ?? '',
    target_name: post.value.target_name ?? '',
    content: post.value.content ?? ''
  }
  pendingOpenEdit.value = false
  isEditingPost.value = true
}

const removeEditQuery = () => {
  if (!import.meta.client) return
  if (route.query.edit === undefined) return
  const newQuery = { ...route.query } as LocationQueryRaw
  delete newQuery.edit
  router.replace({ query: newQuery }).catch(() => {})
}

const closeEditPost = () => {
  isEditingPost.value = false
  pendingOpenEdit.value = false
  removeEditQuery()
}

const toggleCommentPin = async (comment: CommentDto) => {
  try {
    const api = useNuxtApp().$api
    let result: { is_pinned: boolean }
    if (comment.is_pinned) {
      result = await api.unpinComment(comment.id)
      toast.success(t('common.success'))
    } else {
      result = await api.pinComment(comment.id)
      toast.success(t('common.success'))
    }
    comment.is_pinned = result.is_pinned
    await loadComments()
  } catch (error: any) {
    toast.error(error?.message || t('error.messages.unknown'))
  }
}

const canManageComment = (comment: CommentDto) => {
  return auth.isAuthenticated && (
    comment.user_id === auth.currentUser?.id ||
    auth.isSuperadmin ||
    auth.hasPerm('MANAGE_POSTS')
  )
}

const hideComment = async (comment: CommentDto) => {
  try {
    const api = useNuxtApp().$api
    await api.hideComment(comment.id, comment.status === 0)

    // Update local state
    comment.status = comment.status === 0 ? 1 : 0
    toast.success(t('common.success'))
  } catch (err) {
    toast.error(t('error.messages.unknown'))
  }
}

const promptModerationReason = async (action: string): Promise<string | null> => {
  if (typeof window === 'undefined') return ''
  const { prompt } = useAdminDialog()
  const input = await prompt({
    title: `${action}处理`,
    inputLabel: '处理原因(可选)',
    placeholder: '请输入处理原因(可选)',
    confirmText: '确定',
    cancelText: '取消'
  })
  if (input === null) return null
  return input.trim()
}

const togglePin = async () => {
  if (!post.value) return

  const nextState = !post.value.is_pinned
  const reasonInput = await promptModerationReason(nextState ? '置顶' : '取消置顶')
  if (reasonInput === null) return

  actionLoading.value = true
  try {
    const api = useNuxtApp().$api
    const res = await api.pinPost(post.value.id, nextState, reasonInput || undefined)
    post.value.is_pinned = res.is_pinned
    toast.success(post.value.is_pinned ? '已置顶' : '已取消置顶')
  } catch (err) {
    toast.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

const toggleFeature = async () => {
  if (!post.value) return

  const nextState = !post.value.is_featured
  const reasonInput = await promptModerationReason(nextState ? '设为精华' : '取消精华')
  if (reasonInput === null) return

  actionLoading.value = true
  try {
    const api = useNuxtApp().$api
    const res = await api.featurePost(post.value.id, nextState, reasonInput || undefined)
    post.value.is_featured = res.is_featured
    toast.success(post.value.is_featured ? '已设为精华' : '已取消精华')
  } catch (err) {
    toast.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

const toggleHide = async () => {
  if (!post.value) return
  const shouldHide = post.value.status === 0
  if (shouldHide) {
    const { confirm } = useAdminDialog()
    const confirmed = await confirm({
      title: '确认隐藏',
      message: '确定要隐藏这个帖子吗？',
      confirmText: '确认隐藏',
      cancelText: '取消'
    })
    if (!confirmed) return
  }

  const reasonInput = await promptModerationReason(shouldHide ? '隐藏' : '恢复')
  if (reasonInput === null) return

  actionLoading.value = true
  try {
    const api = useNuxtApp().$api
    if (post.value.status === 1) {
      const res = await api.hidePost(post.value.id, false, reasonInput || undefined)
      post.value.status = res.status as 0 | 1
      toast.success('帖子已恢复')
    } else if (post.value.status === 0) {
      const res = await api.hidePost(post.value.id, true, reasonInput || undefined)
      post.value.status = res.status as 0 | 1
      toast.success('帖子已隐藏')
    }
  } catch (err) {
    toast.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

const toggleLock = async () => {
  if (!post.value || !lockStatus.value) return

  const shouldLock = !lockStatus.value.is_locked
  const { confirm } = useAdminDialog()

  if (shouldLock) {
    const confirmed = await confirm({
      title: '确认锁定',
      message: '锁定后普通用户将无法评论此帖子，确定要锁定吗？',
      confirmText: '确认锁定',
      cancelText: '取消'
    })
    if (!confirmed) return
  } else {
    const confirmed = await confirm({
      title: '确认解锁',
      message: '解锁后普通用户将可以评论此帖子，确定要解锁吗？',
      confirmText: '确认解锁',
      cancelText: '取消'
    })
    if (!confirmed) return
  }

  actionLoading.value = true
  try {
    const api = useNuxtApp().$api
    if (shouldLock) {
      const result = await api.lockPost(post.value.id)
      lockStatus.value = result
      toast.success('帖子已锁定')
    } else {
      const result = await api.unlockPost(post.value.id)
      lockStatus.value = result
      toast.success('帖子已解锁')
    }
  } catch (err: any) {
    toast.error(err?.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

const confirmDelete = async () => {
  if (!post.value) return

  const { confirm, prompt } = useAdminDialog()

  // 先确认是否删除
  const confirmed = await confirm({
    title: '确认删除',
    message: '确定要删除这条表白吗？删除后无法恢复。',
    confirmText: '确认删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  // 询问删除原因（可选）
  const reason = await prompt({
    title: '删除原因',
    message: '请填写删除原因（可选）',
    placeholder: '填写本次删除的原因',
    confirmText: '确认删除',
    cancelText: '取消'
  })

  // 用户可以输入空原因或取消prompt
  if (reason === null) return

  actionLoading.value = true
  try {
    const api = useNuxtApp().$api
    await api.deletePost(post.value.id, reason.trim() || undefined)
    toast.success('帖子已删除')
    await router.push('/')
  } catch (err) {
    toast.error('删除失败')
  } finally {
    actionLoading.value = false
  }
}

// --- 复核请求与评论刷新 ---
const requestReview = async () => {
  if (!aiRejectionInfo.value.content) return
  reviewRequesting.value = true
  try {
    await api.requestPostReview(postId.value)
    toast.success('已提交人工复核申请')
    if (post.value) post.value.manual_review_requested = true
    showAIRejectionModal.value = false
  } catch {
    toast.error('申请复核失败，请稍后重试')
  } finally {
    reviewRequesting.value = false
  }
}

// --- 工具函数 ---
const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')
const navigateToUser = (x: any) => {
  if (x.author_id) navigateTo(localePath(`/users/id/${x.author_id}`))
  else if (x.user_id) navigateTo(localePath(`/users/id/${x.user_id}`))
  else if (x.user_username) navigateTo(localePath(`/users/${x.user_username}`))
}

// Force remount when param changes (extra safety in addition to watch)
definePageMeta({
  key: (route: any) => `post-${route.params?.id ?? ''}`
})

// SEO
const siteName = t('seo.title')
const defaultPostDescription = t('seo.description')
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

const canonicalUrl = computed(() => {
  const base = normalizedSiteOrigin.value
  const pathValue = route.fullPath || `/posts/${postId.value}`
  const normalizedPath = pathValue.startsWith('/') ? pathValue : `/${pathValue}`
  if (!base) {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
})

const defaultOgImage = computed(() => {
  const base = normalizedSiteOrigin.value
  if (!base) {
    return '/badge.png'
  }
  return `${base}/badge.png`
})

const postHeadline = computed(() => {
  if (!post.value) {
    return t('posts.404')
  }
  const confession = post.value.card_type !== 'communication' && post.value.card_type !== 'social'
  if (confession && post.value.target_name) {
    return t('posts.confessionTo', { author: post.value.author_name, target: post.value.target_name })
  }
  return t('posts.socialFrom', { author: post.value.author_name })
})

const postSeoTitle = computed(() => {
  if (!post.value) {
    return `${t('posts.404')} - ${siteName}`
  }
  return `${postHeadline.value} - ${siteName}`
})

const sanitizeContent = (value?: string | null) => {
  if (!value) {
    return defaultPostDescription
  }
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) {
    return defaultPostDescription
  }
  return text.length > 160 ? `${text.slice(0, 157)}...` : text
}

const postSeoDescription = computed(() => sanitizeContent(post.value?.content))

const ogImageUrl = computed(() => {
  if (!post.value?.images?.length) {
    return defaultOgImage.value
  }
  const firstImage = post.value.images[0]
  const resolved = assetUrl(firstImage)
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

const postStructuredData = computed(() => {
  if (!post.value) {
    return null
  }
  const canonical = canonicalUrl.value
  const image = ogImageUrl.value
  const stats: any[] = []
  if (typeof post.value.view_count === 'number') {
    stats.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: post.value.view_count,
    })
  }
  if (typeof post.value.comment_count === 'number') {
    stats.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: post.value.comment_count,
    })
  }
  const author: Record<string, any> = {
    '@type': 'Person',
    name: post.value.author_name || '\u533f\u540d',
  }
  if (post.value.author_id) {
    author.identifier = post.value.author_id
  }
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': canonical,
    url: canonical,
    headline: postHeadline.value,
    articleBody: post.value.content,
    datePublished: toIsoString(post.value.created_at),
    dateModified: toIsoString(post.value.updated_at || post.value.created_at),
    inLanguage: 'zh-CN',
    author,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: normalizedSiteOrigin.value || undefined,
    },
    about: post.value.card_type || undefined,
    interactionStatistic: stats.length ? stats : undefined,
  }
  if (image) {
    data.image = [image]
  }
  if (!data.publisher.url) {
    delete data.publisher.url
  }
  if (!stats.length) {
    delete data.interactionStatistic
  }
  return data
})

// --- SEO ---
useSeoMeta({
  title: computed(() => postSeoTitle.value),
  description: computed(() => postSeoDescription.value),
  ogTitle: computed(() => postSeoTitle.value),
  ogDescription: computed(() => postSeoDescription.value),
  ogImage: computed(() => ogImageUrl.value),
  ogUrl: computed(() => canonicalUrl.value),
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => canonicalUrl.value)
    }
  ],
  script: computed(() => {
    if (!postStructuredData.value) return []
    return [
      {
        type: 'application/ld+json',
        key: 'ld-post-detail',
        children: JSON.stringify(postStructuredData.value),
      },
    ]
  }),
})

</script>

<style scoped>
.pinned-comment {
  background: linear-gradient(135deg, rgba(255, 92, 163, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-left: 3px solid #e04a91;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(18px);
}

.pinned-comment:last-child {
  margin-bottom: 0;
}
</style>

