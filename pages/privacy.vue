<template>
  <article class="prose prose-lg mx-auto">
    <div v-html="html"></div>
  </article>
</template>

<script setup lang="ts">
import tosMarkdown from '~/assets/privacy.md?raw'

const { render } = useRenderMd()

const html = await render(tosMarkdown)

definePageMeta({
  layout: false
})

</script>

<style scoped>

</style>
