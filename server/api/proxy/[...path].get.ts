// server/api/proxy/[...path].ts
import {
  defineEventHandler,
  getRouterParam,
  getQuery,
  getHeader,
  proxyRequest,
  setResponseHeaders
} from 'h3'
import { useAssetUrl } from '~/composables/useAssetUrl'

export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path') || ''

  const { backendUrl } = useAssetUrl()
  const cleanPath = String(path).replace(/^\/+/, '')

  // 1. 先拿到基础的后端地址（假设返回类似 https://img.xxx.com/uploads/xxx）
  const base = backendUrl(cleanPath)

  // 2. 把当前请求的 query 参数带过去（w,h,fit,q,format 等）
  const query = getQuery(event)
  const url = new URL(base)

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)))
    } else if (value != null) {
      url.searchParams.set(key, String(value))
    }
  }

  const cookie = getHeader(event, 'cookie') || ''

  return proxyRequest(event, url.toString(), {
    // 3. 只转发需要的请求头（这里主要是 cookie）
    fetchOptions: {
      headers: cookie ? { cookie } : {}
    },

    // 4. 可以在这里统一设置/覆盖响应头（比如缓存策略）
    onResponse(_event, response) {
      // 保证同站策略（也可以 same-origin，看你需求）
      setResponseHeaders(_event, {
        'Cross-Origin-Resource-Policy': 'same-site',
        // 如果你的图片地址是带 hash 的，可以放心做强缓存
        // 根据你的实际情况调 max-age
        'Cache-Control': 'public, max-age=31536000, immutable'
      })

      // 如果你想透传上游的某些 header，可以在这里读 response.headers 再 set 回去
      // 比如 Content-Type, ETag 等
    }
  })
})
