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
        <h1 class="text-2xl font-bold text-red-600 mb-4">加载失败</h1>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <GlassButton variant="secondary" @click="() => refresh()">
          重新加载
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
              :alt-prefix="post.card_type !== 'communication' && post.card_type !== 'social' && post.target_name ? `${post.author_name}对${post.target_name}的表白` : `${post.author_name}的交流`"
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
              />
              <div
                v-else
                class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-lg font-medium"
                :class="post.is_author_admin ? 'border-0' : 'border-2 border-white/20'"
              >
                {{ post.author_name.slice(0, 2) }}
              </div>
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
                    />
                    <div
                      v-else
                      class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      :class="post.is_author_admin ? 'border-0' : 'border border-white/20'"
                    >
                      {{ post.author_name.slice(0, 2) }}
                    </div>
                  </div>

                  <h1 class="text-2xl font-bold text-gray-800">
                    {{ post.author_name }}
                  </h1>
                  <!-- 新增: 在线状态徽章 -->
                  <OnlineBadge
                    v-if="post.author_id"
                    :user-id="post.author_id"
                  />
                  <!-- Author Active Tag -->
                  <TagBadge
                    v-if="post.author_tag"
                    :title="post.author_tag.title"
                    :background="post.author_tag.background_color"
                    :text="post.author_tag.text_color"
                  />
                </div>

                <h1
                  v-if="(post.card_type !== 'communication' && post.card_type !== 'social') && post.target_name"
                  class="text-2xl font-bold text-gray-800"
                >
                  → {{ post.target_name }}
                </h1>
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
                      :title="post.audit_msg || '需要人工审核'"
                    >
                      待审核
                    </span>

                    <span
                      v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.manual_review_requested"
                      class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full"
                      title="用户已申请人工复核"
                    >
                      申请复核
                    </span>

                    <span
                    v-if="post.is_featured"
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    精华
                  </span>
                  <span
                    v-if="post.is_pinned"
                    class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                  >
                    置顶
                  </span>
                  <span
                    v-if="(auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')) && post.status === 1"
                    class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                  >
                    已隐藏
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
                      {{ post.is_pinned ? '取消置顶' : '置顶' }}
                    </button>

                    <button
                      v-if="auth.hasPerm('MANAGE_FEATURED')"
                      type="button"
                      class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                      :disabled="actionLoading"
                      @click="toggleFeature"
                    >
                      {{ post.is_featured ? '取消精华' : '精华' }}
                    </button>
                  </template>

                  <button
                    v-if="canEditPost"
                    type="button"
                    class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors inline-flex items-center gap-1"
                    @click="openEditPost"
                  >
                    <EditIcon class="w-3 h-3" />
                    <span>编辑帖子</span>
                  </button>

                  <button
                    v-if="auth.hasPerm('MANAGE_POSTS')"
                    type="button"
                    class="px-2 py-1 text-xs text-gray-600 hover:text-brand-600 border border-gray-300 hover:border-brand-400 rounded transition-colors disabled:opacity-50"
                    :disabled="actionLoading"
                    @click="toggleHide"
                  >
                    {{ post.status === 1 ? '恢复' : '隐藏' }}
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
                    删除
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
            评论 ({{ commentsData?.total || 0 }})
          </h2>
        </div>

        <!-- Hidden posts: block entire comments area -->
        <div v-if="post?.status === 1" class="text-center py-12">
          <p class="text-gray-600">隐藏的条目不应当拥有评论，请先取消隐藏</p>
        </div>
        <template v-else>
          <ClientOnly>
            <template #default>
              <!-- Comment Form (if authenticated) -->
              <div v-if="auth.isAuthenticated" class="mb-6">
                <form class="space-y-4" @submit.prevent="submitComment">
                  <div class="relative">
                    <GlassTextarea
                      v-model="commentForm.content"
                      placeholder="写下你的看法..."
                      :rows="5"
                      :error="commentErrors.content"
                      :input-class="'pr-28 min-h-[140px]'"
                      required
                    />
                    <GlassButton
                      type="submit"
                      :loading="commentSubmitting"
                      :disabled="!commentForm.content.trim()"
                      class="absolute right-3 bottom-3 rounded-full h-10 px-5"
                    >
                      发布评论
                    </GlassButton>
                  </div>
                </form>
              </div>

              <div v-else class="mb-6 text-center py-8">
                <p class="text-gray-600 mb-4">登录后可发表评论</p>
                <NuxtLink to="/auth/login" class="glass-button">
                  立即登录
                </NuxtLink>
              </div>
            </template>

            <template #fallback>
              <div class="mb-6 text-center py-8 opacity-0 select-none">
                登录后可发表评论
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
                还没有评论，来发表第一条评论吧！
              </div>

              <!-- Comments -->
              <div v-else>
                <div
                  v-for="(comment, index) in comments"
                  :key="comment.id"
                  class="relative"
                >
                  <hr
                    v-if="index > 0 && !comment.is_pinned && comments[index - 1] && comments[index - 1]!!.is_pinned"
                    class="my-6 border-white/20"
                  >
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
                      <span class="text-sm font-medium text-brand-600">置顶评论</span>
                    </div>
                    <div class="flex items-start gap-3">
                      <!-- User Avatar -->
                      <div
                        class="relative w-10 h-10 flex-shrink-0 transition-transform hover:scale-110 cursor-pointer"
                        @click="navigateToUser(comment)"
                      >
                        <!-- 管理员光圈效果 -->
                        <template v-if="comment.is_user_admin">
                          <div
                            class="absolute -inset-[3px] rounded-full border-[3px] border-sky-400/95 pointer-events-none"
                          />
                          <div
                            class="absolute -inset-[7px] rounded-full bg-sky-300/40 blur-2xl pointer-events-none"
                          />
                        </template>

                        <!-- 头像容器 -->
                        <NuxtImg
                          v-if="comment.user_avatar_url"
                          :src="assetUrl(comment.user_avatar_url)"
                          :alt="commentDisplayName(comment)"
                          class="relative z-10 w-full h-full rounded-full object-cover"
                          :class="comment.is_user_admin ? 'border-0' : 'border-2 border-white/20'"
                          @error="() => { comment.user_avatar_url = null }"
                        />
                        <div
                          v-else
                          class="relative z-10 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          :class="comment.is_user_admin ? 'border-0' : 'border-2 border-white/20'"
                        >
                          {{ commentDisplayName(comment).slice(0, 2) }}
                        </div>
                      </div>

                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                      <span class="text-sm font-medium text-gray-700">
                        {{ commentDisplayName(comment) }}
                      </span>
                          <!-- 新增: 在线状态徽章 -->
                          <OnlineBadge
                            v-if="comment.user_id"
                            :user-id="comment.user_id"
                          />
                          <TagBadge
                            v-if="comment.user_tag"
                            :title="comment.user_tag.title"
                            :background="comment.user_tag.background_color"
                            :text="comment.user_tag.text_color"
                          />
                          <div class="ml-auto flex items-center gap-2">
                        <span class="text-xs text-gray-500">
                          {{ formatDate(comment.created_at) }}
                        </span>
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
                  </div>
                </div>

                <!-- Load more comments -->
                <div v-if="commentsData && commentsData.page * commentsData.page_size < commentsData.total" class="text-center pt-4">
                  <GlassButton
                    :loading="commentsLoading"
                    variant="secondary"
                    @click="loadMoreComments"
                  >
                    加载更多评论
                  </GlassButton>
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
      title="编辑帖子"
      max-width="max-w-2xl"
      @close="closeEditPost"
    >
      <div class="text-gray-700 mb-6">注：由于缓存原因，帖子可能需要一段时间才能完成更新</div>
      <form class="space-y-4" @submit.prevent="savePostEdit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">作者名称</label>
          <GlassInput v-model="editForm.author_name" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">对象名称</label>
          <GlassInput v-model="editForm.target_name" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">内容</label>
          <GlassTextarea
            v-model="editForm.content"
            :rows="6"
            :input-class="'min-h-[200px]'"
            placeholder="请输入帖子内容"
            required
          />
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <GlassButton
            type="button"
            variant="outline"
            @click="closeEditPost"
          >
            取消
          </GlassButton>
          <GlassButton
            type="submit"
            variant="secondary"
            :loading="editSaving"
            :disabled="!editForm.content.trim()"
          >
            保存
          </GlassButton>
        </div>
      </form>
    </GlassModal>

    <!-- Delete Confirmation Modal -->
    <GlassModal
      :is-open="showDeleteModal"
      title="确认删除"
      max-width="max-w-md"
      @close="closeDeleteModal"
    >
      <p class="text-gray-600 mb-6">确定要删除这条表白吗？删除后无法恢复。</p>
      <div class="space-y-3">
        <label class="text-sm text-gray-700">处理原因（可选）</label>
        <GlassTextarea
          v-model="deleteReason"
          :rows="3"
          placeholder="填写本次删除的原因"
        />
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <GlassButton variant="secondary" @click="closeDeleteModal">取消</GlassButton>
          <GlassButton
            :loading="actionLoading"
            class="!bg-red-600 hover:!bg-red-700"
            @click="deletePost"
          >
            确认删除
          </GlassButton>
        </div>
      </template>
    </GlassModal>

    <!-- AI Rejection Modal -->
    <GlassModal
      :is-open="showAIRejectionModal"
      title="内容审核未通过"
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
              <p class="text-sm text-gray-600 mb-1">您的内容：</p>
              <p class="text-sm font-medium text-gray-800 whitespace-pre-wrap">{{ aiRejectionInfo.content }}</p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <strong>申请人工复核：</strong>如果您认为这是误判，可以申请管理员进行人工复核。
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <GlassButton
            variant="secondary"
            @click="showAIRejectionModal = false"
          >
            知道了
          </GlassButton>
          <GlassButton
            :loading="reviewRequesting"
            @click="requestReview"
          >
            申请复核
          </GlassButton>
        </div>
      </template>
    </GlassModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarIcon, EditIcon, PinIcon } from 'lucide-vue-next'
