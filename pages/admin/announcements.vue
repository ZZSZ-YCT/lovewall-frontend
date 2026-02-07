<template>
  <div class="w-full space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">公告管理</h1>
      <p class="text-gray-600 mt-2">创建、编辑和管理按页面路径显示的公告</p>
    </div>

    <!-- Controls -->
    <GlassCard class="p-4">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <select
            v-model="filters.is_active"
            class="input px-3 py-2"
            @change="applyFilters"
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已停用</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <GlassButton
            @click="openCreateModal"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            新建公告
          </GlassButton>

          <GlassButton
            :loading="loading"
            variant="secondary"
            @click="refresh"
          >
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            刷新
          </GlassButton>
        </div>
      </div>
    </GlassCard>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">{{ announcements.length }}</div>
        <div class="text-sm text-gray-600">总公告数</div>
      </GlassCard>

      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{{ activeCount }}</div>
        <div class="text-sm text-gray-600">已启用</div>
      </GlassCard>

      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-gray-600 mb-1">{{ inactiveCount }}</div>
        <div class="text-sm text-gray-600">已停用</div>
      </GlassCard>
    </div>

    <!-- Announcements List -->
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!displayedAnnouncements.length" class="text-center py-12">
        <GlassCard class="p-12">
          <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MegaphoneIcon class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">暂无公告</h3>
          <p class="text-gray-600">点击"新建公告"来创建第一条公告</p>
        </GlassCard>
      </div>

      <!-- Announcements -->
      <div v-else>
        <div
          v-for="announcement in displayedAnnouncements"
          :key="announcement.id"
          class="group"
        >
          <GlassCard class="p-6 hover:shadow-md transition-all">
            <div class="flex justify-between items-start">
              <div class="flex-1 pr-4">
                <div class="flex items-center gap-3 mb-3">
                  <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{{ announcement.path }}</code>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': announcement.is_active,
                      'bg-gray-100 text-gray-800': !announcement.is_active
                    }"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ announcement.is_active ? '已启用' : '已停用' }}
                  </span>
                </div>

                <p class="text-gray-700 mb-4 line-clamp-3">{{ announcement.content.substring(0, 150) }}{{ announcement.content.length > 150 ? '...' : '' }}</p>

                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <CalendarIcon class="w-4 h-4" />
                    <span>创建：{{ formatDate(announcement.created_at) }}</span>
                  </div>
                  <div v-if="announcement.updated_at && announcement.updated_at !== announcement.created_at" class="flex items-center gap-1">
                    <EditIcon class="w-4 h-4" />
                    <span>更新：{{ formatDate(announcement.updated_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  title="预览公告"
                  @click="previewAnnouncement(announcement)"
                >
                  <EyeIcon class="w-4 h-4" />
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  title="编辑公告"
                  @click="editAnnouncement(announcement)"
                >
                  <EditIcon class="w-4 h-4" />
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  :title="announcement.is_active ? '停用公告' : '启用公告'"
                  @click="toggleStatus(announcement)"
                >
                  <component :is="announcement.is_active ? PauseIcon : PlayIcon" class="w-4 h-4" />
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  class="!p-2 !text-red-600 hover:!bg-red-50"
                  title="删除公告"
                  @click="confirmDelete(announcement)"
                >
                  <TrashIcon class="w-4 h-4" />
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="editModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/40" @click="closeEditModal" />
          <div
            class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">
                {{ editModal.announcement ? '编辑公告' : '新建公告' }}
              </h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeEditModal"
              >
                <XIcon class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 pb-6 space-y-6 overflow-y-auto">
              <form id="announcement-form" class="space-y-4" @submit.prevent="saveAnnouncement">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    页面路径 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.path"
                    type="text"
                    placeholder="/admin 或 / (首页)"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent font-mono"
                  >
                  <p class="mt-1 text-xs text-gray-500">
                    例如: /admin, /posts/123, / (首页)
                  </p>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700">
                      公告内容 <span class="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      class="text-sm text-pink-600 hover:text-pink-700 font-medium"
                      @click="showPreview"
                    >
                      预览效果
                    </button>
                  </div>
                  <textarea
                    v-model="form.content"
                    rows="12"
                    placeholder="支持 Markdown、LaTeX 和 HTML 标签...&#10;&#10;例如：&#10;# 标题&#10;**粗体** *斜体*&#10;&#10;LaTeX: $E = mc^2$&#10;&#10;HTML: <strong>粗体文本</strong>"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent font-mono text-sm resize-none"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    支持 Markdown 语法、LaTeX 数学公式（使用 $ 或 $$ 包裹）和 HTML 标签
                  </p>
                </div>

                <div>
                  <label class="flex items-center gap-2">
                    <input
                      v-model="form.is_active"
                      type="checkbox"
                      class="rounded"
                    >
                    <span class="text-sm font-medium text-gray-700">启用公告</span>
                  </label>
                </div>
              </form>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6 border-t border-gray-200 pt-4">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closeEditModal"
              >
                取消
              </button>
              <button
                type="submit"
                form="announcement-form"
                class="px-5 py-2.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="saving"
              >
                <span v-if="saving" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                <span>{{ editModal.announcement ? '保存' : '创建' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Preview Modal -->
    <AnnouncementModal
      :is-open="showPreviewModal"
      :content="form.content"
      @close="showPreviewModal = false"
      @dismiss="showPreviewModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  PlusIcon,
  RefreshCwIcon,
  MegaphoneIcon,
  EditIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  XIcon,
  EyeIcon
} from 'lucide-vue-next'
import GlassCard from "~/components/ui/GlassCard.vue"
import GlassButton from "~/components/ui/GlassButton.vue"
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue"
import AnnouncementModal from '~/components/AnnouncementModal.vue'
import { normalizeAnnouncementPath, isValidAnnouncementPath } from '~/utils/announcement'

import type { AnnouncementDto } from '~/types'

definePageMeta({
  middleware: ['admin', 'require-perms'],
  requiredPerms: ['MANAGE_ANNOUNCEMENTS'],
  ssr: false
})

const toast = useToast()
const api = useNuxtApp().$api

// State
const announcements = ref<AnnouncementDto[]>([])
const loading = ref(true)
const saving = ref(false)
const showPreviewModal = ref(false)

const filters = reactive({
  is_active: ''
})

const editModal = reactive({
  show: false,
  announcement: null as AnnouncementDto | null
})

const form = reactive({
  path: '',
  content: '',
  is_active: true
})

// Computed
const activeCount = computed(() => {
  return announcements.value.filter(a => a.is_active).length
})

const inactiveCount = computed(() => {
  return announcements.value.filter(a => !a.is_active).length
})

const displayedAnnouncements = computed(() => {
  if (filters.is_active === 'true') {
    return announcements.value.filter(a => a.is_active)
  } else if (filters.is_active === 'false') {
    return announcements.value.filter(a => !a.is_active)
  }
  return announcements.value
})

// Methods
const loadAnnouncements = async () => {
  loading.value = true
  try {
    const data = await api.listAnnouncementsAdmin()
    announcements.value = data
  } catch (error: any) {
    console.error('加载公告列表失败:', error)
    toast.error('加载公告列表失败')
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  loadAnnouncements()
}

const applyFilters = () => {
  // 使用计算属性 displayedAnnouncements 进行客户端过滤
}

const openCreateModal = () => {
  form.path = ''
  form.content = ''
  form.is_active = true
  editModal.announcement = null
  editModal.show = true
}

const editAnnouncement = (announcement: AnnouncementDto) => {
  form.path = announcement.path
  form.content = announcement.content
  form.is_active = announcement.is_active
  editModal.announcement = announcement
  editModal.show = true
}

const closeEditModal = () => {
  editModal.show = false
  editModal.announcement = null
}

const showPreview = () => {
  if (!form.content.trim()) {
    toast.warning('请先输入公告内容')
    return
  }
  showPreviewModal.value = true
}

const previewAnnouncement = (announcement: AnnouncementDto) => {
  form.path = announcement.path
  form.content = announcement.content
  form.is_active = announcement.is_active
  showPreviewModal.value = true
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (editModal.show) {
      closeEditModal()
    }
    if (showPreviewModal.value) {
      showPreviewModal.value = false
    }
  }
}

watch(() => editModal.show, (open) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      window.addEventListener('keydown', handleEscape)
    } else {
      window.removeEventListener('keydown', handleEscape)
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleEscape)
  }
})

const saveAnnouncement = async () => {
  // 验证路径格式
  if (!isValidAnnouncementPath(form.path)) {
    toast.error('路径必须以 / 开头')
    return
  }

  // 使用统一的路径规范化方法
  const normalizedPath = normalizeAnnouncementPath(form.path)

  saving.value = true
  try {
    const payload = {
      path: normalizedPath,
      content: form.content,
      is_active: form.is_active
    }

    if (editModal.announcement) {
      await api.updateAnnouncement(editModal.announcement.id, payload)
      toast.success('公告已更新')
    } else {
      await api.createAnnouncement(payload)
      toast.success('公告已创建')
    }

    closeEditModal()
    await loadAnnouncements()
  } catch (error: any) {
    console.error('保存公告失败:', error)
    toast.error(error?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (announcement: AnnouncementDto) => {
  const { confirm } = useAdminDialog()
  const nextState = !announcement.is_active
  const confirmed = await confirm({
    title: nextState ? '确认启用' : '确认停用',
    message: `确定要${nextState ? '启用' : '停用'}路径 "${announcement.path}" 的公告吗?`,
    confirmText: nextState ? '确认启用' : '确认停用',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    await api.updateAnnouncement(announcement.id, {
      path: announcement.path,
      content: announcement.content,
      is_active: nextState
    })

    await loadAnnouncements()
    toast.success(nextState ? '公告已启用' : '公告已停用')
  } catch (error) {
    toast.error('操作失败')
  }
}

const confirmDelete = async (announcement: AnnouncementDto) => {
  const { confirm } = useAdminDialog()
  const confirmed = await confirm({
    title: '确认删除',
    message: `确定要删除路径 "${announcement.path}" 的公告吗？删除后无法恢复。`,
    confirmText: '确认删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    await api.deleteAnnouncement(announcement.id)
    announcements.value = announcements.value.filter(a => a.id !== announcement.id)
    toast.success('公告已删除')
  } catch (error) {
    toast.error('删除失败')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
onMounted(() => {
  loadAnnouncements()
})

// SEO
useHead({
  title: '公告管理 - 郑州四中表白墙',
  meta: [
    { name: 'description', content: '创建、编辑和管理按页面路径显示的公告' }
  ]
})
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-dialog-in {
  animation: dialog-in 0.2s ease-out;
}
</style>



