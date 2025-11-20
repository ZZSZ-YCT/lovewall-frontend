export default defineNuxtRouteMiddleware(async (to) => {
  // Run only on client
  if (import.meta.server) return

  const { $i18n } = useNuxtApp()
  const t = $i18n?.t?.bind($i18n)

  const auth = useAuthStore()
  
  // Ensure auth state is initialized
  if (!auth.isAuthenticated) {
    try {
      await auth.initAuth()
    } catch (e) {
      console.warn('Require-superadmin middleware: initAuth failed', e)
      // Clear any invalid state
      auth.currentUser = null
      auth.accessToken = null
      auth.permissions = []
    }
  }
  
  if (!auth.isAuthenticated) {
    const redirect = to.fullPath !== '/' ? to.fullPath : undefined
    return navigateTo({ path: '/auth/login', query: redirect ? { redirect } : undefined })
  }
  
  // Only superadmin can access
  if (!auth.isSuperadmin) {
    const toast = useToast()
    toast.error(t('error.messages.403'))
    if (import.meta.client && window.history.length > 1) {
      window.history.back()
      return
    }
    return navigateTo('/')
  }
})
