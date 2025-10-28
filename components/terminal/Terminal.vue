<template>
  <div
    ref="wrap"
    class="fixed inset-0 bg-black text-neutral-200 font-mono text-sm leading-6 flex flex-col p-4"
    @click="onContainerClick"
  >
    <!-- Output window -->
    <div ref="scroll" class="flex-1 overflow-y-auto space-y-1 no-scrollbar">
      <div v-for="line in history" :key="line.id" class="whitespace-pre-wrap">
        <template v-if="line.type === 'input'">
          <span class="text-emerald-400">$</span> {{ line.text }}
        </template>
        <template v-else>
          {{ line.text }}
        </template>
      </div>
      <div ref="bottom"></div>
    </div>

    <!-- Input -->
    <div class="flex items-center gap-2 pt-2 border-t border-neutral-800">
      <span class="text-emerald-400">$</span>
      <input
        ref="inputEl"
        v-model="input"
        :disabled="disabled"
        class="flex-1 bg-transparent outline-none placeholder-neutral-500"
        :placeholder="busy ? 'Running…' : placeholder"
        @keydown.enter.prevent="onEnter"
        @keydown="onKeydown"
        @keydown.up.prevent="prevHistory"
        @keydown.down.prevent="nextHistory"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, nextTick, onMounted, onBeforeUnmount, computed} from 'vue'
import {useCli, isPrompting, submitPromptInput, interrupt} from '~/composables/terminal/useCli'
import {useCaptchaGate} from '~/composables/useCaptchaGate'
import {usePopupPortal} from '@/composables/usePopupPortal'

const props = defineProps<{ placeholder?: string }>()

const {history, busy, run} = useCli()
const {isOpen: captchaOpen, cancel: cancelCaptcha} = useCaptchaGate()
const {isOpen: popupOpen, cancel: cancelPopup} = usePopupPortal()

const input = ref('')
const cursor = ref(-1)
const issuedInputs = ref<string[]>([])

const inputEl = ref<HTMLInputElement | null>(null)
const scroll = ref<HTMLDivElement | null>(null)
const bottom = ref<HTMLDivElement | null>(null)

const disabled = computed(() => captchaOpen.value || popupOpen.value)

function focusInput() {
  inputEl.value?.focus()
}

watch([popupOpen, captchaOpen], ([p, c]) => {
  if (!p && !c) requestAnimationFrame(() => focusInput())
})

function onContainerClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // 1) If the click is on an editable element, do nothing
  if (target.closest('input, textarea, [contenteditable]')) return

  // 2) If there is a text selection (user was selecting history), do nothing
  const sel = window.getSelection?.()
  if (sel && sel.type === 'Range' && sel.toString()) return

  // Otherwise, it’s a background click — focus the input
  focusInput()
}

async function onEnter() {
  const value = input.value

  if (busy.value && !isPrompting()) {
    return
  }

  if (isPrompting()) {
    input.value = ''
    submitPromptInput(value)
    await nextTick()
    scrollToBottom()
    focusInput()
    return
  }

  if (!value.trim()) return

  issuedInputs.value.push(value)
  cursor.value = -1
  input.value = ''

  await run(value)

  await nextTick()
  scrollToBottom()
  focusInput() // auto-refocus after running command
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault()
    if (popupOpen.value) {
      cancelPopup('Interrupted');
      return
    }
    if (captchaOpen.value) {
      cancelCaptcha('Interrupted');
      return
    }
    interrupt()
    focusInput()
  }
}

function prevHistory() {
  if (!issuedInputs.value.length) return
  if (cursor.value < issuedInputs.value.length - 1) cursor.value++
  input.value = issuedInputs.value[issuedInputs.value.length - 1 - cursor.value] ?? ""
}

function nextHistory() {
  if (cursor.value <= 0) {
    cursor.value = -1
    input.value = ''
  } else {
    cursor.value--
    input.value = issuedInputs.value[issuedInputs.value.length - 1 - cursor.value] ?? ""
  }
}

function scrollToBottom() {
  if (bottom.value) bottom.value.scrollIntoView({block: 'end'})
  else if (scroll.value) scroll.value.scrollTop = scroll.value.scrollHeight
}

watch(history, async () => {
  await nextTick()
  scrollToBottom()
})

watch([popupOpen, captchaOpen], ([p, c]) => {
  if (!p && !c) {
    // next tick to ensure DOM settled
    requestAnimationFrame(() => focusInput())
  }
})

onMounted(() => {
  focusInput()
  window.addEventListener('keydown', globalCtrlC)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', globalCtrlC)
})

function globalCtrlC(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault()
    if (popupOpen.value) {
      cancelPopup('Interrupted');
      return
    }
    if (captchaOpen.value) {
      cancelCaptcha('Interrupted');
      return
    }
    interrupt()
    focusInput()
  }
}

</script>

<style scoped>
input {
  caret-color: #10b981;
}

.no-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge Legacy */
}

.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
</style>
