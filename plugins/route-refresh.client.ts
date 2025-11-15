export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  const router = useRouter()

  router.afterEach((to, from) => {
    try {
      // When navigating back/forward to homepage, ensure data is fresh
      if (to.path === '/' && from.path !== to.path) {
        const home = useHomeStore()
        // Only refresh if data is stale (respects TTL)
        setTimeout(async () => {
          try {
            if (home.shouldRefresh()) {
              await home.refreshIfStale()
            }
          } catch {}
        }, 0)
      }
    } catch {}
  })
})

