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

        <!-- Mount your GeeTest component UNCHANGED -->
        <GeeTestV4
          :product="params.product || 'popup'"
          :risk-type="params.riskType || 'login'"
          :width="params.width || '100%'"
          :captcha-id="params.captchaId"
          @ready="onReady"
          @verified="onVerified"
          @error="onError"
        />

        <p class="mt-3 text-xs text-neutral-400">
          Complete the verification to continue.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCaptchaGate } from '~/composables/useCaptchaGate'
import GeeTestV4 from '@/components/security/GeeTestV4.vue' // <- your provided component file name

const { isOpen, params, cancel, verified } = useCaptchaGate()
const overlay = ref<HTMLDivElement | null>(null)

watch(isOpen, (v) => { if (v) requestAnimationFrame(() => overlay.value?.focus()) })

function onEsc() { cancel('Cancelled via ESC') }
function onBackdrop() { cancel('Backdrop click') }

function onReady() {
  // optional: you can log or show a tiny spinner before ready
}
function onVerified(tokens: any) {
  verified(tokens) // resolves the promise
}
function onError(message: string) {
  cancel(message)  // rejects the promise
}
</script>
