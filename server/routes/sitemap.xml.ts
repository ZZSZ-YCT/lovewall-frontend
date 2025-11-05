// server/routes/sitemap.xml.ts
import { defineEventHandler, getRequestURL, setHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { Pagination, PostDto, User } from '~/types'

interface ApiResponse<T> { success: boolean; data: T }
interface SitemapEntry { loc: string; lastmod: string; changefreq: string; priority: string }

const CACHE_TTL_SECONDS = 60 * 5
const SITEMAP_VERSION = '6-runtime-safe'

// process lifetime cache (will be best-effort on edge)
let cachedResult: { xml: string; expiresAt: number } | null = null

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

// Use second precision to avoid picky parsers
const toIsoSec = (value?: string | null) => {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const normalizePath = (p: string) => (p.startsWith('/') ? p : `/${p}`)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const normalizeApiPayload = <T>(payload: unknown): T | null => {
  if (isRecord(payload) && 'success' in payload) {
    const r = payload as Record<string, unknown>
    return r.success === true && 'data' in r ? (r.data as T) : null
  }
  if (isRecord(payload) && 'data' in payload) return (payload as any).data as T
  if (Array.isArray(payload)) return payload as T
  return payload == null ? null : (payload as T)
}

const extractUsersFromResponse = (data: unknown): User[] => {
  if (!data) return []
  if (Array.isArray(data)) return data as User[]
  if (!isRecord(data)) return []
  if (Array.isArray((data as any).users)) return (data as any).users as User[]
  if (Array.isArray((data as any).items)) return (data as any).items as User[]
  if ('data' in data) return extractUsersFromResponse((data as any).data)
  if (Array.isArray((data as any).results)) return (data as any).results as User[]
  return []
}

export default defineEventHandler(async (event) => {
  const now = Date.now()
  if (cachedResult && cachedResult.expiresAt > now) {
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
    setHeader(event, 'ETag', `W/"sitemap-v${SITEMAP_VERSION}-${cachedResult.xml.length}"`)
    return cachedResult.xml
  }

  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`

  const siteUrlBase =
    (config.public?.siteUrl as string | undefined)?.replace(/\/+$/, '') || origin

  // Prefer absolute api base to avoid self-fetch quirks
  const apiBase = (config.public?.apiBase as string | undefined) || '/api'
  const apiBaseAbsolute = /^https?:\/\//i.test(apiBase)
    ? apiBase.replace(/\/+$/, '')
    : `${origin}${normalizePath(apiBase).replace(/\/+$/, '')}`

  const resolveApiUrl = (path: string, query?: Record<string, string | number | undefined>) => {
    const url = new URL(`${apiBaseAbsolute}${normalizePath(path)}`)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v == null) continue
        url.searchParams.set(k, String(v))
      }
    }
    return url
  }

  const resolveSiteUrl = (path: string) =>
    new URL(normalizePath(path), `${siteUrlBase}/`).toString()

  const fetchApi = async <T>(path: string, query?: Record<string, string | number | undefined>) => {
    try {
      const url = resolveApiUrl(path, query)
      const res = await fetch(url.toString(), { headers: { accept: 'application/json' } })
      if (!res.ok) return null
      const text = await res.text()
      const payload = text ? (JSON.parse(text) as ApiResponse<T>) : null
      return normalizeApiPayload<T>(payload)
    } catch {
      return null
    }
  }

  const [postsData, usersPayload] = await Promise.all([
    fetchApi<Pagination<PostDto>>('/posts', { page: 1, page_size: 1000 }),
    fetchApi<unknown>('/users/search', { page: 1, page_size: 1000 }),
  ])

  const urlEntries: SitemapEntry[] = []
  const generatedAt = toIsoSec()

  const add = (e: SitemapEntry) => urlEntries.push(e)

  // Static pages (avoid /auth/* to prevent robots conflicts)
  add({ loc: resolveSiteUrl('/'), lastmod: generatedAt, changefreq: 'hourly', priority: '1.0' })
  // If you really want auth pages listed, ensure robots.txt allows them before re-adding.

  // Posts (status === 0 only)
  const posts = (Array.isArray(postsData) ? postsData : postsData?.items) ?? []
  posts
    .filter((p) => p && p.status === 0)
    .slice(0, 1000)
    .forEach((post) =>
      add({
        loc: resolveSiteUrl(`/posts/${post.id}`),
        lastmod: toIsoSec(post.updated_at || post.created_at),
        changefreq: 'daily',
        priority: '0.7',
      })
    )

  // Users (active only)
  const users = extractUsersFromResponse(usersPayload)
    .filter((u) => u && !u.is_deleted && !u.is_banned && u.username)
    .slice(0, 1000)

  users.forEach((user) =>
    add({
      loc: resolveSiteUrl(`/users/${user.username!}`),
      lastmod: toIsoSec(user.updated_at || user.created_at),
      changefreq: 'weekly',
      priority: '0.6',
    })
  )

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urlEntries
      .map(
        (e) =>
          '  <url>\n' +
          `    <loc>${escapeXml(e.loc)}</loc>\n` +
          `    <lastmod>${escapeXml(e.lastmod)}</lastmod>\n` +
          `    <changefreq>${escapeXml(e.changefreq)}</changefreq>\n` +
          `    <priority>${escapeXml(e.priority)}</priority>\n` +
          '  </url>'
      )
      .join('\n') +
    '\n</urlset>\n'

  cachedResult = { xml, expiresAt: now + CACHE_TTL_SECONDS * 1000 }

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`)
  setHeader(event, 'ETag', `W/"sitemap-v${SITEMAP_VERSION}-${xml.length}"`)
  // On Nitro, returning the string is fine; `send` also works.
  return xml
})
