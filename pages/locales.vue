<script setup lang="ts">
import {computed} from 'vue'
import {
  useI18n,
  useRoute,
  useSwitchLocalePath,
} from '#imports'
import type {Locale} from '#i18n'

import {REGIONS, REGION_GROUP_KEYS, type Region, type RegionGroupKey} from '~/utils/regions'
import {useRegion} from '~/composables/useRegion'

const {locales, setLocale, t} = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const {setRegion} = useRegion()

// language -> locale 映射
const localeByLanguage = computed(() => {
  const map = new Map<string, any>()
  for (const l of locales.value as any[]) {
    if (l.language) {
      map.set(l.language, l)
    }
  }
  return map
})

const groupedRegions = computed<Record<RegionGroupKey, Region[]>>(() => {
  const groups = {} as Record<RegionGroupKey, Region[]>

  // 先把所有 key 初始化成空数组，保证一定存在
  for (const key of REGION_GROUP_KEYS) {
    groups[key] = []
  }

  for (const r of REGIONS) {
    groups[r.group].push(r)
  }

  for (const key of REGION_GROUP_KEYS) {
    groups[key].sort((a, b) => a.name.localeCompare(b.name))
  }

  return groups
})

const hasLocaleForRegion = (region: Region) =>
  localeByLanguage.value.has(region.language)

const selectRegion = async (region: Region) => {
  const matchedLocale = localeByLanguage.value.get(region.language)
  if (!matchedLocale) {
    console.warn('No locale for language:', region.language)
    return
  }

  const newLocaleCode = matchedLocale.code as string

  setRegion(region.id)

  const redirect = route.query.redirect as string | undefined

  await setLocale(newLocaleCode as Locale)

  navigateTo(localePath('/'))
}
</script>

<template>
  <div class="min-h-screen bg-transparent text-white">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <header class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold">
            {{ t('regions.selectRegionTitle') }}
          </h1>
        </div>
        <button
          type="button"
          class="text-xs text-gray-400 hover:text-white"
          @click="navigateTo(-1)"
        >
          {{ t('home.backHome', 'Back') }}
        </button>
      </header>

      <div class="space-y-6">
        <template v-for="groupKey in REGION_GROUP_KEYS" :key="groupKey">
          <section
            v-if="groupedRegions[groupKey]?.length"
            class="rounded-lg border border-white/5 bg-white/5 p-4"
          >
            <h2 class="mb-3 text-sm font-semibold text-gray-200">
              {{ t(`regions.group.${groupKey}`) }}
            </h2>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="region in groupedRegions[groupKey]"
                :key="region.id"
                type="button"
                :disabled="!hasLocaleForRegion(region)"
                class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="selectRegion(region)"
              >
                {{ region.name }}
              </button>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>
