<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('user.myTags') }}</h1>
      <p class="text-gray-600 mt-2">{{ t('user.tags.description') }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <GlassCard class="p-6 text-center">
        <div class="text-2xl font-bold text-purple-600 mb-1">{{ userTags.length }}</div>
        <div class="text-sm text-gray-600">{{ t('user.tags.owns') }}</div>
      </GlassCard>
      
      <GlassCard class="p-6 text-center">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <div class="text-lg font-semibold text-gray-700">{{ t('common.current') }}</div>
          <TagBadge
            v-if="activeTag"
            :title="activeTag.tag?.title || ''"
            :background="activeTag.tag?.background_color || '#6b7280'"
            :text="activeTag.tag?.text_color || '#ffffff'"
          />
          <span v-else class="text-gray-500">{{ t('user.tags.notSet') }}</span>
          <span
v-if="activeStatus && activeStatus.has_active" class="ml-2 px-2 py-0.5 text-xs rounded-full"
            :class="activeStatus.current_tag_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ activeStatus.current_tag_enabled ? t('common.enabled') : t('common.disabled') }}
          </span>
        </div>
      </GlassCard>
    </div>

    <!-- Redeem Section -->
    <GlassCard class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">{{ t('user.tags.redeem.index') }}</h2>
          <p class="text-sm text-gray-600 mt-1">{{ t('user.tags.redeem.description') }}</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button
              class="glass-button-secondary px-6 py-3 inline-flex items-center gap-2"
              @click="openRedeemModal"
          >
            <TagIcon class="w-5 h-5" />
            <span>{{ t('user.tags.redeem.index') }}</span>
          </button>
        </div>
      </div>
      <!-- Redeem History (if any) -->
      <div v-if="recentlyRedeemed.length" class="mt-6 pt-4 border-t border-white/20">
        <h3 class="text-sm font-medium text-gray-700 mb-3">{{t('user.tags.redeem.recently')}}</h3>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="tag in recentlyRedeemed"
            :key="tag.user_tag_id"
            class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10"
          >
            <TagBadge
              :title="tag.tag?.title || ''"
              :background="tag.tag?.background_color || '#6b7280'"
              :text="tag.tag?.text_color || '#ffffff'"
            />
            <span class="text-xs text-gray-500">
              {{ formatDate(tag.obtained_at) }}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!userTags.length" class="text-center py-12">
      <GlassCard class="p-12">
        <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <TagIcon class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ t('user.tags.empty') }}</h3>
        <p class="text-gray-600 mb-6">{{ t('user.tags.getOne') }}</p>
      </GlassCard>
    </div>

    <!-- Tags List -->
    <div v-else class="space-y-4">
      <div class="border-b border-white/20 pb-2 mb-4">
        <h2 class="text-lg font-semibold text-gray-800">{{ t('user.myTags') }}</h2>
      </div>

      <div class="grid gap-4">
        <div
          v-for="userTag in userTags"
          :key="userTag.user_tag_id"
          class="group"
        >
          <GlassCard class="p-6 hover:shadow-glow-lg transition-all">
            <div class="flex items-center justify-between">
              <!-- Tag details first, preview on the right; avoid wrapping buttons -->
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="min-w-0">
                  <h3 class="font-semibold text-gray-800">
                    {{ userTag.tag?.title || `Tag-${userTag.tag?.id?.slice(0, 8)}` }}
                  </h3>
                  <div class="text-sm text-gray-600 space-y-1">
                    <p>{{ t('user.tags.acquireTime', { time: formatDate(userTag.obtained_at) }) }}</p>
                    <div class="flex items-center gap-2">
                      <span class="flex items-center gap-1">
                        <div
                          class="w-3 h-3 rounded-full"
                          :class="userTag.is_active ? 'bg-green-500' : 'bg-gray-400'"
                        />
                        {{ userTag.is_active ? t('common.current') : t('common.disabled') }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="shrink-0">
                  <TagBadge
                    :title="userTag.tag?.title || ''"
                    :background="userTag.tag?.background_color || '#6b7280'"
                    :text="userTag.tag?.text_color || '#ffffff'"
                  />
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 shrink-0 whitespace-nowrap items-center">
                <button
                  v-if="!userTag.is_active"
                  :disabled="activating === userTag.user_tag_id || !userTag.tag?.is_active"
                  :title="userTag.tag?.is_active ? t('user.tags.useThis') : t('common.disabled')"
                  class="glass-button-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="activateTag(userTag)"
                >
                  <span>{{ t('user.tags.useThis') }}</span>
                </button>
                
                <div v-else class="flex items-center gap-2">
                  <div class="flex items-center gap-2 px-4 py-2 bg-green-100/50 text-green-800 rounded-lg text-sm">
                    <CheckCircleIcon class="w-4 h-4" />
                    {{ t('common.current') }}
                  </div>
                  <!-- <GlassButton
                    @click="deactivateTag(userTag)"
                    :loading="deactivating === userTag.user_tag_id"
                    class="text-sm px-3 py-2 glass-button-secondary"
                    title="取消激活，回到无标签状态"
                  >
                    取消
                  </GlassButton> -->
                </div>
              </div>
            </div>

            <!-- Tag Description (if available) -->
            <div v-if="getTagDescription(userTag)" class="mt-4 pt-4 border-t border-white/10">
              <p class="text-sm text-gray-600">{{ getTagDescription(userTag) }}</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import { TagIcon, CheckCircleIcon } from 'lucide-vue-next'
import TagBadge from '~/components/ui/TagBadge.vue'
import type { UserTagDto, RedeemResponse, MyActiveTagStatusResponse } from '~/types'
import GlassCard from "~/components/ui/GlassCard.vue";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";

definePageMeta({
  middleware: 'auth',
  ssr: false,
  title: { k: 'user.myTagsTitle' }
})

// Stores
const auth = useAuthStore()
const toast = useToast()
const adminDialog = useAdminDialog()

// State
const userTags = ref<UserTagDto[]>([])
const loading = ref(true)
const activating = ref<string | null>(null)
const deactivating = ref<string | null>(null)

// Active tag status from new API
const activeStatus = ref<MyActiveTagStatusResponse | null>(null)

// Grid-based alignment handles longest label automatically; no JS measuring needed

// Computed
const activeTag = computed(() => {
  return userTags.value.find(tag => tag.is_active) || null
})

const recentlyRedeemed = computed(() => {
  return userTags.value
    .filter(tag => {
      const obtainedAt = new Date(tag.obtained_at)
      const now = new Date()
      const diffHours = (now.getTime() - obtainedAt.getTime()) / (1000 * 60 * 60)
      return diffHours <= 24 // Show tags obtained in last 24 hours
    })
    .sort((a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime())
    .slice(0, 3)
})

// Helper function to format redeem code
const formatRedeemCodeString = (code: string): string => {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32)

  // Format with dashes: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  let formatted = ''
  for (let i = 0; i < cleanCode.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += '-'
    }
    formatted += cleanCode[i]
  }
  return formatted
}

