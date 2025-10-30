// server/__proxy/posts/[id]/comments.get.ts
import { getRouterParam, getQuery, getRequestHeader, setHeader } from 'h3'
import { joinURL } from 'ufo'

type ApiError = { code: string; message: string }
type Pagination<T> = { items: T[]; total: number; page: number; page_size: number }
type CommentDto = { id: string; author: string; text: string; created_at: string }
type ApiSuccess<T> = { success: true; data: T; trace_id: string }
type ApiFailure = { success: false; error: ApiError; trace_id: string }
type ApiResp<T> = ApiSuccess<T> | ApiFailure

export default defineCachedEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 's-maxage=30, stale-while-revalidate=60')

  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string | undefined

  const normBase = (() => {
    if (!baseURL) return ''
    return /\/$/.test(baseURL) ? baseURL : `${baseURL}/`
  })()

  // 拼接最终上游地址
  const upstream = joinURL(normBase, `posts/${id}/comments`)

  console.log('[Proxy Debug]', { baseURL, normBase, upstream, query })

  // 如果需要转发认证头
  const authHeader = getRequestHeader(event, 'authorization')
  const headers = authHeader ? { authorization: authHeader } : undefined

  try {
    const body = await $fetch<ApiResp<Pagination<CommentDto>>>(upstream, {
      query,
      headers,
    })
    return body
  } catch (err: any) {
    const trace = crypto.randomUUID()
    return {
      success: false,
      error: {
        code: err?.response?.status ? String(err.response.status) : 'UPSTREAM_ERROR',
        message:
          err?.response?._data?.error?.message ||
          err?.message ||
          'Failed to fetch comments from upstream',
      },
      trace_id: trace,
    } satisfies ApiFailure
  }
}, {
  maxAge: 30,        // 缓存 30s
  staleMaxAge: 60,   // 最长使用旧缓存 60s
  swr: true,         // 启用 SWR
  group: 'comments',
  name: 'listComments',
})
