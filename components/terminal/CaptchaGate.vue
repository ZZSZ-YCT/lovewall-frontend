<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center"
      @keydown.esc.prevent.stop="onEsc"
      @click.self="onBackdrop"
      tabindex="-1"
      ref="overlay"
      role="dialog" aria-modal="true"
    >
      <div class="w-full max-w-md mx-4 rounded-xl bg-neutral-900 text-neutral-100 shadow-2xl p-4 ring-1 ring-neutral-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold">{{ params.title || 'Verification' }}</h2>
          <button class="text-neutral-400 hover:text-neutral-200" @click="cancel()">✕</button>
        </div>

        <!-- Use new CaptchaWidget -->
        <CaptchaWidget
          @ready="onCaptchaReady"
          @error="onCaptchaError"
          @reset="onCaptchaReset"
        />

        <!-- Error message -->
        <div v-if="errorMsg" class="mt-3 p-2 rounded bg-red-900/50 border border-red-700">
          <p class="text-xs text-red-200">{{ errorMsg }}</p>
        </div>

        <!-- Confirm button -->
        <div class="mt-4 flex gap-2">
          <button
            @click="confirmVerification"
            :disabled="!captchaReady"
            class="flex-1 px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium text-sm transition-colors"
          >
            {{ captchaReady ? '确认验证' : '请完成验证' }}
          </button>
          <button
            @click="cancel()"
            class="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-medium text-sm transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCaptchaGate, type CaptchaResult } from '~/composables/useCaptchaGate'
import CaptchaWidget from '@/components/security/CaptchaWidget.vue'

const { isOpen, params, cancel, verified } = useCaptchaGate()
const overlay = ref<HTMLDivElement | null>(null)
const captchaReady = ref(false)
const captchaResult = ref<CaptchaResult | null>(null)
const errorMsg = ref('')

watch(isOpen, (v) => {
  if (v) {
    // 重置状态
    captchaReady.value = false
    captchaResult.value = null
    errorMsg.value = ''
    requestAnimationFrame(() => overlay.value?.focus())
  }
})

function onEsc() { cancel('Cancelled via ESC') }
function onBackdrop() { cancel('Backdrop click') }

function onCaptchaReady(result: CaptchaResult) {
  // 验证码输入变化,保存结果但不立即关闭弹窗
  captchaReady.value = true
  captchaResult.value = result
  errorMsg.value = ''
}

function onCaptchaError(message: string) {
  // 显示错误但保持弹窗打开,让用户可以刷新
  captchaReady.value = false
  captchaResult.value = null
  errorMsg.value = message
}

function onCaptchaReset() {
  // 验证码被重置
  captchaReady.value = false
  captchaResult.value = null
  errorMsg.value = ''
}

function confirmVerification() {
  if (captchaReady.value && captchaResult.value) {
    verified(captchaResult.value) // 用户点击确认,关闭弹窗并返回结果
  }
}
</script>