// Methods
const openRedeemModal = async () => {
  const code = await adminDialog.prompt({
    title: t('user.tags.redeem.index'),
    message: t('user.tags.redeem.message'),
    inputLabel: t('user.tags.redeem.activateCode'),
    placeholder: t('user.tags.redeem.message'),
    confirmText: t('user.tags.redeem.index'),
    cancelText: t('common.cancel'),
    defaultValue: ''
  })

  if (!code) return

  const formattedCode = formatRedeemCodeString(code)
  await redeemCode(formattedCode)
}

const loadUserTags = async () => {
  loading.value = true
  try {
    const api = useNuxtApp().$api
    const response = await api.getMyTags(true) // 传入 all=true 获取所有标签
    userTags.value = response.items // 取出 items 数组
    // 同步查询当前活跃标签状态（如果存在）
    try {
      activeStatus.value = await api.getMyActiveTagStatus()
    } catch {}
  } catch (error: any) {
    console.error('Load tags error:', error)
    toast.error(t('error.messages.unknown'))
  } finally {
    loading.value = false
  }
}

const redeemCode = async (code: string) => {
  if (!code.trim()) {
    toast.error(t('user.tags.redeem.message'))
    return
  }

  // Basic format validation - 8 groups of 4 characters each
  const codePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  if (!codePattern.test(code.toUpperCase())) {
    toast.error(t('user.tags.redeem.wrongPattern'))
    return
  }

  try {
    const api = useNuxtApp().$api
    const result: RedeemResponse = await api.redeem({ code: code.toUpperCase() })

    // Merge into list (update if exists, else add)
    const newUserTag = result.user_tag
    const existingIdx = userTags.value.findIndex(t => t.user_tag_id === newUserTag.user_tag_id)
    if (existingIdx >= 0) {
      userTags.value[existingIdx] = newUserTag
    } else {
      userTags.value.push(newUserTag)
    }
    // Auto-activate new tag locally; deactivate others
    userTags.value.forEach(t => { t.is_active = (t.user_tag_id === newUserTag.user_tag_id) })

    // 刷新活动标签状态徽章
    try {
      const api = useNuxtApp().$api
      activeStatus.value = await api.getMyActiveTagStatus()
    } catch {}

    // Show success dialog
    const tagTitle = newUserTag.tag?.title || 'New Tag'
    await adminDialog.confirm({
      title: t('common.success'),
      message: t('user.tags.redeem.redeemed', { title: tagTitle }),
      confirmText: t('common.ok'),
      cancelText: ''
    })

    toast.success(t('user.tags.redeem.redeemed_short'))
  } catch (error: any) {
    toast.error(error.message || t('error.messages.unknown'))
  }
}

