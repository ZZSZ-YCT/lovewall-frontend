<script setup lang="ts">
import { computed } from 'vue'
import { Globe2 } from 'lucide-vue-next'
import { useI18n, useLocalePath, useRoute } from '#imports'

const { locale, locales } = useI18n()
const { getRegion } = useRegion()
const route = useRoute()
const localePath = useLocalePath()

const currentLocale = computed(() =>
  (locales.value as any[]).find(l => l.code === locale.value) || null
)

const currentLabel = computed(() => {
  const l: any = currentLocale.value
  return l?.name || l?.code?.toUpperCase() || 'EN'
})

const goToLocalesPage = () => {
  const path = localePath({
    name: 'locales',
    query: {
      redirect: route.fullPath,
    },
  } as any)

  navigateTo(path)
}
</script>

<template>
  <div class="relative inline-block text-left">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer"
      @click="goToLocalesPage"
    >
      <Globe2 class="h-4 w-4" />
      <span>{{ getRegion()?.name!! }} ({{ currentLabel }})</span>
    </button>
  </div>
</template>
