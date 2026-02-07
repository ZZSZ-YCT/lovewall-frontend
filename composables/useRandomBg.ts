export const useRandomBg = () => {
  return {
    src: readonly(ref('')),
    loading: readonly(ref(false)),
    error: readonly(ref<string | null>(null)),
    refresh: () => {},
  }
}
