export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  const router = useRouter()

  router.afterEach((to, from) => {
    try {
      // When navigating back/forward to homepage, ensure data is fresh
      if (to.path === '/' && from.path !== to.path) {
        const home = useHomeStore()
        // Defer to next tick to avoid racing with mount
        setTimeout(async () => {
          try { await home.refresh() } catch {}
        }, 0)
      }
    } catch {}
  })
})

