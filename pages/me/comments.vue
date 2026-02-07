<template>
  <div class="w-full space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('user.myComments') }}</h1>
      <p class="text-gray-600 mt-2">{{ t('user.comments.description') }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{{ commentsData?.total || 0 }}</div>
        <div class="text-sm text-gray-600">{{ t('user.comments.totalComments') }}</div>
      </GlassCard>
      
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">{{ visibleCount }}</div>
        <div class="text-sm text-gray-600">{{ t('user.posts.common') }}</div>
      </GlassCard>

      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-gray-600 mb-1">{{ hiddenCount }}</div>
        <div class="text-sm text-gray-600">{{ t('user.posts.hidden') }}</div>
      </GlassCard>
    </div>

    <!-- Controls -->
    <GlassCard class="p-4">
      <div class="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <!-- Filters -->
        <div class="flex gap-2">
          <select
            v-model="filters.status"
            class="input px-3 py-2 text-sm"
            @change="applyFilters"
          >
            <option value="">{{ t('user.posts.allState') }}</option>
            <option value="0">{{ t('user.posts.common') }}</option>
            <option value="1">{{ t('user.posts.hidden') }}</option>
          </select>
        </div>
      </div>
    </GlassCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!comments.length" class="text-center py-12">
      <GlassCard class="p-12">
        <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquareIcon class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ t('user.comments.empty') }}</h3>
        <div class="flex justify-center">
          <NuxtLink :to="localePath('/')" class="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
            {{ t('common.browse') }} →
          </NuxtLink>
        </div>
      </GlassCard>
    </div>

    <!-- Comments List -->
    <div v-else class="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="group px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <!-- User info + time -->
            <div class="flex items-center gap-2 mb-1">
              <CommentUserInfo
                :comment="comment"
                :show-status-badge="true"
              />
              <span class="text-xs text-gray-400">·</span>
              <span class="text-xs text-gray-500 whitespace-nowrap">
                {{ formatDate(comment.created_at) }}
              </span>
              <span v-if="comment.updated_at && comment.updated_at !== comment.created_at" class="text-xs text-gray-400">
                · {{ t('common.edited') }}
              </span>
            </div>

            <!-- Edit form -->
            <div v-if="editingComment?.id === comment.id" class="mt-2 space-y-3">
              <GlassTextarea
                v-model="editForm.content"
                :error="editErrors.content"
                :rows="3"
                class="w-full"
                :placeholder="t('user.comments.edit_placeholder')"
              />
              <div class="flex gap-2 justify-end">
                <GlassButton
                  variant="secondary"
                  class="text-sm px-3 py-1"
                  @click="cancelEdit"
                >
                  {{ t('common.cancel') }}
                </GlassButton>
                <GlassButton
                  :loading="editing"
                  class="text-sm px-3 py-1"
                  @click="saveEdit"
                >
                  {{ t('common.save') }}
                </GlassButton>
              </div>
            </div>

            <!-- Comment content -->
            <p v-else class="text-gray-700 text-sm leading-relaxed line-clamp-3 mt-1">{{ comment.content }}</p>

            <!-- Source post link (inline) -->
            <NuxtLink
              :to="localePath(`/posts/${comment.post_id}`)"
              class="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 mt-2 transition-colors"
            >
              <ExternalLinkIcon class="w-3 h-3" />
              {{ t('user.comments.source') }}
            </NuxtLink>
          </div>

          <!-- Actions (always visible on mobile) -->
          <div class="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <GlassButton
              v-if="canEdit(comment)"
              variant="secondary"
              class="!p-1.5"
              :title="t('user.comments.edit')"
              @click="startEdit(comment)"
            >
              <EditIcon class="w-3.5 h-3.5" />
            </GlassButton>

            <GlassButton
              variant="secondary"
              class="!p-1.5 !text-red-600 hover:!bg-red-50"
              :title="t('common.delete')"
              @click="confirmDelete(comment)"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
            </GlassButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div
      v-if="commentsData && commentsData.page * commentsData.page_size < commentsData.total"
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
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import {
  MessageSquareIcon,
  ExternalLinkIcon,
  EditIcon,
  Trash2Icon
} from 'lucide-vue-next'
import type { CommentDto, Pagination, CommentForm } from '~/types'
import GlassCard from "~/components/ui/GlassCard.vue";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import GlassButton from "~/components/ui/GlassButton.vue";
import GlassTextarea from "~/components/ui/GlassTextarea.vue";

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: { k: 'user.myCommentsTitle' },
})

