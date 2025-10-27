import { defineStore } from 'pinia'
import type { PostDto, Pagination } from '~/types'

const REFRESH_TTL = 30_000 // 30 seconds cache window

const scorePost = (p: PostDto) => {
  if ((p as any).status === 2) return 5
  if ((p as any).status === 1) return 4
  if (p.is_pinned && p.is_featured) return 0
  if (p.is_pinned) return 1
  if (p.is_featured) return 2
  return 3
}

const createdAtCache = new WeakMap<PostDto, number>()

const getCreatedAt = (post: PostDto) => {
  const cached = createdAtCache.get(post)
  if (cached !== undefined) {
    return cached
  }
  const value = new Date(post.created_at).getTime()
  createdAtCache.set(post, value)
  return value
}

const comparePosts = (a: PostDto, b: PostDto) => {
  const sa = scorePost(a)
  const sb = scorePost(b)
  if (sa !== sb) return sa - sb
  const at = getCreatedAt(a)
  const bt = getCreatedAt(b)
  return bt - at
}

const sortPosts = (posts: PostDto[]) => [...posts].sort(comparePosts)

const mergeSortedPosts = (existing: PostDto[], incoming: PostDto[]) => {
  if (!existing.length) return sortPosts(incoming)
  if (!incoming.length) return existing.slice()

  const sortedIncoming = sortPosts(incoming)
  const merged: PostDto[] = []
  let i = 0
  let j = 0

  while (i < existing.length && j < sortedIncoming.length) {
    if (comparePosts(existing[i], sortedIncoming[j]) <= 0) {
      merged.push(existing[i])
      i++
    } else {
      merged.push(sortedIncoming[j])
      j++
    }
  }

  while (i < existing.length) {
    merged.push(existing[i])
    i++
  }

  while (j < sortedIncoming.length) {
    merged.push(sortedIncoming[j])
    j++
  }

  return merged
}

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
  }
  createdAtCache.set(normalized, new Date(normalized.created_at).getTime())
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

const getPostFingerprint = (post: PostDto) => [
  post.id,
  post.updated_at,
  post.status,
  Number(post.is_pinned),
  Number(post.is_featured),
  post.view_count ?? '',
  post.comment_count ?? '',
  post.moderation_reason ?? '',
  post.audit_status ?? '',
  post.audit_msg ?? '',
  Number(post.manual_review_requested ?? 0),
  Number(post.is_author_admin ?? 0),
].join('|')

const postsAreIdentical = (a: PostDto[], b: PostDto[]) => {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (getPostFingerprint(a[i]) !== getPostFingerprint(b[i])) {
      return false
    }
  }
  return true
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
    page: 1,
    pageSize: +useRuntimeConfig().public.pageSize || 20,
    hasMore: true,
    loading: false,
    loadingMore: false,
    loaded: false,
    lastLoadedAt: null,
  }),
  getters: {
    hasData: (s) => s.loaded && (s.posts.length > 0 || s.pinned.length > 0 || s.featured.length > 0),
    // 全局排序优先级: 置顶+精华 > 置顶 > 精华 > 普通 > 隐藏
    sortedPosts: (s) => sortPosts(s.posts),
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
        const api = useApi()
        const auth = useAuthStore()
        const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
        const pageSize = this.pageSize || 20
        
        // Add timestamp to prevent caching
        const timestamp = Date.now()
        const params = {
          page: 1,
          page_size: pageSize,
          _t: timestamp,
        }
        
        // 简化调用，只使用 listPosts，管理员通过前端筛选
        const [listResp, pinnedResp, featuredResp] = await Promise.all([
          api.listPosts(params),
          api.listPosts({ pinned: true, page_size: 6, _t: timestamp }),
          api.listPosts({ featured: true, page_size: 6, _t: timestamp }),
        ])
        
        const rawItems = extractItems(listResp)
        const normalizedItems = dedupeById(rawItems.map(normalizePost))
        const filteredPosts = canModerate
          ? normalizedItems
          : normalizedItems.filter((p: PostDto) => p.status === 0)
        const sortedPosts = sortPosts(filteredPosts)

        if (!postsAreIdentical(this.posts, sortedPosts)) {
          this.posts = sortedPosts
        }

        const normalizedPinned = dedupeById(extractItems(pinnedResp).map(normalizePost))
        const normalizedFeatured = dedupeById(extractItems(featuredResp).map(normalizePost))
        if (!postsAreIdentical(this.pinned, normalizedPinned)) {
          this.pinned = normalizedPinned
        }
        if (!postsAreIdentical(this.featured, normalizedFeatured)) {
          this.featured = normalizedFeatured
        }
        this.page = 1
        this.hasMore = rawItems.length === pageSize
        this.loaded = true
        this.lastLoadedAt = Date.now()

      } catch (error) {
        console.error('HomeStore: Failed to refresh posts:', error)
        // 显示友好的错误信息
        const toast = useToast()
        toast.error('刷新失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    async refresh() {
      await this.forceRefresh()
    },

    async loadMore() {
      if (!this.hasMore || this.loadingMore) return
      this.loadingMore = true
      try {
        const api = useApi()
        const auth = useAuthStore()
        const canModerate = auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')
        const pageSize = this.pageSize || 20
        const next = this.page + 1
        
        // Add timestamp to prevent caching
        const timestamp = Date.now()
        const params = { 
          page: next, 
          page_size: pageSize,
          _t: timestamp 
        }

        const listResp: Pagination<PostDto> = await api.listPosts(params)

        const itemsRaw = extractItems(listResp)
        const items = dedupeById(itemsRaw.map(normalizePost))
        const newPosts = canModerate
          ? items
          : items.filter((p: PostDto) => p.status === 0)

        const existingIds = new Set(this.posts.map((post) => post.id))
        const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id))

        if (uniqueNewPosts.length > 0) {
          const merged = mergeSortedPosts(this.posts, uniqueNewPosts)
          if (!postsAreIdentical(this.posts, merged)) {
            this.posts = merged
          }
        }
        this.page = next
        this.hasMore = itemsRaw.length === pageSize
      } catch (error) {
        console.error('Failed to load more posts:', error)
        const toast = useToast()
        toast.error('加载更多失败，请稍后重试')
      } finally {
        this.loadingMore = false
      }
    },
  }
})
