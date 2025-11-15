<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- 全局弹窗 -->
  <CaptchaDialog />
</template>

<script setup lang="ts">
import CaptchaDialog from '~/components/popup/CaptchaDialog.vue'
</script>



