<template>
  <div class="captcha-widget">
    <!-- Loading State -->
    <div v-if="loading" class="captcha-loading">
      <LoadingSpinner size="md" />
      <p class="text-sm text-gray-600 mt-2">{{ t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="captcha-error">
      <p class="text-sm text-red-600 mb-2">{{ error }}</p>
      <button @click="refresh" class="text-sm text-brand-600 hover:underline">
        {{ t('common.refresh') }}
      </button>
    </div>

    <!-- Captcha Content -->
    <div v-else-if="captchaData" class="captcha-content">
      <!-- Click Type -->
      <div v-if="captchaData.type === 'click'" class="click-captcha">
        <div class="thumb-hint">
          <span class="text-sm font-medium text-gray-700">{{ t('captcha.click') }}</span>
          <img :src="thumbImageSrc" alt="Hints" class="h-8" />
        </div>

        <div class="master-image-wrapper" @click="handleClick">
          <img
            ref="masterImg"
            :src="masterImageSrc"
            alt="Captcha"
          />
          <div
            v-for="(dot, index) in dots"
            :key="index"
            class="click-marker"
            :style="{ left: dot.x + 'px', top: dot.y + 'px' }"
          >
            {{ index + 1 }}
          </div>
        </div>
      </div>

      <!-- Rotate Type -->
      <div v-else-if="captchaData.type === 'rotate'" class="rotate-captcha">
        <div class="rotate-images">
          <div class="reference-image">
            <img :src="masterImageSrc" alt="Reference" />
            <p class="text-xs text-gray-600 mt-1">{{ t('captcha.reference') }}</p>
          </div>
          <div class="rotate-target">
            <div
              class="rotate-image-wrapper"
              @wheel.prevent="handleWheel"
              @mousedown="startRotate"
              @touchstart="startRotate"
            >
              <img
                :src="thumbImageSrc"
                alt="Rorate"
                :style="{ transform: `rotate(${rotateAngle}deg)` }"
              />
            </div>
            <p class="text-xs text-gray-600 mt-1">
              {{ t('captcha.rotate') }} ({{ rotateAngle }}°)
            </p>
          </div>
        </div>
        <div class="rotate-controls">
          <button @click="rotateStep(-15)" class="control-btn">
            <ChevronLeftIcon class="w-4 h-4" />
          </button>
          <button @click="rotateStep(15)" class="control-btn">
            <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="captcha-actions">
        <button @click="clearInput" class="action-btn">
          <RotateCcwIcon class="w-4 h-4" />
          {{ t('common.reset') }}
        </button>
        <button @click="refresh" class="action-btn">
          <RefreshCwIcon class="w-4 h-4" />
          {{ t('common.refresh') }}
        </button>
      </div>

      <!-- Timer -->
      <div v-if="remainingTime > 0" class="captcha-timer">
        <span class="text-xs text-gray-500">
          {{ remainingTime }}s
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import { RefreshCwIcon, RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import type { CaptchaData } from '~/composables/useCaptcha'

interface CaptchaResult {
  captcha_id: string
  captcha_data: {
    dots?: Array<{ x: number; y: number }>
    x?: number
    angle?: number
  }
}

const emit = defineEmits<{
  ready: [result: CaptchaResult]
  error: [error: string]
  reset: []  // 验证码被重置/刷新时通知父组件
}>()

const { fetchCaptcha } = useCaptcha()

// State
const captchaData = ref<CaptchaData | null>(null)
const loading = ref(false)
const error = ref('')
const remainingTime = ref(60)

// Click type
const dots = ref<Array<{ x: number; y: number }>>([])
const masterImg = ref<HTMLImageElement>()

// Rotate type
const rotateAngle = ref(0)

// 计算属性: 为 base64 图片添加 data URI 前缀
const masterImageSrc = computed(() => {
  if (!captchaData.value?.master_image) return ''
  return `data:image/png;base64,${captchaData.value.master_image}`
})

const thumbImageSrc = computed(() => {
  if (!captchaData.value?.thumb_image) return ''
  return `data:image/png;base64,${captchaData.value.thumb_image}`
})

let timerInterval: ReturnType<typeof setInterval> | null = null
let loadRequestId = 0  // 请求ID,用于防止重复请求覆盖

// 存储活动的事件处理器,用于清理
const activeHandlers: Array<{
  target: HTMLElement | Document
  event: string
  handler: EventListener
}> = []

// Load captcha
const loadCaptcha = async () => {
  loading.value = true
  error.value = ''

  // 清除旧定时器,避免冲突
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // 生成新的请求ID,防止旧请求覆盖新请求
  const currentRequestId = ++loadRequestId

  try {
    const result = await fetchCaptcha()

    // 只有最新的请求才更新状态
    if (currentRequestId === loadRequestId) {
      captchaData.value = result
      clearInput()
      startTimer()
    }
  } catch (e: any) {
    // 只有最新的请求才显示错误
    if (currentRequestId === loadRequestId) {
      error.value = e.message || t('error.messages.unknown')
      emit('error', error.value)
    }
  } finally {
    if (currentRequestId === loadRequestId) {
      loading.value = false
    }
  }
}

// Start countdown timer
const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  remainingTime.value = 60
  timerInterval = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timerInterval!)
      error.value = t('time.expired')
      emit('error', error.value)
    }
  }, 1000)
}

