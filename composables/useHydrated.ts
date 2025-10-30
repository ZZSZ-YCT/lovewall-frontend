export const useHydrated = () => {
  const hydrated = ref(false)
  if (process.client) {
    onMounted(() => (hydrated.value = true))
  }
  return hydrated
}
