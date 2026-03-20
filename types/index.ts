// API Response Types
export type ApiResp<T> =
  | { success: true; data: T; trace_id: string }
  | { success: false; error: ApiError; trace_id: string }

export interface ApiError {
  code: string
  message: string
  extras?: Record<string, any>
  trace?: string
}

// User Types
export interface User {
  id: string
  username: string
  display_name?: string | null
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  bio?: string | null
  is_superadmin: boolean
  is_admin: boolean
  status: number
  is_banned: boolean
  ban_reason?: string | null
  banned_at?: string | null
  last_login_at?: string | null
  last_ip?: string | null
  metadata?: string | Record<string, unknown> | null
  permissions?: string[]
  follower_count?: number
  following_count?: number
  active_tag?: Pick<TagDto, 'id' | 'name' | 'title' | 'background_color' | 'text_color' | 'description' | 'css_styles' | 'tag_type'> | null
  created_at: string
  updated_at: string
  is_deleted?: boolean
}

export interface UserProfile {
  user: User
  permissions: string[]
}

// Tag Types
export interface TagDto {
  id: string
  name: string
  title: string
  tag_type?: 'personal' | 'collective'
  background_color: string
  text_color: string
  description?: string | null
  css_styles?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserTagDto {
  user_tag_id: string
  is_active: boolean
  obtained_at: string
  status: string
  tag?: Pick<TagDto, 'id' | 'name' | 'title' | 'background_color' | 'text_color' | 'description' | 'is_active' | 'created_at' | 'updated_at' | 'css_styles' | 'tag_type'>
}

// Post Types
export interface PostSummary {
  id: string
  author_id?: string
  author_name: string
  author_display_name?: string | null
  author_avatar_url?: string | null
  target_name?: string | null
  content: string
  card_type?: 'confession' | 'social'
  created_at: string
}

export interface PostDto {
  id: string
  author_id: string
  author_name: string
  target_name: string
  content: string
  card_type?: 'confession' | 'social'
  images: string[]
  status: 0 | 1
  is_pinned: boolean
  is_featured: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  author_tag?: Pick<TagDto, 'name' | 'title' | 'background_color' | 'text_color' | 'css_styles'>
  is_author_admin?: boolean
  moderation_reason?: string | null
  view_count?: number
  comment_count?: number
  like_count?: number
  repost_count?: number
  quote_count?: number
  reply_count?: number
  liked_by_me?: boolean
  reply_to_id?: string | null
  repost_of_id?: string | null
  quote_of_id?: string | null
  reply_to?: PostSummary | null
  repost_of?: PostSummary | null
  quote_of?: PostSummary | null
  mentions?: Array<{ user_id: string; username: string }>
  audit_status?: 0 | 1
  is_pending_review?: boolean
  audit_msg?: string | null
  manual_review_requested?: boolean
  author_avatar_url?: string | null
  author_display_name?: string | null
  author_is_online?: boolean
  author_last_heartbeat?: string | null
  author_is_deleted?: boolean
  author_deleted?: boolean
}

export interface PostStats {
  id: string
  view_count: number
  comment_count: number
  like_count: number
  repost_count: number
  quote_count: number
  reply_count: number
}

// Legacy comment types kept for backward compatibility in non-migrated screens
export interface CommentDto {
  id: string
  post_id: string
  user_id: string
  user_username: string
  user_display_name?: string | null
  user_avatar_url?: string | null
  is_user_admin?: boolean
  user_is_online?: boolean
  user_last_heartbeat?: string | null
  content: string
  status: 0 | 1
  is_pinned: boolean
  created_at: string
  updated_at?: string
  user_tag?: Pick<TagDto, 'name' | 'title' | 'background_color' | 'text_color' | 'css_styles'>
}

// Announcement Types
export interface AnnouncementDto {
  id: string
  path: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Redemption Code Types
export interface RedemptionCodeDto {
  id: string
  code: string
  tag_id: string
  tag?: TagDto
  is_used: boolean
  used_by?: string | null
  used_at?: string | null
  expires_at?: string | null
  batch_id?: string | null
  created_at: string
  updated_at: string
}

// Pagination Types
export interface Pagination<T> {
  total: number
  items: T[]
  page: number
  page_size: number
}

// Form Types
export interface LoginForm {
  username: string
  password: string
  captcha_id?: string
  captcha_data?: {
    dots?: Array<{ x: number; y: number }>
    x?: number
    angle?: number
  }
}

export interface RegisterForm {
  username: string
  password: string
  captcha_id?: string
  captcha_data?: {
    dots?: Array<{ x: number; y: number }>
    x?: number
    angle?: number
  }
}

export interface PostForm {
  author_name: string
  target_name: string
  content: string
  card_type?: 'confession' | 'communication' | 'social'
  images: File[]
}

export interface CommentForm {
  content: string
}

export interface AnnouncementForm {
  path: string
  content: string
  is_active: boolean
}

export interface TagForm {
  name: string
  title: string
  background_color?: string
  backgroundColor?: string
  text_color?: string
  textColor?: string
  description?: string | null
  css_styles?: string | null
  cssStyles?: string | null
  tag_type?: 'personal' | 'collective'
  tagType?: 'personal' | 'collective'
  is_active?: boolean
  isActive?: boolean
}

export interface GenerateCodesForm {
  tag_id: string
  count: number
  expires_at?: string
}

export interface RedeemForm {
  code: string
}

export interface UpdateProfileForm {
  display_name?: string | null
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar?: File | null
}

export interface ChangePasswordForm {
  old_password: string
  new_password: string
  confirm_password: string
}

export interface AdminUpdateUserForm {
  username?: string
  display_name?: string | null
  email?: string | null
  phone?: string | null
  bio?: string | null
  avatar?: File | null
  avatar_base64?: string
  password?: string
  old_password?: string
}

export interface AdminChangePasswordForm {
  new_password: string
  confirm_password: string
}

export interface AdminBanUserForm {
  reason: string
}

// Auth Types
export interface AuthResponse {
  user: User
  access_token: string
}

export interface RedeemResponse {
  success: boolean
  message: string
  user_tag: UserTagDto
}

// Tag status simple type
export interface TagSimple {
  id: string
  name: string
  title: string
  is_active: boolean
}

export interface MyActiveTagStatusResponse {
  has_active: boolean
  current_tag_enabled: boolean
  tag?: TagSimple & { user_deleted?: boolean }
  status: 'active' | 'tag_disabled'
}

export interface MyTagStatusResponse {
  enabled: boolean
  status: 'active' | 'tag_disabled'
  tag: TagSimple
}

export interface DeleteRedemptionCodesRequest {
  ids?: string[]
  codes?: string[]
}

export interface DeleteRedemptionCodesResponse {
  deleted: number
}

// Permission constants
export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_POSTS: 'MANAGE_POSTS',
  MANAGE_TAGS: 'MANAGE_TAGS',
  MANAGE_ANNOUNCEMENTS: 'MANAGE_ANNOUNCEMENTS',
  MANAGE_FEATURED: 'MANAGE_FEATURED',
} as const

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// UI State Types
export interface LoadingState {
  loading: boolean
  error: string | null
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// Log Types
export interface LogEntry {
  id: string
  user_id?: string
  admin_id?: string
  action: string
  object_type: string
  object_id?: string | null
  metadata?: string | null
  created_at: string
  ip?: string | null
  user_agent?: string | null
  parsedMetadata?: Record<string, unknown>
}

export interface LogFilters {
  user_id?: string
  admin_id?: string
  action?: string
  object_type?: string
  object_id?: string
  q?: string
  from?: string
  to?: string
  page?: number
  page_size?: number
}

// Heartbeat Types
export interface HeartbeatResponse {
  online: boolean
  timestamp: string
  unread_notifications?: number
}

export interface UserOnlineStatus {
  user_id: string
  online: boolean
  last_heartbeat: string
}

export interface MyOnlineStatus {
  online: boolean
  last_heartbeat: string
  expires_at?: string
  token_expires_at?: string
}
