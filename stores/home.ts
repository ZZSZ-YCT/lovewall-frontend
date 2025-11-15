import { defineStore } from 'pinia'
import type { Pagination, PostDto } from '~/types'

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
    is_locked: !!p.is_locked,
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
    // 扩展作者在线状态信息
    author_display_name: p.author_display_name ?? null,
    author_avatar_url: p.author_avatar_url ?? null,
    author_is_online: p.author_is_online ?? false,
    author_last_heartbeat: p.author_last_heartbeat ?? null,
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
  error: string | null
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
    error: null,
  }),
  getters: {
    hasData: (s) => s.loaded && s.posts.length > 0,
  },
  actions: {
    async initialLoad() {
      // 首次进入首页时加载数据（不做 TTL 缓存，只避免并发）
      if (this.loaded || this.loading) return
      await this.forceRefresh()
    },

    async refreshIfStale() {
      // 现在不再按时间判断“是否陈旧”，而是简单地防止并发刷新
      if (this.loading) return
      await this.forceRefresh()
    },

    async forceRefresh() {
      if (this.loading) return
      this.loading = true
      this.error = null
      try {
        const api = useNuxtApp().$api
        const auth = useAuthStore()
        const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
        const pageSize = this.pageSize || 20

        const params = {
          page: 1,
          page_size: pageSize,
        }

        const listResp = await api.listPosts(params)

        const rawItems = extractItems(listResp)
        const normalizedItems = dedupeById(rawItems.map(normalizePost))
        const filteredPosts = canModerate
          ? normalizedItems
          : normalizedItems.filter((p: PostDto) => p.status === 0)

        // 刷新时整体替换为第一页数据（后续通过 loadMore 追加）
        this.posts = filteredPosts
        this.page = 1
        this.hasMore = rawItems.length === pageSize
        this.loaded = true
      } catch (error: any) {
        console.error('HomeStore: Failed to refresh posts:', error)

        const message = error?.message || '刷新失败，请稍后重试'
        this.error = message

        if (import.meta.client) {
          const toast = useToast()
          toast.error(message)
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
      this.error = null
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

        // 追加去重后的新数据
        if (uniqueNewPosts.length > 0) {
          this.posts = [...this.posts, ...uniqueNewPosts]
        }
        this.page = next
        this.hasMore = itemsRaw.length === pageSize
      } catch (error: any) {
        console.error('Failed to load more posts:', error)
        const message = error?.message || '加载更多失败，请稍后重试'
        this.error = message

        if (import.meta.client) {
          const toast = useToast()
          toast.error(message)
        }
        throw error
      } finally {
        this.loadingMore = false
      }
    },
  },
})

