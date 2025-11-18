<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        :class="[
          'bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto w-full',
          maxWidth
        ]"
      >
        <!-- Header -->
        <div v-if="showHeader" class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">{{ title }}</h2>
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            @click="handleClose"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="p-6 pt-0">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  title?: string
  maxWidth?: string
  showHeader?: boolean
  closeOnClickOutside?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidth: 'max-w-2xl',
  showHeader: true,
  closeOnClickOutside: true
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  if (props.closeOnClickOutside) {
    emit('close')
  }
}

// 阻止背景滚动
watch(() => props.isOpen, (isOpen) => {
  if (typeof window !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// 清理
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>