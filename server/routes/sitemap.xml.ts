import { defineEventHandler, getRequestURL } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { Pagination, PostDto, User } from '~/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: string
  priority: string
}

const CACHE_TTL_SECONDS = 60 * 5

// Add version to force CDN cache refresh
const SITEMAP_VERSION = '5-bun-fix'

let cachedResult: { xml: string; expiresAt: number } | null = null

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const toIsoString = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString()
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const previewForLog = (value: unknown, maxArrayItems = 5, depth = 0): unknown => {
  if (depth > 2) {
    return value
  }
  if (typeof value === 'string') {
    return value.length > 200 ? `${value.slice(0, 200)}...(+${value.length - 200} chars)` : value
  }
  if (Array.isArray(value)) {
    return value.slice(0, maxArrayItems).map((item) => previewForLog(item, maxArrayItems, depth + 1))
  }
  if (isRecord(value)) {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = previewForLog(val, maxArrayItems, depth + 1)
    }
    return result
  }
  return value
}

const describePayload = (value: unknown) => {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) return { type: 'array', length: value.length }
  if (isRecord(value)) return { type: 'object', keys: Object.keys(value) }
  return { type: typeof value }
}

const normalizeApiPayload = <T>(payload: unknown, url: string): T | null => {
  if (isRecord(payload) && 'success' in payload) {
    const record = payload as Record<string, unknown>
    if (record.success === true) {
      if ('data' in record) {
        return record.data as T
      }
      console.warn('[sitemap] API success payload missing data', { url, preview: previewForLog(record) })
      return null
    }
    console.error('[sitemap] API error payload', { url, preview: previewForLog(record) })
    return null
  }

  if (isRecord(payload) && 'data' in payload) {
    console.warn('[sitemap] API payload missing success flag, using data field', {
      url,
      preview: previewForLog(payload),
    })
    return (payload as Record<string, unknown>).data as T
  }

  if (Array.isArray(payload)) {
    return payload as T
  }

  if (payload == null) {
    console.warn('[sitemap] API returned null/undefined payload', { url })
    return null
  }

  console.warn('[sitemap] Using raw payload as data', { url, preview: previewForLog(payload) })
  return payload as T
}

const extractUsersFromResponse = (data: unknown): User[] => {
  if (!data) return []
  if (Array.isArray(data)) return data as User[]
  if (!isRecord(data)) return []

  const record = data as Record<string, unknown>

  const directUsers = record.users
  if (Array.isArray(directUsers)) {
    return directUsers as User[]
  }

  const items = record.items
  if (Array.isArray(items)) {
    return items as User[]
  }

  if ('data' in data) {
    return extractUsersFromResponse(record.data)
  }

  const results = record.results
  if (Array.isArray(results)) {
    return results as User[]
  }

  return []
}

