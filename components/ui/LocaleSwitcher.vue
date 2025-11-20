<script setup lang="ts">
const { locale, locales } = useI18n()

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Globe2 } from 'lucide-vue-next'

const switchLocalePath = useSwitchLocalePath()

const isOpen = ref(false)

const triggerRef = ref<HTMLElement | null>(null)
const dropdownStyles = ref<Record<string, string>>({})

// current / available locales
const currentLocale = computed(() =>
  locales.value.find((l: any) => l.code === locale.value) || null,
)

const availableLocales = computed(() =>
  locales.value.filter((l: any) => l.code !== locale.value),
)

const currentLabel = computed(() => {
  const l: any = currentLocale.value
  return l?.name || l?.code?.toUpperCase() || 'EN'
})

const localeLabel = (l: any) => l.name || l.code?.toUpperCase()

const selectLocale = (code: string) => {
  isOpen.value = false
  const path = switchLocalePath(code)
  if (path) {
    navigateTo(path)
  }
}

// position dropdown relative to trigger (viewport coords)
const updatePosition = () => {
  const trigger = triggerRef.value
  if (!trigger || !isOpen.value) return

  const rect = trigger.getBoundingClientRect()

  dropdownStyles.value = {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    // pop UP above the trigger, with 8px gap
    transform: 'translateY(calc(-100% - 8px))',
  }
}

const open = () => {
  const trigger = triggerRef.value
  if (!trigger) return

  // compute position BEFORE opening
  const rect = trigger.getBoundingClientRect()
  dropdownStyles.value = {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    transform: 'translateY(calc(-100% - 8px))',
  }
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// close on outside click / Escape
const onClickOutside = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node
  if (!triggerRef.value?.contains(target)) {
    close()
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

const onResizeOrScroll = () => {
  if (!isOpen.value) return
  updatePosition()
}

onMounted(() => {
  window.addEventListener('click', onClickOutside)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResizeOrScroll)
  window.addEventListener('scroll', onResizeOrScroll, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onClickOutside)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResizeOrScroll)
  window.removeEventListener('scroll', onResizeOrScroll, true)
})
</script>

<template>
  <div ref="triggerRef" class="relative inline-block text-left">
    <!-- Plain text trigger: 🌐 Language -->
    <button
      type="button"
      class="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer"
      @click="toggle"
    >
      <Globe2 class="h-4 w-4" />
      <span>{{ currentLabel }}</span>
      <svg
        class="h-3 w-3"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 7l5 5 5-5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Teleport dropdown to body so nothing can cover it -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="z-[9999] w-40 rounded-md bg-black/80 text-xs text-white shadow-lg ring-1 ring-white/20 backdrop-blur"
        :style="dropdownStyles"
      >
        <ul class="py-1">
          <li
            v-for="loc in availableLocales"
            :key="loc.code"
          >
            <button
              type="button"
              class="block w-full px-3 py-1.5 text-left hover:bg-white/10"
              @click="selectLocale(loc.code)"
            >
              {{ localeLabel(loc) }}
            </button>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>
