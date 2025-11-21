<template>
  <div
    v-if="displayStatus !== null"
    class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors"
    :class="displayStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
    :title="statusText"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="displayStatus ? 'bg-green-500' : 'bg-gray-400'"
    />
    <span>{{ displayStatus ? t('user.online') : t('user.offline') }}</span>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import { computed } from 'vue'

const props = withDefaults(defineProps<{
  userId?: string
  isOnline?: boolean
  lastHeartbeat?: string | null
}>(), {
  isOnline: false,
  lastHeartbeat: null
})

// ✅ 修复：移除轮询逻辑，直接使用传入的props
// 在线状态数据应该由父组件（如帖子详情、评论列表）从API响应中传入
// 避免每个OnlineBadge实例都单独轮询，减少不必要的API请求
const displayStatus = computed(() => {
  // 如果没有提供在线状态信息，不显示徽章
  if (props.isOnline === undefined && !props.lastHeartbeat) {
    return null
  }
  return props.isOnline ?? false
})

const statusText = computed(() => {
  if (displayStatus.value === null) return ''
  if (displayStatus.value) return t('user.online')
  if (props.lastHeartbeat) {
    return t('user.centers.lastLogin') + ` ${formatTime(props.lastHeartbeat)}`
  }
  return t('user.offline')
})

const formatTime = (isoTime: string): string => {
  const date = new Date(isoTime)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (Number.isNaN(diffMs) || diffMs < 0) return t('time.just')

  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return t('time.just')
  if (diffMinutes < 60) return t('time.beforeMinutes', { minutes: diffMinutes })
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return t('time.beforeHours', { hours: diffHours })
  const diffDays = Math.floor(diffHours / 24)
  return t('time.beforeDays', { days: diffDays })
}
</script>
