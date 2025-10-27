// composables/usePopupPortal.ts
import { ref, shallowRef, reactive } from 'vue'

export type PopupOpenParams = {
  title?: string
  component: any            // a Vue component (SFC or defineComponent)
  props?: Record<string, any>
  // If true, clicking backdrop closes the popup (default true)
  closeOnBackdrop?: boolean
}

const isOpen = ref(false)
const title = ref<string | undefined>()
const comp = shallowRef<any | null>(null)
const compProps = reactive<Record<string, any>>({})
const closeOnBackdrop = ref(true)

let _resolve: ((v: any) => void) | null = null
let _reject: ((e: any) => void) | null = null

export function usePopupPortal() {
  function open(params: PopupOpenParams): Promise<any> {
    if (isOpen.value) throw new Error('A popup is already open')
    // set state
    isOpen.value = true
    title.value = params.title
    comp.value = params.component
    Object.assign(compProps, params.props ?? {})
    closeOnBackdrop.value = params.closeOnBackdrop ?? true

    return new Promise((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    })
  }

  function resolve(payload?: any) {
    const res = _resolve
    cleanup()
    queueMicrotask(() => res?.(payload))
  }

  function reject(err: any) {
    const rej = _reject
    cleanup()
    queueMicrotask(() => rej?.(err instanceof Error ? err : new Error(String(err))))
  }

  function cancel(reason = 'Cancelled') {
    const rej = _reject
    cleanup()
    queueMicrotask(() => rej?.(new Error(reason)))
  }

  function cleanup() {
    isOpen.value = false
    title.value = undefined
    comp.value = null
    for (const k of Object.keys(compProps)) delete compProps[k]
    _resolve = null
    _reject = null
    closeOnBackdrop.value = true
  }

  return {
    // state
    isOpen, title, comp, compProps, closeOnBackdrop,
    // actions
    open, resolve, reject, cancel,
  }
}
