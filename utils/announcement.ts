/**
 * 公告系统工具函数
 */

/**
 * 规范化公告路径
 * - 去除前后空格
 * - 确保以 / 开头
 * - 移除尾部 / (除非是根路径 /)
 *
 * @param path - 原始路径
 * @returns 规范化后的路径
 *
 * @example
 * normalizeAnnouncementPath('  /admin/  ') // '/admin'
 * normalizeAnnouncementPath('home') // '/home'
 * normalizeAnnouncementPath('/') // '/'
 */
export function normalizeAnnouncementPath(path: string): string {
  // 去除前后空格
  let normalized = path.trim()

  // 确保以 / 开头
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }

  // 移除尾部 / (除非是根路径)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * 验证公告路径格式
 *
 * @param path - 待验证的路径
 * @returns 是否为有效路径
 */
export function isValidAnnouncementPath(path: string): boolean {
  if (!path) return false
  const normalized = normalizeAnnouncementPath(path)
  return normalized.startsWith('/')
}