// Click handler
const handleClick = (event: MouseEvent) => {
  if (!masterImg.value || !captchaData.value) return

  const rect = masterImg.value.getBoundingClientRect()
  // 计算相对于图片的归一化坐标(0-1)
  const relativeX = (event.clientX - rect.left) / rect.width
  const relativeY = (event.clientY - rect.top) / rect.height

  // 存储归一化坐标,同时保存渲染尺寸供后端参考
  const x = Math.round(relativeX * rect.width)
  const y = Math.round(relativeY * rect.height)

  dots.value.push({ x, y })
  emitResult()
}

// Rotate handlers
const handleWheel = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? 15 : -15
  rotateAngle.value = (rotateAngle.value + delta + 360) % 360
  emitResult()
}

const startRotate = (event: MouseEvent | TouchEvent) => {
  // 阻止默认行为,防止移动端页面滚动
  if (event.cancelable) {
    event.preventDefault()
  }

  const startY = 'touches' in event && event.touches.length > 0 ? event.touches[0]!.clientY : (event as MouseEvent).clientY
  let lastY = startY

  const moveHandler = (e: MouseEvent | TouchEvent) => {
    // 阻止页面滚动
    if (e.cancelable) {
      e.preventDefault()
    }

    const currentY = 'touches' in e && e.touches.length > 0 ? e.touches[0]!.clientY : (e as MouseEvent).clientY
    const deltaY = lastY - currentY
    rotateAngle.value = (rotateAngle.value + deltaY + 360) % 360
    lastY = currentY
    emitResult()
  }

  const endHandler = () => {
    document.removeEventListener('mousemove', moveHandler as EventListener)
    document.removeEventListener('mouseup', endHandler as EventListener)
    document.removeEventListener('touchmove', moveHandler as EventListener, { passive: false } as any)
    document.removeEventListener('touchend', endHandler as EventListener)
    // 从活动处理器列表中移除
    activeHandlers.splice(0, activeHandlers.length, ...activeHandlers.filter(h =>
      h.handler !== moveHandler && h.handler !== endHandler
    ))
  }

  document.addEventListener('mousemove', moveHandler as EventListener)
  document.addEventListener('mouseup', endHandler as EventListener)
  // touchmove 需要 passive: false 才能 preventDefault
  document.addEventListener('touchmove', moveHandler as EventListener, { passive: false } as any)
  document.addEventListener('touchend', endHandler as EventListener)

  // 添加到活动处理器列表
  activeHandlers.push(
    { target: document, event: 'mousemove', handler: moveHandler as EventListener },
    { target: document, event: 'mouseup', handler: endHandler as EventListener },
    { target: document, event: 'touchmove', handler: moveHandler as EventListener },
    { target: document, event: 'touchend', handler: endHandler as EventListener }
  )
}

const rotateStep = (step: number) => {
  rotateAngle.value = (rotateAngle.value + step + 360) % 360
  emitResult()
}

// Clear input
const clearInput = () => {
  dots.value = []
  rotateAngle.value = 0
  // 通知父组件验证已重置
  emit('reset')
}

// Refresh
const refresh = () => {
  // 通知父组件验证已重置
  emit('reset')
  loadCaptcha()
}

// Emit result
const emitResult = () => {
  if (!captchaData.value) return

  const result: CaptchaResult = {
    captcha_id: captchaData.value.captcha_id,
    captcha_data: {}
  }

  if (captchaData.value.type === 'click') {
    result.captcha_data.dots = dots.value
  } else if (captchaData.value.type === 'rotate') {
    result.captcha_data.angle = Math.round(rotateAngle.value)
  }

  emit('ready', result)
}

// Cleanup
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  // 清理所有活动的事件监听器,防止内存泄漏
  activeHandlers.forEach(({ target, event, handler }) => {
    target.removeEventListener(event, handler)
  })
  activeHandlers.length = 0
})

// Initialize
onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.captcha-widget {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.captcha-loading,
.captcha-error {
  @apply flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg;
}

/* Click Captcha */
.click-captcha {
  @apply space-y-3;
}

.click-captcha .master-image-wrapper {
  cursor: crosshair;
}

.thumb-hint {
  @apply flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg;
}

.master-image-wrapper {
  @apply relative w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100;
  /* 根据图片内容自适应高度,避免拉伸 */
}

.master-image-wrapper img {
  @apply w-full h-auto;
  display: block;
}

.click-marker {
  @apply absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none;
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% { transform: translate(-50%, -50%) scale(0); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* Rotate Captcha */
.rotate-captcha {
  @apply space-y-3;
}

.rotate-images {
  @apply grid grid-cols-2 gap-4;
}

.reference-image,
.rotate-target {
  @apply flex flex-col items-center;
}

.rotate-image-wrapper {
  @apply w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing;
}

.rotate-image-wrapper img {
  @apply w-full h-full object-cover transition-transform duration-100;
}

.rotate-controls {
  @apply flex gap-2 justify-center;
}

.control-btn {
  @apply p-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors;
}

/* Actions */
.captcha-actions {
  @apply flex gap-2 mt-3;
}

.action-btn {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors;
}

.captcha-timer {
  @apply mt-2 text-center;
}
</style>
