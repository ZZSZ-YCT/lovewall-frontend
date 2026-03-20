import { defineStore } from 'pinia'
import type { Pagination, PostDto } from '~/types'

export type HomeFeedType = 'recommended' | 'following'

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

const normalizePostSummary = (post: any) => {
  if (!post) return null
  return {
    id: String(post.id ?? ''),
    author_id: post.author_id ? String(post.author_id) : undefined,
    author_name: String(post.author_name ?? post.author_display_name ?? 'anonymous'),
    author_display_name: post.author_display_name ?? null,
    author_avatar_url: post.author_avatar_url ?? null,
    target_name: post.target_name ?? null,
    content: String(post.content ?? ''),
    card_type: (post.card_type === 'social' ? 'social' : 'confession') as 'confession' | 'social',
    created_at: post.created_at ?? new Date().toISOString(),
  }
}

const normalizePost = (p: any): PostDto => {
  const createdAt = p.created_at ?? new Date().toISOString()
  return {
    id: String(p.id),
    author_id: String(p.author_id ?? p.user_id ?? ''),
    author_name: String(p.author_name ?? p.author_display_name ?? p.author_username ?? 'anonymous'),
    target_name: String(p.target_name ?? p.to_name ?? ''),
    content: String(p.content ?? ''),
    card_type: p.card_type === 'social' ? 'social' : 'confession',
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
    view_count: p.view_count ?? 0,
    comment_count: p.comment_count ?? 0,
    like_count: p.like_count ?? 0,
    repost_count: p.repost_count ?? 0,
    quote_count: p.quote_count ?? 0,
    reply_count: p.reply_count ?? 0,
    liked_by_me: !!p.liked_by_me,
    reply_to_id: p.reply_to_id ?? null,
    repost_of_id: p.repost_of_id ?? null,
    quote_of_id: p.quote_of_id ?? null,
    reply_to: normalizePostSummary(p.reply_to),
    repost_of: normalizePostSummary(p.repost_of),
    quote_of: normalizePostSummary(p.quote_of),
    mentions: Array.isArray(p.mentions) ? p.mentions : [],
    audit_status: p.audit_status,
    audit_msg: p.audit_msg,
    manual_review_requested: p.manual_review_requested,
    is_pending_review: !!p.is_pending_review,
    author_display_name: p.author_display_name ?? null,
    author_avatar_url: p.author_avatar_url ?? null,
    author_is_online: p.author_is_online ?? false,
    author_last_heartbeat: p.author_last_heartbeat ?? null,
    author_is_deleted: !!p.author_is_deleted,
    author_deleted: !!p.author_deleted,
  }
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

let refreshPromise: Promise<void> | null = null

interface HomeState {
  posts: PostDto[]
  page: number
  pageSize: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  loaded: boolean
  error: string | null
  feed: HomeFeedType
}

export const useHomeStore = () => {
  const { t } = useI18n()

  const store = defineStore('home', {
    state: (): HomeState => ({
      posts: [],
      page: 0,
      pageSize: +useRuntimeConfig().public.pageSize || 20,
      hasMore: false,
      loading: false,
      loadingMore: false,
      loaded: false,
      error: null,
      feed: 'recommended',
    }),
    getters: {
      hasData: (s) => s.loaded && s.posts.length > 0,
    },
    actions: {
      reset() {
        this.posts = []
        this.page = 0
        this.hasMore = false
        this.loaded = false
        this.error = null
      },

      async setFeed(feed: HomeFeedType) {
        if (this.feed === feed && this.loaded) return
        this.feed = feed
        this.reset()
        await this.forceRefresh()
      },

      async initialLoad() {
        if (this.loaded || this.loading) return
        await this.forceRefresh()
      },

      async refreshIfStale() {
        if (this.loading && this.loaded) return
        if (refreshPromise) return refreshPromise

        refreshPromise = (async () => {
          if (this.loading) return
          await this.forceRefresh()
        })()

        try {
          await refreshPromise
        } finally {
          refreshPromise = null
        }
      },

      async forceRefresh() {
        if (this.loading) return

        const auth = useAuthStore()
        if (this.feed === 'following' && !auth.isAuthenticated) {
          this.reset()
          this.loaded = true
          return
        }

        this.loading = true
        this.error = null
        try {
          const api = useNuxtApp().$api
          const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
          const pageSize = this.pageSize || 20

          const params = {
            page: 1,
            page_size: pageSize,
            feed: this.feed,
          } as const

          const listResp: Pagination<PostDto> = await api.listPosts(params)
          const rawItems = extractItems(listResp)
          const normalizedItems = dedupeById(rawItems.map(normalizePost))
          const filteredPosts = canModerate
            ? normalizedItems
            : normalizedItems.filter((p) => p.status === 0)

          this.posts = filteredPosts
          this.page = 1
          this.hasMore = rawItems.length === pageSize
          this.loaded = true
        } catch (error: any) {
          console.error('HomeStore: Failed to refresh posts:', error)

          if (this.feed === 'following' && error?.response?.status === 401) {
            this.posts = []
            this.page = 1
            this.hasMore = false
            this.loaded = true
            return
          }

          const message = error?.message || t('error.messages.unknown')
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

        const auth = useAuthStore()
        if (this.feed === 'following' && !auth.isAuthenticated) return

        this.loadingMore = true
        this.error = null
        try {
          const api = useNuxtApp().$api
          const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
          const pageSize = this.pageSize || 20
          const next = this.page + 1

          const listResp: Pagination<PostDto> = await api.listPosts({
            page: next,
            page_size: pageSize,
            feed: this.feed,
          })

          const itemsRaw = extractItems(listResp)
          const items = dedupeById(itemsRaw.map(normalizePost))
          const newPosts = canModerate
            ? items
            : items.filter((p) => p.status === 0)

          const existingIds = new Set(this.posts.map((post) => post.id))
          const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id))

          if (uniqueNewPosts.length > 0) {
            this.posts = [...this.posts, ...uniqueNewPosts]
          }
          this.page = next
          this.hasMore = itemsRaw.length === pageSize
        } catch (error: any) {
          console.error('HomeStore: Failed to load more posts:', error)
          const message = error?.message || t('error.messages.unknown')
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

  return store()
}
