/**
 * 公告系统 Composable
 * 按页面路径显示公告，支持用户dismiss
 */

import type { AnnouncementDto } from '~/types'
import { normalizeAnnouncementPath } from '~/utils/announcement'

export const useAnnouncement = () => {
  const route = useRoute()
  const api = useNuxtApp().$api

  const announcement = ref<AnnouncementDto | null>(null)
  const isOpen = ref(false)
  const loading = ref(false)

  /**
   * 计算公告内容的hash（用于检测更新）
   */
  const calculateHash = (content: string): string => {
    if (!content) return ''

    // 简单hash算法（FNV-1a）
    let hash = 2166136261
    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(36)
  }

  /**
   * 获取当前路径的localStorage key
   */
  const getStorageKey = (path: string): string => {
    return `announcement-dismissed-${path}`
  }

  /**
   * 检查公告是否已被用户dismiss
   */
  const isDismissed = (path: string, contentHash: string): boolean => {
    if (typeof window === 'undefined') return false

    const key = getStorageKey(path)
    const stored = localStorage.getItem(key)

    if (!stored) return false

    try {
      const data = JSON.parse(stored)
      // 如果hash相同，说明公告未更新，保持dismiss状态
      return data.hash === contentHash
    } catch {
      return false
    }
  }

  /**
   * 记录用户dismiss
   */
  const markAsDismissed = (path: string, contentHash: string) => {
    if (typeof window === 'undefined') return

    const key = getStorageKey(path)
    localStorage.setItem(key, JSON.stringify({
      hash: contentHash,
      dismissedAt: new Date().toISOString()
    }))
  }

  /**
   * 根据路径获取公告
   */
  const fetchAnnouncement = async (path: string) => {
    if (!path) return null

    loading.value = true
    try {
      // 使用统一的路径规范化方法
      const normalizedPath = normalizeAnnouncementPath(path)

      // 路径已经被router编码，直接使用
      const response = await api.getAnnouncementByPath(normalizedPath)
      return response
    } catch (error: any) {
      // 404是正常情况（该页面无公告），静默处理
      // 其他错误也不提示用户，因为公告不是核心功能
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查并显示当前路径的公告
   */
  const checkAndShow = async () => {
    const expectedPath = route.path

    const data = await fetchAnnouncement(expectedPath)

    // 防止竞态：如果在请求期间路由已经变化，忽略这个响应
    if (route.path !== expectedPath) {
      return
    }

    if (!data || !data.is_active) {
      announcement.value = null
      isOpen.value = false
      return
    }

    // 计算hash
    const contentHash = calculateHash(data.content)

    // 检查是否已dismiss
    if (isDismissed(expectedPath, contentHash)) {
      announcement.value = null
      isOpen.value = false
      return
    }

    // 显示公告
    announcement.value = data
    isOpen.value = true
  }

  /**
   * 关闭公告（不记录）
   */
  const close = () => {
    isOpen.value = false
  }

  /**
   * Dismiss公告（记录到localStorage）
   */
  const dismiss = () => {
    if (!announcement.value) return

    const path = route.path
    const contentHash = calculateHash(announcement.value.content)

    markAsDismissed(path, contentHash)
    isOpen.value = false
  }

  /**
   * 公告内容hash（用于传递给组件）
   */
  const announcementHash = computed(() => {
    if (!announcement.value) return ''
    return calculateHash(announcement.value.content)
  })

  // 监听路由变化（不立即执行，等待鉴权完成）
  watch(() => route.path, () => {
    checkAndShow()
  })

  return {
    announcement: computed(() => announcement.value),
    isOpen: computed(() => isOpen.value),
    loading: computed(() => loading.value),
    announcementHash,
    checkAndShow,
    close,
    dismiss
  }
}
