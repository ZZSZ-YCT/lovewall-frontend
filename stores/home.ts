import {defineStore} from 'pinia'
import type {Pagination, PostDto} from '~/types'

const REFRESH_TTL = 30_000 // 30 seconds cache window

const normalizeStatus = (s: any): 0 | 1 => {
  if (typeof s === 'number') return s === 1 ? 1 : 0
  if (typeof s === 'string' && s.toLowerCase().includes('hide')) return 1
  return 0
}

const normalizeImages = (p: any): string[] => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images
  if (p.images && typeof p.images === 'string') return [String(p.images)]
  if (p.image_path) return [p.image_path]
  if (p.image_url) return [p.image_url]
  return []
}

const normalizePost = (p: any): PostDto => {
  const createdAt = p.created_at ?? new Date().toISOString()
  const normalized: PostDto = {
    id: String(p.id),
    author_id: String(p.author_id ?? p.user_id ?? ''),
    author_name: String(p.author_name ?? p.author_display_name ?? p.author_username ?? '匿名'),
    target_name: String(p.target_name ?? p.to_name ?? 'TA'),
    content: String(p.content ?? ''),
    images: normalizeImages(p),
    status: normalizeStatus(p.status),
    is_pinned: !!p.is_pinned,
    is_featured: !!p.is_featured,
    created_at: createdAt,
    updated_at: p.updated_at ?? createdAt,
    author_tag: p.author_tag,
    is_author_admin: p.is_author_admin,
    moderation_reason: p.moderation_reason ?? null,
    view_count: p.view_count,
    comment_count: p.comment_count,
    audit_status: p.audit_status,
    audit_msg: p.audit_msg,
    manual_review_requested: p.manual_review_requested,
    // 保留作者扩展信息（v3.2新增字段）
    author_display_name: p.author_display_name ?? null,
    author_avatar_url: p.author_avatar_url ?? null,
    author_is_online: p.author_is_online ?? false,
    author_last_heartbeat: p.author_last_heartbeat ?? null,
    author_is_deleted: p.author_is_deleted ?? p.author_deleted ?? false,
  }
  return normalized
}

const extractItems = (response: any): any[] => {
  if (!response) return []
  if (Array.isArray(response.items)) return response.items
  if (Array.isArray(response.list)) return response.list
  if (Array.isArray(response.records)) return response.records
  if (Array.isArray(response.rows)) return response.rows
  if (Array.isArray(response.data)) return response.data
  return []
}

const dedupeById = (posts: PostDto[]) => {
  const seen = new Set<string>()
  return posts.filter((post) => {
    if (seen.has(post.id)) return false
    seen.add(post.id)
    return true
  })
}

interface HomeState {
  posts: PostDto[]
  pinned: PostDto[]
  featured: PostDto[]
  page: number
  pageSize: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  loaded: boolean
  lastLoadedAt: number | null
}

export const useHomeStore = defineStore('home', {
  state: (): HomeState => ({
    posts: [],
    pinned: [],
    featured: [],
    page: 0,
    pageSize: +useRuntimeConfig().public.pageSize || 20,
    hasMore: false,
    loading: false,
    loadingMore: false,
    loaded: false,
    lastLoadedAt: null,
  }),
  getters: {
    hasData: (s) => s.loaded && s.posts.length > 0,
  },
  actions: {
    shouldRefresh(maxAge = REFRESH_TTL) {
      if (!this.loaded || !this.lastLoadedAt) return true
      return Date.now() - this.lastLoadedAt > maxAge
    },

    async refreshIfStale(maxAge = REFRESH_TTL) {
      if (this.loading || !this.shouldRefresh(maxAge)) {
        return
      }
      await this.forceRefresh()
    },

    async initialLoad() {
      if (this.loading) return
      if (!this.loaded) {
        await this.forceRefresh()
        return
      }
      await this.refreshIfStale()
    },

    async forceRefresh() {
      if (this.loading) return
      this.loading = true
      try {
        const api = useNuxtApp().$api
        const auth = useAuthStore()
        const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
        const pageSize = this.pageSize || 20

        const params = {
          page: 1,
          page_size: pageSize,
        }

        // ✅ 优化：只发起一个请求，帖子数据已包含is_pinned和is_featured信息
        const listResp = await api.listPosts(params)

        const rawItems = extractItems(listResp)
        const normalizedItems = dedupeById(rawItems.map(normalizePost))
        const filteredPosts = canModerate
          ? normalizedItems
          : normalizedItems.filter((p: PostDto) => p.status === 0)

        // ✅ 刷新时始终替换数据，重置到第一页 (后端已排序,前端不再排序)
        this.posts = filteredPosts
        this.page = 1
        this.hasMore = rawItems.length === pageSize
        this.loaded = true
        this.lastLoadedAt = Date.now()

      } catch (error) {
        console.error('HomeStore: Failed to refresh posts:', error)

        if (import.meta.client) {
          const toast = useToast()
          toast.error('刷新失败，请稍后重试')
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async refresh() {
      await this.forceRefresh()
    },

    async loadMore() {
      if (!this.loaded || !this.hasMore || this.loadingMore) return
      this.loadingMore = true
      try {
        const api = useNuxtApp().$api
        const auth = useAuthStore()
        const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
        const pageSize = this.pageSize || 20
        const next = this.page + 1

        const params = {
          page: next,
          page_size: pageSize,
        }

        const listResp: Pagination<PostDto> = await api.listPosts(params)

        const itemsRaw = extractItems(listResp)
        const items = dedupeById(itemsRaw.map(normalizePost))
        const newPosts = canModerate
          ? items
          : items.filter((p: PostDto) => p.status === 0)

        const existingIds = new Set(this.posts.map((post) => post.id))
        const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id))

        // 后端已排序,直接追加新帖子
        if (uniqueNewPosts.length > 0) {
          this.posts = [...this.posts, ...uniqueNewPosts]
        }
        this.page = next
        this.hasMore = itemsRaw.length === pageSize
      } catch (error) {
        console.error('Failed to load more posts:', error)
        if (import.meta.client) {
          const toast = useToast()
          toast.error('加载更多失败，请稍后重试')
        }
        throw error
      } finally {
        this.loadingMore = false
      }
    },
  }
})
