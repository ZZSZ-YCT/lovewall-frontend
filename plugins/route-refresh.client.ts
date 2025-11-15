export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  const router = useRouter()

  router.afterEach((to, from) => {
    try {
      // When navigating back/forward to homepage, ensure data is fresh
      if (to.path === '/' && from.path !== to.path) {
        const home = useHomeStore()
        // 轻量刷新：不再做 TTL 缓存判断，只避免并发
        setTimeout(async () => {
          try {
            await home.refreshIfStale()
          } catch {}
        }, 0)
      }
    } catch {}
  })
})

