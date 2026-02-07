<template>
  <!-- 遮罩层 -->
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/40" @click="handleCancel" />

        <!-- 对话框内容 -->
        <div
          class="relative bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-dialog-in"
          @click.stop
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between p-6 pb-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              @click="handleCancel"
            >
              <svg class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="px-6 pb-4">
            <!-- 验证码组件 -->
            <CaptchaWidget
              ref="captchaWidget"
              @ready="onCaptchaReady"
              @error="onCaptchaError"
              @reset="onCaptchaReset"
            />

            <!-- 错误提示 -->
            <div v-if="errorMsg" class="mt-3 p-3 rounded-lg bg-red-50/50 border border-red-200">
              <p class="text-sm text-red-600">{{ errorMsg }}</p>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="flex gap-3 justify-end px-6 pb-6">
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="!captchaReady"
              class="px-5 py-2.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              @click="handleConfirm"
            >
              确认验证
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import CaptchaWidget from '~/components/security/CaptchaWidget.vue'

interface CaptchaResult {
  captcha_id: string
  captcha_data: {
    dots?: Array<{ x: number; y: number }>
    angle?: number
  }
}

const { state, verified, cancel } = useCaptchaDialog()

const captchaWidget = ref<InstanceType<typeof CaptchaWidget>>()
const captchaReady = ref(false)
const captchaResult = ref<CaptchaResult | null>(null)
const errorMsg = ref('')

const isOpen = computed(() => state.value.isOpen)
const title = computed(() => state.value.title)

// 监听弹窗打开,自动刷新验证码
watch(isOpen, (open) => {
  if (open) {
    // 重置状态
    captchaReady.value = false
    captchaResult.value = null
    errorMsg.value = ''

    // 验证码组件会在 onMounted 时自动加载,这里不需要手动调用
  }
})

const onCaptchaReady = (result: CaptchaResult) => {
  captchaReady.value = true
  captchaResult.value = result
  errorMsg.value = ''
}

const onCaptchaError = (message: string) => {
  captchaReady.value = false
  captchaResult.value = null
  errorMsg.value = message
}

const onCaptchaReset = () => {
  captchaReady.value = false
  captchaResult.value = null
  errorMsg.value = ''
}

const handleConfirm = () => {
  if (captchaReady.value && captchaResult.value) {
    verified(captchaResult.value)
  }
}

const handleCancel = () => {
  cancel()
}

// ESC 键关闭
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    handleCancel()
  }
}

// 阻止背景滚动 + ESC 键监听
watch(isOpen, (open) => {
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
