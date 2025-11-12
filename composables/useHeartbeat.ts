import type { HeartbeatResponse } from '~/types'

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let isRunning = false

const unreadNotifications = ref<number>(0)

export function useHeartbeat() {
  // SSR guard - only access $api on client
  const $api = import.meta.client ? useNuxtApp().$api : null
  const auth = useAuthStore()

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    isRunning = false
  }

  const sendHeartbeat = async () => {
    // SSR guard
    if (!import.meta.client || !$api) return

    if (!auth.isAuthenticated) {
      stopHeartbeat()
      return
    }

    try {
      const response: HeartbeatResponse = await $api.heartbeat()
      unreadNotifications.value = response.unread_notifications || 0
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[Heartbeat] Failed to send heartbeat:', error)
      }
    }
  }

  const startHeartbeat = () => {
    if (isRunning || heartbeatTimer) {
      return
    }

    void sendHeartbeat()
    heartbeatTimer = setInterval(() => {
      void sendHeartbeat()
    }, 30000)

    isRunning = true
  }

  return {
    startHeartbeat,
    stopHeartbeat,
    isRunning: () => isRunning,
    unreadNotifications: readonly(unreadNotifications),
  }
}