export default defineEventHandler(async (event) => {
  const now = Date.now()
  if (cachedResult && cachedResult.expiresAt > now) {
    const xmlBuffer = Buffer.from(cachedResult.xml, 'utf-8')
    const contentLength = xmlBuffer.length

    // Bypass h3/Nitro - directly write to Node.js response
    const res = event.node.res
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`)
    res.setHeader('ETag', `"sitemap-v${SITEMAP_VERSION}-${contentLength}"`)
    res.setHeader('Content-Length', contentLength)

    console.info('[sitemap] Cache hit, returning cached sitemap', {
      expiresInMs: cachedResult.expiresAt - now,
      contentLength,
    })

    res.end(xmlBuffer)
    return
  }

  console.info('[sitemap] Cache miss, regenerating sitemap')
  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`

  const siteUrlBase =
    (config.public?.siteUrl as string | undefined)?.replace(/\/+$/, '') || origin

  const apiBase = (config.public?.apiBase as string | undefined) || '/api'
  const apiBaseAbsolute = /^https?:\/\//i.test(apiBase)
    ? apiBase.replace(/\/+$/, '')
    : `${origin}${normalizePath(apiBase).replace(/\/+$/, '')}`

  const resolveApiUrl = (path: string) => {
    const relativePath = normalizePath(path)
    return `${apiBaseAbsolute}${relativePath}`
  }

  const resolveSiteUrl = (path: string) => {
    try {
      return new URL(normalizePath(path), `${siteUrlBase}/`).toString()
    } catch {
      return `${siteUrlBase}${normalizePath(path)}`
    }
  }

  const fetchApi = async <T>(
    path: string,
    query?: Record<string, string | number | undefined>
  ): Promise<T | null> => {
    try {
      const url = new URL(resolveApiUrl(path))
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value === undefined || value === null) continue
          url.searchParams.set(key, String(value))
        }
      }
      console.info('[sitemap] Fetching API', { url: url.toString(), path })
      const response = await fetch(url.toString(), {
        headers: { accept: 'application/json' },
      })
      const responseText = await response.text()
      if (!response.ok) {
        console.error('[sitemap] API request failed', {
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          bodyPreview: previewForLog(responseText),
        })
        return null
      }

      let payload: unknown
      try {
        payload = responseText ? (JSON.parse(responseText) as ApiResponse<T>) : null
      } catch (parseError) {
        console.error('[sitemap] Failed to parse API response', {
          url: url.toString(),
          error: parseError,
          bodyPreview: previewForLog(responseText),
        })
        return null
      }

      console.info('[sitemap] API response received', {
        url: url.toString(),
        summary: describePayload(payload),
        preview: previewForLog(payload),
      })

      const normalized = normalizeApiPayload<T>(payload, url.toString())
      if (normalized !== null) {
        return normalized
      }

      console.warn('[sitemap] Unable to normalize API payload', {
        url: url.toString(),
        summary: describePayload(payload),
      })
      return null
    } catch (error) {
      console.error('[sitemap] API request error', { path, error })
      return null
    }
  }

  const [postsData, usersPayload] = await Promise.all([
    fetchApi<Pagination<PostDto>>('/posts', { page: 1, page_size: 1000 }),
    fetchApi<unknown>('/users/search', { page: 1, page_size: 1000 }),
  ])

  if (!postsData) {
    console.warn('[sitemap] Post data missing from API response')
  }

  if (!usersPayload) {
    console.warn('[sitemap] User payload missing from API response')
  }

  const urlEntries: SitemapEntry[] = []
  const generatedAt = new Date().toISOString()

  const addEntry = (entry: SitemapEntry) => {
    urlEntries.push(entry)
  }

  // Static pages
  addEntry({
    loc: resolveSiteUrl('/'),
    lastmod: generatedAt,
    changefreq: 'hourly',
    priority: '1.0',
  })
  addEntry({
    loc: resolveSiteUrl('/auth/login'),
    lastmod: generatedAt,
    changefreq: 'monthly',
    priority: '0.4',
  })
  addEntry({
    loc: resolveSiteUrl('/auth/register'),
    lastmod: generatedAt,
    changefreq: 'monthly',
    priority: '0.5',
  })

  // Dynamic post pages (only publicly visible)
  const posts = postsData?.items ?? (Array.isArray(postsData) ? postsData : [])
  console.info('[sitemap] Posts fetched', {
    total: postsData?.total ?? posts.length,
    page: postsData?.page,
    pageSize: postsData?.page_size,
    itemsReturned: posts.length,
  })
  const visiblePosts = posts.filter((post) => post && post.status === 0).slice(0, 1000)
  visiblePosts.forEach((post) => {
    addEntry({
      loc: resolveSiteUrl(`/posts/${post.id}`),
      lastmod: toIsoString(post.updated_at || post.created_at),
      changefreq: 'daily',
      priority: '0.7',
    })
  })
  console.info('[sitemap] Post entries added', {
    eligible: visiblePosts.length,
  })

  // Dynamic user pages (only active/public users)
  const rawUsers = extractUsersFromResponse(usersPayload)
  console.info('[sitemap] Users fetched', {
    itemsReturned: rawUsers.length,
    preview: previewForLog(rawUsers),
  })
  if (!rawUsers.length) {
    console.warn('[sitemap] No user data extracted from API response', {
      payloadSummary: describePayload(usersPayload),
    })
  }
  const eligibleUsers = rawUsers
    .filter((user) => user && !user.is_deleted && !user.is_banned)
    .slice(0, 1000)
  let userEntriesAdded = 0
  eligibleUsers.forEach((user) => {
    if (!user.username) {
      return
    }
    addEntry({
      loc: resolveSiteUrl(`/users/${user.username}`),
      lastmod: toIsoString(user.updated_at || user.created_at),
      changefreq: 'weekly',
      priority: '0.6',
    })
    userEntriesAdded += 1
  })
  console.info('[sitemap] User entries added', {
    rawUsers: rawUsers.length,
    eligibleUsers: eligibleUsers.length,
    addedEntries: userEntriesAdded,
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(
      (entry) => [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
        `    <priority>${escapeXml(entry.priority)}</priority>`,
        '  </url>',
      ].join('\n')
    ),
    '</urlset>',
  ].join('\n')

  console.info('[sitemap] Sitemap generated', {
    totalEntries: urlEntries.length,
    generatedAt,
    cacheTtlSeconds: CACHE_TTL_SECONDS,
  })

  cachedResult = {
    xml,
    expiresAt: now + CACHE_TTL_SECONDS * 1000,
  }

  const xmlBuffer = Buffer.from(xml, 'utf-8')
  const contentLength = xmlBuffer.length

  // Bypass h3/Nitro - directly write to Node.js response
  const res = event.node.res
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`)
  res.setHeader('ETag', `"sitemap-v${SITEMAP_VERSION}-${contentLength}"`)
  res.setHeader('Content-Length', contentLength)

  console.info('[sitemap] Returning fresh sitemap', { contentLength })

  res.end(xmlBuffer)
})
