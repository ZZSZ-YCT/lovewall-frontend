export const useDeviceSafe = () => {
  const event = import.meta.server ? useRequestEvent() : null
  const serverDevice = event?.context?.device

  // ✅ 2. 客户端读取 SSR 注入结果（从 payload.data.device）
  const nuxtApp = useNuxtApp()
  const initialDevice = (nuxtApp.payload?.data?.device ?? {
    isMobile: false,
    isTablet: false,
    isDesktop: true
  }) as { isMobile: boolean; isTablet: boolean; isDesktop: boolean }

  // ✅ 3. 客户端延迟挂载 useDevice（防止 window 未定义）
  const clientDevice = ref<{ isMobile: boolean; isTablet: boolean; isDesktop: boolean } | null>(null)
  if (import.meta.client) {
    onMounted(() => {
      const d = useDevice()
      clientDevice.value = {
        isMobile: d.isMobile.value,
        isTablet: d.isTablet.value,
        isDesktop: d.isDesktop.value
      }
      // 监听窗口变化（可选）
      const resizeHandler = () => {
        clientDevice.value = {
          isMobile: d.isMobile.value,
          isTablet: d.isTablet.value,
          isDesktop: d.isDesktop.value
        }
      }
      window.addEventListener('resize', resizeHandler)

      // Clean up on unmount
      onUnmounted(() => {
        window.removeEventListener('resize', resizeHandler)
      })
    })
  }

  // ✅ 4. 统一计算属性：SSR 一致，hydration 前使用 snapshot
  const isMobile = computed(() => {
    if (import.meta.server) return serverDevice?.isMobile ?? false
    return clientDevice.value?.isMobile ?? initialDevice.isMobile
  })

  const isTablet = computed(() => {
    if (import.meta.server) return serverDevice?.isTablet ?? false
    return clientDevice.value?.isTablet ?? initialDevice.isTablet
  })

  const isDesktop = computed(() => {
    if (import.meta.server) return serverDevice?.isDesktop ?? true
    return clientDevice.value?.isDesktop ?? initialDevice.isDesktop
  })

  const hydrated = ref(false)
  if (process.client) {
    onMounted(() => { hydrated.value = true })
  }

  return { isMobile, isTablet, isDesktop }
}