import {type LocationQueryRaw, type LocationQueryValue} from 'vue-router'
import GlassButton from '~/components/ui/GlassButton.vue'
import GlassTextarea from '~/components/ui/GlassTextarea.vue'
import GlassModal from '~/components/ui/GlassModal.vue'
import GlassInput from '~/components/ui/GlassInput.vue'
import TagBadge from '~/components/ui/TagBadge.vue'
import OnlineBadge from '~/components/ui/OnlineBadge.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import GlassCard from '~/components/ui/GlassCard.vue'
import ImageGrid from '~/components/ui/ImageGrid.vue'
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
const assetUrl = useAssetUrl()
const home = useHomeStore()
const { confirm: confirmDialog } = useConfirm()
const { prompt: promptDialog } = usePrompt()
const api = useApi()

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
const showDeleteModal = ref(false)
const deleteReason = ref('')
const showAIRejectionModal = ref(false)
const aiRejectionInfo = ref({ message: '', type: 'comment' as const, content: '' })
const reviewRequesting = ref(false)
const authorAvatar = ref<string | null>(null)
const userAvatarCache = ref<Map<string, string | null>>(new Map())
const myActiveTagPreview = ref<{ name: string; title: string; background_color: string; text_color: string } | null>(null)
const commentForm = reactive<CommentForm>({ content: '' })
const commentErrors = ref<Partial<CommentForm>>({})

