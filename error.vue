<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md mx-auto">
      <GlassCard class="p-8">
        <div class="mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-6xl font-bold text-gray-800 mb-2">{{ error.statusCode }}</h1>
          <h2 class="text-xl font-semibold text-gray-700 mb-3">{{ getErrorTitle(error.statusCode) }}</h2>
          <p class="text-gray-600 leading-relaxed">{{ getErrorMessage(error.statusCode) }}</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <GlassButton class="flex-1" @click="handleError">
            {{ error.statusCode === 404 ? '返回首页' : '重试' }}
          </GlassButton>
          <GlassButton
            v-if="error.statusCode !== 404"
            variant="secondary"
            class="flex-1"
            @click="goHome"
          >
            返回首页
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import { AlertTriangleIcon } from 'lucide-vue-next'
import GlassCard from "~/components/ui/GlassCard.vue";
import GlassButton from "~/components/ui/GlassButton.vue";

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const getErrorTitle = (statusCode: number) => {
  switch (statusCode) {
    case 404: return t('error.titles.404')
    case 403: return t('error.titles.403')
    case 401: return t('error.titles.401')
    case 500: return t('error.titles.500')
    default: return t('error.titles.unknown')
  }
}

const getErrorMessage = (statusCode: number) => {
  switch (statusCode) {
    case 404: return t('error.messages.404')
    case 403: return t('error.messages.403')
    case 401: return t('error.messages.401')
    case 500: return t('error.messages.500')
    default: return t('error.messages.unknown')
  }
}

const handleError = () => {
  if (props.error.statusCode === 404) {
    goHome()
  } else {
    // Try to reload the page
    window.location.reload()
  }
}

const goHome = () => {
  navigateTo(localePath('/'))
}

// 设置页面标题（error.vue 不能使用 definePageMeta）
useHead({
  title: computed(() =>
    t('error.title', {
      code: props.error.statusCode,
      message: getErrorTitle(props.error.statusCode)
    })
  )
})
</script>
