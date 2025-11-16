export default defineNuxtPlugin(() => {
  // 不阻塞应用启动，后台恢复认证状态
  const auth = useAuthStore()

  if (!import.meta.client) return

  // fire-and-forget 方式异步初始化，不影响首屏交互和路由跳转
  auth.initAuth().catch((error) => {
    console.warn('Auth initialization failed:', error)
  })
})