const {
  data: postData,
  pending,
  error,
  refresh
} = await useAsyncData(
  () => `post-${postId.value}`,
  async () => {
    const post = await api.getPost(postId.value)

    const [user, lock] = await Promise.allSettled([
      post.author_id ? api.getUser(post.author_id) : Promise.resolve(null),
      api.getPostLockStatus(postId.value)
    ])

    return {
      post,
      authorAvatar: (user.status === 'fulfilled' && user.value?.avatar_url
        ? assetUrl(user.value.avatar_url)
        : null) as string | null,
      lockStatus: lock.status === 'fulfilled' ? lock.value : { id: postId.value, is_locked: false }
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
        lockStatus: postData.value?.lockStatus,
        post: adminPost
      }
    } catch (err) {
      console.warn('Client-side admin post fetch failed:', err)
    }
  }
})

const post = ref<PostDto | null>(postData.value?.post ?? null)

if (import.meta.client) {
  watch(
    () => postData.value?.post,
    (val) => {
      if (val) post.value = val
    }
  )
}

watchEffect(() => {
  if (postData.value?.authorAvatar) authorAvatar.value = postData.value.authorAvatar
  if (postData.value?.lockStatus) lockStatus.value = postData.value.lockStatus
})

// ✅ 2. SSR加载评论
const { data: commentsInit, pending: commentsPending, refresh: refreshComments } = await useAsyncData(
  () => `post-comments-${postId.value}`,
  async () => await api.listComments(postId.value, { page: 1, page_size: 20 }),
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

// --- 方法（保留原逻辑） ---
const loadMoreComments = () => {
  if (commentsData.value) loadComments(commentsData.value.page + 1)
}
const loadComments = async (page = 1) => {
  commentsLoading.value = true
  try {
    const data = await api.listComments(postId.value, { page, page_size: 20 })
    const userIds = [...new Set(data.items.map(c => c.user_id))] as string[]
    const uncached = userIds.filter(id => !userAvatarCache.value.has(id))
    if (uncached.length > 0) {
      await Promise.all(uncached.map(async (id) => {
        try {
          const u = await api.getUser(id)
          userAvatarCache.value.set(id, u.avatar_url || null)
        } catch { userAvatarCache.value.set(id, null) }
      }))
    }
    const enriched = data.items.map(c => ({ ...c, user_avatar_url: userAvatarCache.value.get(c.user_id) ?? null }))
    if (page === 1) comments.value = enriched
    else comments.value.push(...enriched)
    commentsData.value = data
  } catch {
    toast.error('加载评论失败')
  } finally {
    commentsLoading.value = false
  }
}

const savePostEdit = async () => {
  if (!post.value || !canEditPost.value) return

  editSaving.value = true
  try {
    const api = useApi()
    const payload = {
      author_name: editForm.value.author_name,
      target_name: editForm.value.target_name,
      content: editForm.value.content
    }
    const updated = await api.updatePost(post.value.id, payload)
    post.value = updated

    const index = home.posts.findIndex(item => item.id === updated.id)
    if (index !== -1) {
      home.posts[index] = { ...home.posts[index], ...updated }
    }

    toast.success('帖子已更新')
    isEditingPost.value = false
    pendingOpenEdit.value = false
    removeEditQuery()
  } catch (error: any) {
    toast.error(error?.message || '更新失败')
  } finally {
    editSaving.value = false
  }
}

// --- 评论/管理/编辑相关逻辑原封保留 ---
const submitComment = async () => {
  if (!commentForm.content.trim()) return
  if (commentForm.content.length > 500) {
    commentErrors.value = { content: '评论内容不能超过500个字符' }
    toast.error('评论内容不能超过500个字符')
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
      user_tag: myActiveTagPreview.value ? { ...myActiveTagPreview.value } : undefined
    }
    comments.value.unshift(enriched as any)
    commentForm.content = ''
    toast.success('评论发表成功')
  } catch (err: any) {
    if (err?.response?.status === 422 && err?.response?.data?.error?.code === 'AI_REJECTED') {
      const reason = err.response.data.error.extras?.reason
      showAIRejectionModal.value = true
      aiRejectionInfo.value = {
        message: reason ? `评论未通过审核：${reason}` : '评论未通过审核',
        type: 'comment',
        content: commentForm.content
      }
    } else toast.error('评论发表失败')
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
    const api = useApi()
    let result: { is_pinned: boolean }
    if (comment.is_pinned) {
      result = await api.unpinComment(comment.id)
      toast.success('已取消置顶')
    } else {
      result = await api.pinComment(comment.id)
      toast.success('评论已置顶')
    }
    comment.is_pinned = result.is_pinned
    await loadComments()
  } catch (error: any) {
    toast.error(error?.message || '操作失败')
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
    const api = useApi()
    await api.hideComment(comment.id, comment.status === 0)

    // Update local state
    comment.status = comment.status === 0 ? 1 : 0
    toast.success(comment.status === 0 ? '评论已恢复' : '评论已隐藏')
  } catch (err) {
    toast.error('操作失败')
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
    const api = useApi()
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
    const api = useApi()
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
    const api = useApi()
    if (post.value.status === 1) {
      const res = await api.hidePost(post.value.id, false, reasonInput || undefined)
      post.value.status = res.status
      toast.success('帖子已恢复')
    } else if (post.value.status === 0) {
      const res = await api.hidePost(post.value.id, true, reasonInput || undefined)
      post.value.status = res.status
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

  if (shouldLock) {
    const { confirm } = useAdminDialog()
    const confirmed = await confirm({
      title: '确认锁定',
      message: '锁定后普通用户将无法评论此帖子,确定要锁定吗？',
      confirmText: '确认锁定',
      cancelText: '取消'
    })
    if (!confirmed) return
  }

  actionLoading.value = true
  try {
    const api = useApi()
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

const confirmDelete = () => {
  deleteReason.value = ''
  showDeleteModal.value = true
}

const deletePost = async () => {
  if (!post.value) return

  actionLoading.value = true
  try {
    const api = useApi()
    await api.deletePost(post.value.id, deleteReason.value.trim() || undefined)
    toast.success('帖子已删除')
    closeDeleteModal()
    await router.push('/')
  } catch (err) {
    toast.error('删除失败')
  } finally {
    actionLoading.value = false
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteReason.value = ''
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
const commentDisplayName = (c: CommentDto) => c.user_display_name || c.user_username || `用户${c.user_id?.slice(0, 6)}`
const navigateToUser = (x: any) => {
  if (x.author_id) navigateTo(`/users/id/${x.author_id}`)
  else if (x.user_id) navigateTo(`/users/id/${x.user_id}`)
  else if (x.user_username) navigateTo(`/users/${x.user_username}`)
}

// Force remount when param changes (extra safety in addition to watch)
definePageMeta({
  key: (route: any) => `post-${route.params?.id ?? ''}`
})

// SEO
const siteName = '\u90d1\u5dde\u56db\u4e2d\u8868\u767d\u5899'
const defaultPostDescription = '\u90d1\u5dde\u56db\u4e2d\u5b98\u65b9\u6821\u56ed\u4fe1\u606f\u4ea4\u6d41\u5e73\u53f0\uff0c\u5e2e\u52a9\u540c\u5b66\u533f\u540d\u5206\u4eab\u5fc3\u58f0\u3001\u8868\u767d\u4e0e\u6821\u56ed\u8d44\u8baf\uff0c\u8425\u9020\u6e29\u6696\u771f\u5b9e\u7684\u4e92\u52a8\u793e\u533a\u3002'
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
    return '\u5e16\u5b50\u4e0d\u5b58\u5728'
  }
  const confession = post.value.card_type !== 'communication' && post.value.card_type !== 'social'
  if (confession && post.value.target_name) {
    return `${post.value.author_name}\u5bf9${post.value.target_name}\u7684\u8868\u767d`
  }
  return `${post.value.author_name}\u7684\u6295\u7a3f`
})

const postSeoTitle = computed(() => {
  if (!post.value) {
    return `\u5e16\u5b50\u4e0d\u5b58\u5728 - ${siteName}`
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
useHead(() => {
  if (!post.value) {
    return { title: `\u5e16\u5b50\u4e0d\u5b58\u5728 - ${siteName}` }
  }
  const canonical = canonicalUrl.value
  const description = postSeoDescription.value
  const title_ = postSeoTitle.value
  const image = ogImageUrl.value
  const structured = postStructuredData.value
  const published = toIsoString(post.value.created_at)
  const updated = toIsoString(post.value.updated_at || post.value.created_at)

  return {
    title_,
    meta: [
      { name: 'description', content: description },
      { name: 'author', content: post.value.author_name || '\u533f\u540d' },
      { property: 'og:title', content: title_ },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: siteName },
      { property: 'article:published_time', content: published },
      { property: 'article:modified_time', content: updated },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title_ },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: canonical },
    ],
    script: structured
      ? [
          {
            type: 'application/ld+json',
            key: 'ld-post-detail',
            children: JSON.stringify(structured),
          },
        ]
      : [],
  }
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

