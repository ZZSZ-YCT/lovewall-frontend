<template>
  <div ref="shareButtonRef" class="relative">
    <!-- 主分享按钮 -->
    <button
      :disabled="loading"
      class="inline-flex items-center gap-1.5 text-gray-600 hover:text-brand-600 transition-colors font-medium"
      :class="[!hydrated ? 'text-sm' : (size === 'sm' ? 'text-xs' : 'text-sm')]"
      @click="handleMainShare"
      :aria-label="shareText"
    >
      <LoaderIcon v-if="loading" class="w-4 h-4 animate-spin" />
      <ShareIcon v-else class="w-4 h-4" />
      <span v-if="showText">{{ shareText }}</span>
    </button>

    <!-- 分享选项下拉菜单（仅客户端渲染） -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="showOptions && isOptionsOpen"
          :style="dropdownStyle"
          class="fixed w-48 bg-white rounded-lg border border-gray-200 shadow-lg p-2 z-50"
          @click.stop
        >
        <div class="space-y-1">
          <!-- 原生分享 -->
          <button
            v-if="canShare"
            class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            @click="shareNative"
          >
            <ShareIcon class="w-4 h-4" />
            <span>系统分享</span>
          </button>

          <!-- 复制链接 -->
          <button
            class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            @click="copyLink"
          >
            <CopyIcon class="w-4 h-4" />
            <span>复制链接</span>
          </button>

          <div class="border-t border-gray-200 my-2" />

          <!-- 平台分享 -->
          <button
            v-for="platform in availablePlatforms"
            :key="platform.key"
            class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            @click="shareToPlatform(platform.key)"
          >
            <component :is="getPlatformIcon(platform.key)" class="w-4 h-4" />
            <span>{{ platform.name }}</span>
          </button>
        </div>
        </div>
      </Teleport>

      <!-- 点击外部关闭菜单 -->
      <Teleport to="body">
        <div
          v-if="isOptionsOpen"
          class="fixed inset-0 z-40"
          @click="isOptionsOpen = false"
        />
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import {
  LoaderIcon,
  ShareIcon,
  CopyIcon,
  SendIcon,
  MessageCircleIcon,
  TwitterIcon,
  FacebookIcon
} from 'lucide-vue-next'

interface Props {
  data: { title: string; text: string; url: string; image?: string }
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showOptions?: boolean
  mode?: 'smart' | 'native' | 'manual'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'md',
  showText: true,
  showOptions: false,
  mode: 'smart'
})

const hydrated = useHydrated()

const loading = ref(false)
const isOptionsOpen = ref(false)
const shareButtonRef = ref<HTMLElement>()

const { canShare, share, smartShare, copyToClipboard, getPlatformShareUrl } = useShare()

const dropdownStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const updateDropdownPosition = () => {
  if (!import.meta.client || !shareButtonRef.value) return
  const rect = shareButtonRef.value.getBoundingClientRect()
  const menuWidth = 192
  const left = Math.min(Math.max(rect.left, 8), window.innerWidth - menuWidth - 8)
  dropdownStyle.value = { top: `${rect.bottom + 8}px`, left: `${left}px` }
}

watch(isOptionsOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    nextTick(() => updateDropdownPosition())
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
  } else {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})

const shareText = computed(() => t('common.share'))

// 图标映射
const getPlatformIcon = (key: string) => {
  const map: Record<string, any> = {
    twitter: TwitterIcon,
    facebook: FacebookIcon,
    telegram: SendIcon,
    whatsapp: MessageCircleIcon
  }
  return map[key] || ShareIcon
}

const availablePlatforms = computed(() => [
  { key: 'twitter', name: 'Twitter' },
  { key: 'facebook', name: 'Facebook' },
  { key: 'telegram', name: 'Telegram' },
  { key: 'whatsapp', name: 'WhatsApp' }
])

// 主分享逻辑
const handleMainShare = async () => {
  if (props.showOptions) {
    isOptionsOpen.value = !isOptionsOpen.value
    return
  }

  loading.value = true
  try {
    if (props.mode === 'smart') {
      await smartShare(props.data)
    } else if (props.mode === 'native' && canShare.value) {
      await share(props.data, { preferredMethod: 'native' })
    } else {
      await share(props.data, { preferredMethod: 'copy' })
    }
  } catch (err) {
    console.error('分享失败:', err)
    const text = `${props.data.title}\n${props.data.text}\n${props.data.url}`
    await copyToClipboard?.(text)
    useToast().info('分享不可用，链接已复制')
  } finally {
    loading.value = false
  }
}

const shareNative = async () => {
  loading.value = true
  try {
    await share(props.data, { preferredMethod: 'native' })
  } finally {
    loading.value = false
    isOptionsOpen.value = false
  }
}

const copyLink = async () => {
  const ok = await copyToClipboard(props.data.url)
  useToast()[ok ? 'success' : 'error'](ok ? '链接已复制' : '复制失败')
  isOptionsOpen.value = false
}

const shareToPlatform = (key: string) => {
  const url = getPlatformShareUrl(props.data, key)
  if (url) window.open(url, '_blank', 'width=600,height=400')
  isOptionsOpen.value = false
}

// 点击外部关闭菜单
onClickOutside(shareButtonRef, () => (isOptionsOpen.value = false))
</script>
