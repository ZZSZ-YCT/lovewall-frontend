import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { 
  ApiResp, 
  User, 
  UserProfile, 
  AuthResponse, 
  PostDto, 
  CommentDto, 
  AnnouncementDto, 
  TagDto, 
  UserTagDto,
  RedemptionCodeDto,
  Pagination,
  LoginForm,
  RegisterForm,
  CommentForm,
  AnnouncementForm,
  TagForm,
  GenerateCodesForm,
  RedeemForm,
  RedeemResponse,
  ChangePasswordForm,
  AdminChangePasswordForm,
  AdminUpdateUserForm,
  LogEntry,
  LogFilters,
  MyActiveTagStatusResponse,
  MyTagStatusResponse,
  DeleteRedemptionCodesRequest,
  DeleteRedemptionCodesResponse,
  HeartbeatResponse,
  UserOnlineStatus,
  MyOnlineStatus
} from '~/types'
import type { ActiveTagDto, NotificationDto, UserStatusDto } from '~/types/extra'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string
  
  // 生成设备指纹ID的简单函数
  const generateDeviceId = (): string => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return ''
    }
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Device fingerprint', 2, 2)
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|')
      
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      
      return Math.abs(hash).toString(16).padStart(8, '0')
    } catch (error) {
      return Math.random().toString(16).slice(2, 10)
    }
  }
  
  // Decide whether to send credentials based on same-origin
  let withCredentials = true
  if (import.meta.client) {
    try {
      if (/^https?:\/\//i.test(baseURL)) {
        const u = new URL(baseURL)
        withCredentials = (u.origin === window.location.origin)
      }
    } catch {}
  }

  // Normalize base: ensure single trailing slash so that 'posts' -> '/api/posts'
  const normBase = (() => {
    if (!baseURL) return ''
    return baseURL.endsWith('/') ? baseURL : baseURL + '/'
  })()

  // Create axios instance
  const instance: AxiosInstance = axios.create({
    baseURL: normBase,
    withCredentials: withCredentials,
    timeout: 30000,
  })

  // Request interceptor
  instance.interceptors.request.use((config) => {
    // Add auth token if available
    const authStore = useAuthStore()
    const cookies = useSessionCookies()
    const token = authStore.accessToken || cookies.token.value
    config.headers = config.headers || {}
    if (token) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
    
    // 添加设备指纹识别头
    if (import.meta.client) {
      // 尝试获取设备指纹ID
      const deviceId = cookies.deviceId?.value || generateDeviceId()
      if (deviceId) {
        ;(config.headers as any)['X-Device-ID'] = deviceId
        // 保存到cookie以便下次使用
        if (!cookies.deviceId?.value) {
          cookies.deviceId.value = deviceId
        }
      }
    }
    
    // Ensure endpoint doesn't start with '/'
    if (typeof config.url === 'string') {
      config.url = config.url.replace(/^\/+/, '')
    }
    return config
  })

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResp<any>>) => response,
    (error) => {
      console.error(error)

      const responseData = (error?.response?.data ?? {}) as Record<string, unknown>
      const status = error?.response?.status
      const trace = responseData?.trace_id as string | undefined
      const code = (responseData?.error as any)?.code as string | undefined
      const rawExtras = responseData?.extras ?? (responseData?.error as any)?.extras
      let extras: Record<string, unknown> | undefined
      if (typeof rawExtras === 'string') {
        try {
          extras = JSON.parse(rawExtras)
        } catch {
          extras = undefined
        }
      } else if (rawExtras && typeof rawExtras === 'object') {
        extras = rawExtras as Record<string, unknown>
      }

      let message = (responseData?.error as any)?.message || 'Request failed'
      const messageLower = typeof message === 'string' ? message.toLowerCase() : ''

      if (!error.response) {
        message = '网络连接失败，请检查您的网络连接'
      } else if (status === 500) {
        message = '服务器内部错误，请稍后重试'
      } else if (status === 503) {
        message = '服务暂时不可用，请稍后重试'
      } else if (status === 429) {
        message = '请求过于频繁，请稍后重试'
      }

      const isActiveTagNotFound = status === 404 &&
        (error.config?.url?.includes('active-tag') || message === 'active tag not found')

      const resolveFlag = (source: Record<string, unknown> | undefined, ...keys: string[]): boolean => {
        if (!source) return false
        for (const key of keys) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            return Boolean((source as any)[key])
          }
        }
        return false
      }

      const isDeletedFlag = resolveFlag(extras, 'is_deleted', 'isDeleted') || resolveFlag(responseData, 'is_deleted', 'isDeleted')
      const isBannedFlag = resolveFlag(extras, 'banned', 'isBanned') || resolveFlag(responseData, 'banned', 'isBanned')
      const banReason = (extras?.ban_reason as string) || (responseData?.ban_reason as string) || message

      const toast = useToast()
      const auth = useAuthStore()

      if (status === 403) {
        if (code === 'ACCOUNT_DELETED' || isDeletedFlag || messageLower.includes('account has been deleted')) {
          auth.clearSession?.({
            toastMessage: '账号已注销不可用，请联系管理员',
            toastType: 'error',
            redirectTo: '/auth/login'
          })
          return Promise.reject({ ...error, code, trace, message })
        }

        if (code === 'BANNED' || isBannedFlag || messageLower.includes('account has been banned')) {
          toast.error(banReason || '账号已被封禁')
          return Promise.reject({ ...error, code, trace, message })
        }
      }

      if (!isActiveTagNotFound) {
        toast.error(`${message}${trace ? ` · ${trace}` : ''}`)
      }

      return Promise.reject({
        ...error,
        code,
        trace,
        message
      })
    }
  )

  const unwrap = <T>(res: AxiosResponse<ApiResp<T>>): T => {
    const body = res.data as ApiResp<T>
    if ((body as any)?.success) return (body as any).data as T
    const msg = (body as any)?.error?.message || '请求失败'
    throw new Error(msg)
  }

  // 辅助函数：转换评论对象（兼容camelCase和snake_case）
  // ✅ 后端API v3.3已返回snake_case，此函数主要用于向后兼容
  const normalizeComment = (comment: any): any => {
    // 如果已经是snake_case格式，直接返回
    if (comment.user_avatar_url !== undefined || comment.user_display_name !== undefined) {
      return comment
    }

    // 否则转换camelCase为snake_case（向后兼容）
    return {
      ...comment,
      user_display_name: comment.userDisplayName ?? null,
      user_avatar_url: comment.userAvatarUrl ?? null,
      user_username: comment.userUsername ?? null,
      is_user_admin: comment.isUserAdmin ?? false,
      user_is_online: comment.userIsOnline ?? false,
      user_last_heartbeat: comment.userLastHeartbeat ?? null,
      user_tag: comment.userTag ?? null
    }
  }

  // API methods
  const api = {
    // Authentication
    async register(data: RegisterForm): Promise<AuthResponse> {
      const response = await instance.post<ApiResp<AuthResponse>>('/register', data)
      return unwrap(response)
    },

    async login(data: LoginForm): Promise<AuthResponse> {
      const response = await instance.post<ApiResp<AuthResponse>>('/login', data)
      return unwrap(response)
    },

    async logout(): Promise<{ ok: boolean }> {
      const response = await instance.post<ApiResp<{ ok: boolean }>>('/logout')
      return unwrap(response)
    },

    async getProfile(): Promise<UserProfile> {
      const response = await instance.get<ApiResp<UserProfile>>('/profile')
      return unwrap(response)
    },

    async getMyOnlineStatus(): Promise<MyOnlineStatus> {
      const response = await instance.get<ApiResp<MyOnlineStatus>>('users/me/online')
      return unwrap(response)
    },

    // 心跳接口
    async heartbeat(): Promise<HeartbeatResponse> {
      const response = await instance.post<ApiResp<HeartbeatResponse>>('heartbeat')
      return unwrap(response)
    },

    // 查询任意用户在线状态 (公开接口)
    async getUserOnlineStatus(userId: string): Promise<UserOnlineStatus> {
      const response = await instance.get<ApiResp<UserOnlineStatus>>(`users/${userId}/online`)
      return unwrap(response)
    },

    async getOnlineStatus(): Promise<MyOnlineStatus> {
      return this.getMyOnlineStatus()
    },

    async updateProfile(data: any): Promise<User> {
      const requestData: any = {}
      
      // 只包含有变化的字段
      if (data.display_name !== undefined) {
        requestData.display_name = data.display_name ?? null
      }
      if (data.email !== undefined) {
        requestData.email = data.email ?? null
      }
      if (data.phone !== undefined) {
        requestData.phone = data.phone ?? null
      }
      if (data.bio !== undefined) {
        requestData.bio = data.bio ?? null
      }
      if (data.avatar) {
        // 转换为base64格式
        requestData.avatar_base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(data.avatar)
        })
      }
      
      const response = await instance.patch<ApiResp<User>>('/profile', requestData)

      return unwrap(response)
    },

    async changePassword(data: ChangePasswordForm): Promise<void> {
      // 204 No Content on success
      await instance.put('/me/password', {
        old_password: data.old_password,
        new_password: data.new_password,
      })
    },

    async getUser(id: string): Promise<User> {
      const response = await instance.get<ApiResp<User>>(`/users/${id}`)
      return unwrap(response)
    },

    async getUserByUsername(username: string): Promise<User> {
      const response = await instance.get<ApiResp<User>>(`/users/by-username/${username}`)
      return unwrap(response)
    },

    // User existence status (never 404)
    async getUserStatus(userId: string): Promise<UserStatusDto> {
      const response = await instance.get<ApiResp<UserStatusDto>>(`/users/${userId}/status`)
      return unwrap(response)
    },
    async getUserStatusByUsername(username: string): Promise<UserStatusDto> {
      const response = await instance.get<ApiResp<UserStatusDto>>(`/users/by-username/${username}/status`)
      return unwrap(response)
    },

    async getUserPosts(userId: string, params: { page?: number; page_size?: number } = {}): Promise<Pagination<PostDto>> {
  const response = await instance.get<ApiResp<Pagination<PostDto>>>(`/users/${userId}/posts`, { params })
  return unwrap(response)
},

    // Posts
    async listPosts(params: {
      page?: number
      page_size?: number
      featured?: boolean
      pinned?: boolean
    } = {}): Promise<Pagination<PostDto>> {
      const response = await instance.get<ApiResp<Pagination<PostDto>>>('/posts', { params })
      return unwrap(response)
    },

    async getPost(id: string): Promise<PostDto> {
      const response = await instance.get<ApiResp<PostDto>>(`/posts/${id}`)
      return unwrap(response)
    },
    
    // 管理员获取帖子详情（包含审核信息）
    async getPostForAdmin(id: string): Promise<PostDto> {
      const response = await instance.get<ApiResp<PostDto>>(`/posts/${id}`, {
        params: { admin_view: 'true' }
      })
      return unwrap(response)
    },
    async getPostStats(id: string): Promise<{ id: string; view_count: number; comment_count: number }> {
      const response = await instance.get<ApiResp<{ id: string; view_count: number; comment_count: number }>>(`/posts/${id}/stats`)
      return unwrap(response)
    },

    async createPost(formData: FormData): Promise<PostDto> {
      const response = await instance.post<ApiResp<PostDto>>('/posts', formData)
      return unwrap(response)
    },
    
    async requestPostReview(id: string): Promise<void> {
      await instance.post(`/posts/${id}/request-review`)
    },

    async requestCommentReview(commentId: string): Promise<void> {
      await instance.post(`/comments/${commentId}/request-review`)
    },

    async updatePost(postId: string, data: { author_name?: string; target_name?: string; content?: string }): Promise<PostDto> {
      const response = await instance.put<ApiResp<PostDto>>(`/posts/${postId}`, data)
      return unwrap(response)
    },

    async deletePost(id: string, reason?: string): Promise<{ id: string; deleted: boolean }> {
      const response = await instance.delete<ApiResp<{ id: string; deleted: boolean }>>(`/posts/${id}`, {
        params: reason ? { reason } : undefined
      })
      return unwrap(response)
    },
    
    // Moderation: list posts with all statuses (admin)
    async moderationPosts(params: {
      status?: 0 | 1 | 2
      author_id?: string
      featured?: boolean
      pinned?: boolean
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<PostDto>> {
      const response = await instance.get<ApiResp<Pagination<PostDto>>>('/posts/moderation', { params })
      return unwrap(response)
    },
    
    // Moderation: restore post from deleted -> public
    async restorePost(id: string): Promise<{ id: string; status: number }> {
      const response = await instance.post<ApiResp<{ id: string; status: number }>>(`/posts/${id}/restore`)
      return unwrap(response)
    },

    async pinPost(id: string, pin: boolean, reason?: string): Promise<{ id: string; is_pinned: boolean }> {
      const payload = reason ? { pin, reason } : { pin }
      const response = await instance.post<ApiResp<{ id: string; is_pinned: boolean }>>(`/posts/${id}/pin`, payload)
      return unwrap(response)
    },

    async featurePost(id: string, feature: boolean, reason?: string): Promise<{ id: string; is_featured: boolean }> {
      const payload = reason ? { feature, reason } : { feature }
      const response = await instance.post<ApiResp<{ id: string; is_featured: boolean }>>(`/posts/${id}/feature`, payload)
      return unwrap(response)
    },

    async lockPost(postId: string): Promise<{ id: string; is_locked: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; is_locked: boolean }>>(`/admin/posts/${postId}/lock`)
      return unwrap(response)
    },

    async unlockPost(postId: string): Promise<{ id: string; is_locked: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; is_locked: boolean }>>(`/admin/posts/${postId}/unlock`)
      return unwrap(response)
    },

    async getPostLockStatus(postId: string): Promise<{ id: string; is_locked: boolean }> {
      const response = await instance.get<ApiResp<{ id: string; is_locked: boolean }>>(`/posts/${postId}/lock-status`)
      return unwrap(response)
    },

    async hidePost(id: string, hide: boolean, reason?: string): Promise<{ id: string; status: number }> {
      const payload = reason ? { hide, reason } : { hide }
      const response = await instance.post<ApiResp<{ id: string; status: number }>>(`/posts/${id}/hide`, payload)
      return unwrap(response)
    },

    /*
    * About the changes:
    * Use an API proxy to enable swr in order to optimize the data loading speed
    * Now the comments data is cached
    * */
    // Comments
    async listComments(postId: string, params: {
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<CommentDto>> {
      const response = await instance.get<ApiResp<Pagination<CommentDto>>>(`/posts/${postId}/comments`, { params })
      const data = unwrap(response)
      data.items = data.items.map(normalizeComment)
      return data
    },

    async createComment(postId: string, data: CommentForm): Promise<CommentDto> {
      const response = await instance.post<ApiResp<CommentDto>>(`/posts/${postId}/comments`, data)
      const comment = unwrap(response)
      return normalizeComment(comment)
    },

    async updateComment(id: string, data: CommentForm): Promise<CommentDto> {
      const response = await instance.put<ApiResp<CommentDto>>(`/comments/${id}`, data)
      return unwrap(response)
    },

    async deleteComment(id: string): Promise<void> {
      await instance.delete(`/comments/${id}`)
    },

    async hideComment(id: string, hide: boolean): Promise<{ id: string; status: number }> {
      const response = await instance.post<ApiResp<{ id: string; status: number }>>(`/comments/${id}/hide`, { hide })
      return unwrap(response)
    },

    async pinComment(commentId: string): Promise<{ id: string; is_pinned: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; is_pinned: boolean }>>(`/admin/comments/${commentId}/pin`)
      return unwrap(response)
    },

    async unpinComment(commentId: string): Promise<{ id: string; is_pinned: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; is_pinned: boolean }>>(`/admin/comments/${commentId}/unpin`)
      return unwrap(response)
    },

    async getMyComments(params: {
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<CommentDto>> {
      const response = await instance.get<ApiResp<Pagination<CommentDto>>>('/my/comments', { params })
      const data = unwrap(response)
      data.items = data.items.map(normalizeComment)
      return data
    },

    // Admin: list comments (alias used by pages)
    async getAdminComments(params: {
      post_id?: string
      user_id?: string
      status?: 0 | 1
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<CommentDto>> {
      const response = await instance.get<ApiResp<Pagination<CommentDto>>>('/comments', { params })
      const data = unwrap(response)
      data.items = data.items.map(normalizeComment)
      return data
    },

    async adminComments(params: {
      post_id?: string
      user_id?: string
      status?: 0 | 1
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<CommentDto>> {
      const response = await instance.get<ApiResp<Pagination<CommentDto>>>('/comments', { params })
      const data = unwrap(response)
      data.items = data.items.map(normalizeComment)
      return data
    },

    // Announcements
    async listAnnouncements(): Promise<AnnouncementDto[]> {
      const response = await instance.get<ApiResp<AnnouncementDto[]>>('/announcements')
      return unwrap(response)
    },
    async listAnnouncementsAdmin(): Promise<AnnouncementDto[]> {
      const response = await instance.get<ApiResp<AnnouncementDto[]>>('/announcements/admin')
      return unwrap(response)
    },

    async createAnnouncement(data: AnnouncementForm): Promise<AnnouncementDto> {
      const response = await instance.post<ApiResp<AnnouncementDto>>('/announcements', data)
      return unwrap(response)
    },

    async updateAnnouncement(id: string, data: Partial<AnnouncementForm>): Promise<AnnouncementDto> {
      const response = await instance.put<ApiResp<AnnouncementDto>>(`/announcements/${id}`, data)
      return unwrap(response)
    },

    async deleteAnnouncement(id: string): Promise<void> {
      await instance.delete(`/announcements/${id}`)
    },

    // Users & Permissions (Admin)
    async listUsers(params: {
      q?: string
      status?: number
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<User>> {
      const response = await instance.get<ApiResp<Pagination<User>>>('/users', { params })
      return unwrap(response)
    },
    
    // Admin: delete user (superadmin only)
    async adminDeleteUser(userId: string): Promise<void> {
      await instance.delete(`/admin/users/${userId}`)
    },

    async setUserPerms(id: string, data: { permissions: string[] }): Promise<void> {
      await instance.post(`/users/${id}/permissions`, data)
    },

    async updateUser(id: string, data: AdminUpdateUserForm): Promise<User> {
      const requestData: any = {}
      
      // 只包含有变化的字段
      if (data.username !== undefined) requestData.username = data.username
      if (data.display_name !== undefined) requestData.display_name = data.display_name || null
      if (data.email !== undefined) requestData.email = data.email || null
      if (data.phone !== undefined) requestData.phone = data.phone || null
      if (data.bio !== undefined) requestData.bio = data.bio || null
      if (data.avatar_base64 !== undefined) requestData.avatar_base64 = data.avatar_base64
      if (data.password !== undefined) requestData.password = data.password
      if (data.old_password !== undefined) requestData.old_password = data.old_password
      
      const response = await instance.put<ApiResp<User>>(`/users/${id}`, requestData)
      return unwrap(response)
    },

    async adminChangePassword(userId: string, data: AdminChangePasswordForm): Promise<void> {
      // 204 No Content on success
      await instance.put(`/admin/users/${userId}/password`, {
        new_password: data.new_password,
      })
    },

    // User ban/unban methods
    async banUser(userId: string, data: { reason: string }): Promise<{ id: string; is_banned: boolean; ban_reason: string }> {
      const response = await instance.post<ApiResp<{ id: string; is_banned: boolean; ban_reason: string }>>(`/admin/users/${userId}/ban`, data)
      return unwrap(response)
    },

    async unbanUser(userId: string): Promise<{ id: string; is_banned: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; is_banned: boolean }>>(`/admin/users/${userId}/unban`)
      return unwrap(response)
    },

    // Tags
    async listTags(params: {
      active?: boolean
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<TagDto>> {
      const response = await instance.get<ApiResp<Pagination<TagDto>>>('/tags', { params })
      return unwrap(response)
    },

    async getTag(id: string): Promise<TagDto> {
      const response = await instance.get<ApiResp<TagDto>>(`/tags/${id}`)
      return unwrap(response)
    },

    async createTag(data: TagForm): Promise<TagDto> {
      const response = await instance.post<ApiResp<TagDto>>('/tags', data)
      return unwrap(response)
    },

    async updateTag(id: string, data: Partial<TagForm>): Promise<TagDto> {
      const response = await instance.put<ApiResp<TagDto>>(`/tags/${id}`, data)
      return unwrap(response)
    },

    async deleteTag(id: string): Promise<void> {
      await instance.delete(`/tags/${id}`)
    },

    // Redemption Codes
    async generateCodes(data: GenerateCodesForm): Promise<{
      batch_id: string
      tag: TagDto
      count: number
      codes: RedemptionCodeDto[]
    }> {
      const response = await instance.post<ApiResp<{
        batch_id: string
        tag: TagDto
        count: number
        codes: RedemptionCodeDto[]
      }>>('/tags/generate-codes', data)
      return unwrap(response)
    },

    async listCodes(params: {
      tag_id?: string
      batch_id?: string
      used?: boolean
      page?: number
      page_size?: number
    } = {}): Promise<Pagination<RedemptionCodeDto>> {
      const response = await instance.get<ApiResp<Pagination<RedemptionCodeDto>>>('/redemption-codes', { params })
      return unwrap(response)
    },

    async redeem(data: RedeemForm): Promise<RedeemResponse> {
      const response = await instance.post<ApiResp<RedeemResponse>>('/redeem', data)
      return unwrap(response)
    },

    // User Tags
    async getMyTags(all?: boolean): Promise<Pagination<UserTagDto>> {
      const params = all ? { all: true } : {}
      const response = await instance.get<ApiResp<Pagination<UserTagDto>>>('/my/tags', { params })
      return unwrap(response)
    },

    async getMyActiveTagStatus(): Promise<MyActiveTagStatusResponse> {
      const response = await instance.get<ApiResp<MyActiveTagStatusResponse>>('/my/tags/current-status')
      return unwrap(response)
    },

    async getMyTagStatus(tagId: string): Promise<MyTagStatusResponse> {
      const response = await instance.get<ApiResp<MyTagStatusResponse>>(`/my/tags/${tagId}/status`)
      return unwrap(response)
    },

    async activateTag(tagId: string): Promise<void> {
      await instance.post(`/my/tags/${tagId}/activate`)
    },

    async deactivateTag(tagId: string): Promise<void> {
      await instance.post(`/my/tags/${tagId}/deactivate`)
    },

    // Get active tag by user ID or username
    async getUserActiveTag(userId: string): Promise<ActiveTagDto | null> {
      try {
        const response = await instance.get<ApiResp<ActiveTagDto>>(`/users/${userId}/active-tag`)
        return unwrap(response)
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },

    async getUserActiveTagByUsername(username: string): Promise<ActiveTagDto | null> {
      try {
        const response = await instance.get<ApiResp<ActiveTagDto>>(`/users/by-username/${username}/active-tag`)
        return unwrap(response)
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },

    // Admin user tag management
    async adminAssignUserTag(userId: string, tagId: string, data?: { active?: boolean }): Promise<void> {
      await instance.post(`/admin/users/${userId}/tags/${tagId}`, data || {})
    },

    async adminRemoveUserTag(userId: string, tagId: string): Promise<void> {
      await instance.delete(`/admin/users/${userId}/tags/${tagId}`)
    },

    async adminGetUserTags(userId: string): Promise<Pagination<UserTagDto>> {
      const response = await instance.get<ApiResp<Pagination<UserTagDto>>>(`/admin/users/${userId}/tags`)
      return unwrap(response)
    },

    // Redemption codes - get by code
    async getCodeByCode(code: string): Promise<RedemptionCodeDto> {
      const response = await instance.get<ApiResp<RedemptionCodeDto>>(`/redemption-codes/by-code/${code}`)
      return unwrap(response)
    },

    // Admin metrics
    async getAdminMetrics(): Promise<{ since: string; total_users: number; total_posts: number; total_comments: number; today_new_users: number; today_new_posts: number; today_comments: number }> {
      const response = await instance.get<ApiResp<{ since: string; total_users: number; total_posts: number; total_comments: number; today_new_users: number; today_new_posts: number; today_comments: number }>>('/admin/metrics/overview')
      return unwrap(response)
    },

    // Admin logs (only for superadmin)
    async getSubmissionLogs(filters: LogFilters = {}): Promise<Pagination<LogEntry>> {
      const response = await instance.get<ApiResp<Pagination<LogEntry>>>('/admin/logs/submissions', { params: filters })
      return unwrap(response)
    },

    async getOperationLogs(filters: LogFilters = {}): Promise<Pagination<LogEntry>> {
      const response = await instance.get<ApiResp<Pagination<LogEntry>>>('/admin/logs/operations', { params: filters })
      return unwrap(response)
    },

    // Admin: delete redemption codes (only unused)
    async deleteRedemptionCodes(payload: DeleteRedemptionCodesRequest): Promise<DeleteRedemptionCodesResponse> {
      const response = await instance.delete<ApiResp<DeleteRedemptionCodesResponse>>('/redemption-codes', { data: payload })
      return unwrap(response)
    },

    // Notifications
    async listNotifications(params: { page?: number; page_size?: number } = {}): Promise<Pagination<NotificationDto>> {
      const response = await instance.get<ApiResp<Pagination<NotificationDto>>>('/notifications', { params })
      return unwrap(response)
    },
    async markNotificationRead(id: string): Promise<void> {
      await instance.post(`/notifications/${id}/read`)
    },

    // Admin moderation for posts
    async adminApprovePost(id: string): Promise<{ id: string; approved: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; approved: boolean }>>(`/admin/posts/${id}/approve`)
      return unwrap(response)
    },
    async adminRejectPost(id: string, reason?: string): Promise<{ id: string; rejected: boolean }> {
      const response = await instance.post<ApiResp<{ id: string; rejected: boolean }>>(`/admin/posts/${id}/reject`, { reason })
      return unwrap(response)
    },
  }

  return {
    provide: {
      api
    }
  }
})

