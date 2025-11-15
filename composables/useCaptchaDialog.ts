interface CaptchaDialogOptions {
  title?: string
}

interface CaptchaResult {
  captcha_id: string
  captcha_data: {
    dots?: Array<{ x: number; y: number }>
    angle?: number
  }
}

type CaptchaDialogResolver = ((value: CaptchaResult | null) => void) | null

interface CaptchaDialogState {
  isOpen: boolean
  title: string
}

const createDefaultState = (): CaptchaDialogState => ({
  isOpen: false,
  title: '安全验证'
})

export const useCaptchaDialog = () => {
  const state = useState<CaptchaDialogState>('captcha-dialog', createDefaultState)
  const resolver = useState<CaptchaDialogResolver>('captcha-dialog-resolver', () => null)

  const finalize = (result: CaptchaResult | null) => {
    const resolveFn = resolver.value
    resolver.value = null
    state.value = createDefaultState()
    resolveFn?.(result)
  }

  /**
   * 显示验证码对话框
   */
  const open = (options?: CaptchaDialogOptions): Promise<CaptchaResult | null> => {
    if (!import.meta.client) {
      return Promise.resolve(null)
    }

    // 如果已经打开,先关闭上一个
    if (state.value.isOpen) {
      finalize(null)
    }

    return new Promise<CaptchaResult | null>((resolve) => {
      state.value = {
        isOpen: true,
        title: options?.title ?? '安全验证'
      }
      resolver.value = (result: CaptchaResult | null) => {
        resolve(result)
      }
    })
  }

  /**
   * 验证成功
   */
  const verified = (result: CaptchaResult) => {
    finalize(result)
  }

  /**
   * 取消验证
   */
  const cancel = () => {
    finalize(null)
  }

  return {
    state,
    open,
    verified,
    cancel,
    respond: finalize
  }
}
