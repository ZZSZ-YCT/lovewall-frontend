export default defineEventHandler((event) => {
  const ua = getHeader(event, 'user-agent') || ''
  // 简单 UA 检测，可按需增强
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const isTablet = /iPad|Tablet/i.test(ua)
  const isDesktop = !isMobile && !isTablet

  if (!event.context.nuxt) event.context.nuxt = {}
  event.context.device = { isMobile, isTablet, isDesktop }
})
