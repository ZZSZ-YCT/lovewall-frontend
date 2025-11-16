export const useRandomBg = () => {
  const config = useRuntimeConfig()
  const url = config.public.randomImageApiUrl as string

  const src = ref<string>('')
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchImage = async (retries = 3): Promise<void> => {
    try {
      // Try to get cached URL from sessionStorage (24h cache)
      if (import.meta.client) {
        const cached = sessionStorage.getItem('bg-image-url')
        const cachedTime = sessionStorage.getItem('bg-image-time')
        const now = Date.now()

        // Use cached image if less than 24 hours old
        if (cached && cachedTime && (now - parseInt(cachedTime)) < 24 * 60 * 60 * 1000) {
          src.value = cached
          loading.value = false
          return
        }
      }

      // Generate a unique URL to get a new random image（限制尺寸与质量，减小体积）
      const timestamp = Date.now()
      const base = `${url}${url.endsWith('/') ? '' : '/'}`
      const imageUrl = `${base}?w=1200&h=675&q=50&fit=cover&t=${timestamp}`

      // Create a new image to test loading
      const img = new Image()

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      src.value = imageUrl
      loading.value = false
      error.value = null

      // Cache the URL for 24 hours
      if (import.meta.client) {
        sessionStorage.setItem('bg-image-url', imageUrl)
        sessionStorage.setItem('bg-image-time', Date.now().toString())
      }
    } catch (err) {
      if (retries > 0) {
        // Wait a bit before retrying
        await new Promise<void>(resolve => window.setTimeout(resolve, 1000))
        return fetchImage(retries - 1)
      }

      error.value = 'Failed to load background image'
      loading.value = false
      console.warn('Background image loading failed:', err)
    }
  }

  const refresh = () => {
    loading.value = true
    error.value = null
    fetchImage()
  }

  // Auto-fetch on mount - use requestIdleCallback to avoid blocking critical resources
  onMounted(() => {
    if (!import.meta.client) {
      return
    }

    const startFetch = () => {
      error.value = null
      loading.value = true
      fetchImage()
    }

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => startFetch())
      } else {
        (window as any).setTimeout(startFetch, 0)
      }
    }
  })

  return {
    src: readonly(src),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
