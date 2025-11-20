<template>
  <div class="w-full space-y-6">
    <div class="page-header">
      <h1 class="page-title">{{ t('notifications.index') }}</h1>
      <p class="text-gray-600 mt-2">{{ t('notifications.description') }}</p>
    </div>

    <NotificationsList />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import NotificationsList from '~/pages/notifications.vue'
definePageMeta({
  title: { k: 'notifications.title' },
  middleware: ['auth'],
  ssr: false
})
</script>