// Stores
const auth = useAuthStore()
const toast = useToast()

// State
const comments = ref<CommentDto[]>([])
const commentsData = ref<Pagination<CommentDto> | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const editing = ref(false)
const deleting = ref(false)

const filters = reactive({
  status: ''
})

const editingComment = ref<CommentDto | null>(null)
const editForm = reactive<CommentForm>({
  content: ''
})
const editErrors = ref<Partial<CommentForm>>({})

// Computed
const visibleCount = computed(() => {
  return comments.value.filter(comment => comment.status === 0).length
})

const hiddenCount = computed(() => {
  return comments.value.filter(comment => comment.status === 1).length
})

// Methods
const loadComments = async (page = 1, reset = false) => {
  if (page === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const api = useNuxtApp().$api
    const params: any = {
      page,
      page_size: 20
    }
    
    if (filters.status) {
      params.status = parseInt(filters.status)
    }

    const data = await api.getMyComments(params)
    
    if (reset || page === 1) {
      comments.value = data.items
    } else {
      comments.value.push(...data.items)
    }
    
    commentsData.value = data
  } catch (error: any) {
    toast.error(t('error.messages.unknown'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (commentsData.value) {
    loadComments(commentsData.value.page + 1)
  }
}

const applyFilters = () => {
  loadComments(1, true)
}

const refresh = () => {
  loadComments(1, true)
}

const canEdit = (comment: CommentDto) => {
  if (!comment.created_at) return false
  const createdAt = new Date(comment.created_at)
  const now = new Date()
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
  return diffMinutes <= 15 || auth.hasPerm('MANAGE_POSTS')
}

const startEdit = (comment: CommentDto) => {
  editingComment.value = comment
  editForm.content = comment.content
  editErrors.value = {}
}

const cancelEdit = () => {
  editingComment.value = null
  editForm.content = ''
  editErrors.value = {}
}

const saveEdit = async () => {
  if (!editingComment.value) return
  
  editErrors.value = {}
  // 长度限制：500 个字符
  if (editForm.content && editForm.content.length > 500) {
    editErrors.value.content = t('comment.commentOversize')
    toast.error(t('comment.commentOversize'))
    return
  }
  
  if (!editForm.content.trim()) {
    editErrors.value.content = t('posts.publish.cantEmpty')
    return
  }
  
  editing.value = true
  try {
    const api = useNuxtApp().$api
    const updatedComment = await api.updateComment(editingComment.value.id, editForm)
    
    // Update local comment
    const index = comments.value.findIndex(c => c.id === editingComment.value!.id)
    if (index >= 0) {
      comments.value[index] = { ...comments.value[index], ...updatedComment }
    }
    
    toast.success(t('common.success'))
    cancelEdit()
  } catch (error: any) {
    toast.error(t('error.messages.unknown'))
  } finally {
    editing.value = false
  }
}

const confirmDelete = async (comment: CommentDto) => {
  const { confirm } = useAdminDialog()
  const confirmed = await confirm({
    title: t('user.posts.confirmDeletion'),
    message: t('user.comments.delete_description'),
    confirmText: t('user.posts.confirmDeletion'),
    cancelText: t('common.cancel')
  })

  if (!confirmed) return

  deleting.value = true
  try {
    const api = useNuxtApp().$api
    await api.deleteComment(comment.id)

    const index = comments.value.findIndex(c => c.id === comment.id)
    if (index >= 0) {
      comments.value[index].status = 1
    }

    if (commentsData.value) {
      commentsData.value.total -= 1
    }

    toast.success(t('common.success'))
  } catch (error) {
    toast.error(t('error.messages.unknown'))
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// Initialize
onMounted(() => {
  loadComments()
})

</script>
