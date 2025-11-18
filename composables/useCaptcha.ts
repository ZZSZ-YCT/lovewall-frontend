// 验证码数据接口(导出供其他组件使用)
export interface CaptchaData {
  captcha_id: string
  type: 'click' | 'rotate'
  master_image: string  // base64 编码(不含 data URI 前缀)
  thumb_image: string   // base64 编码(不含 data URI 前缀)
}

export const useCaptcha = () => {

  /**
   * 获取验证码
   */
  const fetchCaptcha = async (): Promise<CaptchaData> => {
    try {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase as string

      // 使用 $fetch 直接调用
      const response = await $fetch<{ success: boolean; data: CaptchaData; error?: { message: string } }>(
        '/captcha/generate',
        {
          baseURL: baseURL,
          credentials: 'include'
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '获取验证码失败')
      }

      return response.data
    } catch (error: any) {
      console.error('Failed to fetch captcha:', error)
      throw new Error(error.data?.error?.message || error.message || '获取验证码失败')
    }
  }

  return {
    fetchCaptcha
  }
}
