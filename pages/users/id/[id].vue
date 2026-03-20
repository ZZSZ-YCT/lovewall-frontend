<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const api = useNuxtApp().$api

const userId = computed(() => String(route.params.id || ''))

const { data, error } = await useAsyncData(
  () => `user-id-redirect-${userId.value}`,
  async () => await api.getUser(userId.value),
  { watch: [userId] },
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'User not found',
  })
}

if (data.value?.username) {
  await navigateTo(localePath(`/users/${data.value.username}`), { redirectCode: 301 })
}

definePageMeta({
  key: (route: any) => `user-id-${route.params?.id ?? ''}`,
})
</script>
