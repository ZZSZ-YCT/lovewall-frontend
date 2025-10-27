// composables/useCaptchaGate.ts
import { ref, reactive } from 'vue'

export type GeeTestTokens = {
  lot_number: string
  captcha_output: string
  pass_token: string
  gen_time: string
}

type OpenParams = {
  title?: string
  product?: 'bind' | 'float' | 'popup'
  riskType?: string
  width?: string | number
  captchaId?: string // optional override; otherwise your component reads runtime config
}

const isOpen = ref(false)
const params = reactive<OpenParams>({})
let _resolve: ((t: GeeTestTokens) => void) | null = null
let _reject: ((e: any) => void) | null = null

export function useCaptchaGate() {
  function open(p: OpenParams = {}): Promise<GeeTestTokens> {
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

  function verified(tokens: GeeTestTokens) {
    const res = _resolve
    close()
    res?.(tokens)
  }

  return { isOpen, params, open, cancel, verified }
}
