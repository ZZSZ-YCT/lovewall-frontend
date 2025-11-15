// composables/useCaptchaGate.ts
import { ref, reactive } from 'vue'

export type CaptchaResult = {
  captcha_id: string
  captcha_data: {
    dots?: Array<{ x: number; y: number }>
    x?: number
    angle?: number
  }
}

type OpenParams = {
  title?: string
  width?: string | number
}

const isOpen = ref(false)
const params = reactive<OpenParams>({})
let _resolve: ((t: CaptchaResult) => void) | null = null
let _reject: ((e: any) => void) | null = null

export function useCaptchaGate() {
  function open(p: OpenParams = {}): Promise<CaptchaResult> {
    if (isOpen.value) throw new Error('Captcha already open')
    Object.assign(params, p)
    isOpen.value = true
    return new Promise((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    })
  }

  function close() {
    isOpen.value = false
    Object.keys(params).forEach(k => delete (params as any)[k])
    _resolve = null
    _reject = null
  }

  function cancel(reason = 'Cancelled') {
    const rej = _reject
    close()
    rej?.(new Error(reason))
  }

  function verified(result: CaptchaResult) {
    const res = _resolve
    close()
    res?.(result)
  }

  return { isOpen, params, open, cancel, verified }
}
