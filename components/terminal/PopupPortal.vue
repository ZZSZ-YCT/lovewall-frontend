<!-- components/PopupPortal.vue -->
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
      <div class="w-full max-w-2xl mx-4 rounded-xl bg-neutral-900 text-neutral-100 shadow-2xl p-4 ring-1 ring-neutral-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold">{{ title || 'Dialog' }}</h2>
          <button class="text-neutral-400 hover:text-neutral-200" @click="cancel()">✕</button>
        </div>

        <component
          :is="comp"
          v-bind="compProps"
          @resolve="resolve"
          @reject="reject"
          @close="cancel"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePopupPortal } from '@/composables/usePopupPortal'

const { isOpen, title, comp, compProps, closeOnBackdrop, cancel, resolve, reject } = usePopupPortal()
const overlay = ref<HTMLDivElement | null>(null)

watch(isOpen, (v) => { if (v) requestAnimationFrame(() => overlay.value?.focus()) })

function onEsc() { cancel('Cancelled') }
function onBackdrop() { if (closeOnBackdrop.value) cancel('Cancelled') }
</script>