const activateTag = async (userTag: UserTagDto) => {
  activating.value = userTag.user_tag_id
  try {
    const api = useNuxtApp().$api
    // 禁止选择已被全局停用的标签
    if (!userTag.tag?.is_active) {
      toast.warning(t('user.tags.disabled'))
      return
    }
    await api.activateTag(userTag.tag?.id || '')
    
    // Update local state
    userTags.value.forEach(tag => {
      tag.is_active = tag.user_tag_id === userTag.user_tag_id
    })
    
    toast.success(t('user.tags.set', { title: userTag.tag?.title }))
    // 刷新活动标签状态徽章
    try {
      activeStatus.value = await api.getMyActiveTagStatus()
    } catch {}
  } catch (error: any) {
    console.error('Activate tag failed:', error)
    toast.error(t('error.messages.unknown'))
  } finally {
    activating.value = null
  }
}

const deactivateTag = async (userTag: UserTagDto) => {
  deactivating.value = userTag.user_tag_id
  try {
    const api = useNuxtApp().$api
    await api.deactivateTag(userTag.tag?.id || '')
    
    // Update local state - set all tags to inactive
    userTags.value.forEach(tag => {
      tag.is_active = false
    })
    
    toast.success(t('user.tags.unset'))
    // 刷新活动标签状态徽章
    try {
      activeStatus.value = await api.getMyActiveTagStatus()
    } catch {}
  } catch (error: any) {
    toast.error(t('error.messages.unknown'))
  } finally {
    deactivating.value = null
  }
}

const showAllTags = async () => {
  try {
    const api = useNuxtApp().$api
    const allTags = await api.listTags({ active: true })
    
    // 跳转到标签浏览页面或显示模态框
    // 这里我们简单地显示一个提示，你可以根据需求实现标签浏览功能
    toast.info(`当前共有 ${allTags.items.length} 个可用标签，可以通过兑换码获取`)
  } catch (error: any) {
    toast.error(t('error.messages.unknown'))
  }
}

const getTagDescription = (userTag: UserTagDto) => {
  // Since the API doesn't return tag description in userTag, we'll skip it for now
  return null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// Initialize
onMounted(() => {
  loadUserTags()
})

</script>
