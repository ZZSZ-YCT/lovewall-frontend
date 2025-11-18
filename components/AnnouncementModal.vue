<template>
  <Teleport to="body">
    <Transition name="announcement-fade">
      <div
        v-if="isOpen"
        class="announcement-modal fixed inset-0 z-[10000] flex items-center justify-center p-4"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />

        <!-- 公告内容 -->
        <div
          class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-dialog-in"
          @click.stop
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h3 class="text-xl font-semibold text-gray-900">公告</h3>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="关闭公告"
              @click="handleClose"
            >
              <svg class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            <!-- 渲染Markdown + LaTeX + HTML -->
            <div
              class="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-pink-600 hover:prose-a:text-pink-700"
              v-html="renderedContent"
            />
          </div>

          <!-- 底部按钮 -->
          <div class="flex gap-3 justify-end px-6 pb-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              @click="handleDismiss"
            >
              本页面不再显示
            </button>
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors shadow-sm"
              @click="handleClose"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  content: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  dismiss: []
}>()

const { render } = useRenderMd()

const renderedContent = ref('')

onMounted(async () => {
  if (!props.content) return

  try {
    renderedContent.value = await render(props.content)
  } catch (error) {
    console.error('Markdown rendering failed:', error)

    renderedContent.value = props.content
  }
})

const handleClose = () => {
  emit('close')
}

const handleDismiss = () => {
  emit('dismiss')
}

watch(() => props.isOpen, (isOpen) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
}, { immediate: true })

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleEscape)
  }
})
</script>

<style scoped>
.announcement-modal {
  position: fixed;
  inset: 0;
  contain: layout paint;
}

.announcement-fade-enter-active,
.announcement-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  will-change: transform, opacity;
}

.announcement-fade-enter-from,
.announcement-fade-leave-to {
  opacity: 0;
  transform: translate3d(0, -12px, 0) scale(0.98);
}

.announcement-fade-enter-to,
.announcement-fade-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
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

/* 公告内容样式增强 */
:deep(.prose) {
  color: #374151;
  line-height: 1.75;
}

:deep(.prose h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1rem;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

:deep(.prose p) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

:deep(.prose code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  color: #dc2626;
}

:deep(.prose pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.prose blockquote) {
  border-left: 4px solid #ec4899;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.prose img) {
  border-radius: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.prose th),
:deep(.prose td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

:deep(.prose th) {
  background-color: #f9fafb;
  font-weight: 600;
}
</style>
