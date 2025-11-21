import type { PermissionType } from '~/types'

// 后端已废弃 MANAGE_COMMENTS，统一改为 MANAGE_POSTS 管理帖子与评论
const ADMIN_BASE_PERMS: PermissionType[] = [
  'MANAGE_USERS',
  'MANAGE_POSTS',
  'MANAGE_FEATURED',
  'MANAGE_ANNOUNCEMENTS',
  'MANAGE_TAGS',
]

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { $i18n } = useNuxtApp()
  const t = $i18n?.t?.bind($i18n)

  const auth = useAuthStore()
  const routePath = to.fullPath

  const log = (stage: string, extra: Record<string, unknown> = {}) => {
    if (!import.meta.dev) return
    console.debug('[require-perms]', {
      stage,
      route: routePath,
      userPerms: auth.permissions,
      isSuperadmin: auth.isSuperadmin,
      ...extra,
    })
  }

  const displayName = (perm: PermissionType): string => {
    const map: Record<string, string> = {
      MANAGE_USERS: t('permission.manage_users'),
      MANAGE_POSTS: t('permission.manage_posts'),
      MANAGE_FEATURED: t('permission.manage_featured'),
      MANAGE_ANNOUNCEMENTS: t('permission.manage_announcements'),
      MANAGE_TAGS: t('permission.manage_tags'),
    }
    return map[perm] || perm
  }

  const formatPerms = (perms: PermissionType[], joiner = '、'): string =>
    perms.map(p => displayName(p)).join(joiner)

  const goBack = (msg?: string) => {
    const toast = useToast()
    toast.error(msg || t('error.messages.403'))
    if (import.meta.client && window.history.length > 1) {
      log('deny: navigate back', { historyLength: window.history.length })
      window.history.back()
      return
    }
    log('deny: fallback home')
    return navigateTo('/')
  }

  if (!auth.initialized) {
    try {
      await auth.initAuth()
      log('initAuth completed')
    } catch (error) {
      console.warn('[require-perms] initAuth failed', error)
      auth.currentUser = null
      auth.accessToken = null
      auth.permissions = []
    }
  }

  if (!auth.isAuthenticated) {
    log('redirect: login required')
    return navigateTo({ path: '/auth/login', query: { redirect: routePath } })
  }

  const metaPerms = to.meta.requiredPerms as PermissionType | PermissionType[] | undefined
  const requiredPerms: PermissionType[] = Array.isArray(metaPerms)
    ? metaPerms.filter((perm): perm is PermissionType => perm.length > 0)
    : metaPerms
      ? [metaPerms]
      : []

  const metaAny = to.meta.anyPerms as PermissionType[] | undefined
  const anyPerms: PermissionType[] = Array.isArray(metaAny)
    ? metaAny.filter((perm): perm is PermissionType => perm.length > 0)
    : []

  const metaAll = to.meta.allPerms as PermissionType[] | undefined
  const allPerms: PermissionType[] = Array.isArray(metaAll)
    ? metaAll.filter((perm): perm is PermissionType => perm.length > 0)
    : []

  if (auth.isSuperadmin) {
    if (requiredPerms.length || to.meta.requiredPerms) {
      log('allow: superadmin bypass', { requiredPerms })
    } else {
      log('allow: superadmin baseline access')
    }
    return
  }

  if (!requiredPerms.length && !anyPerms.length && !allPerms.length) {
    const hasAdmin = auth.hasAnyPerm(ADMIN_BASE_PERMS)
    log('check: admin baseline', { hasAdmin })
    if (!hasAdmin) {
      return goBack(t('error.messages.403'))
    }
    return
  }

  // Check required (all-of)
  if (requiredPerms.length) {
    const hasRequired = auth.hasAllPerms(requiredPerms)
    log('check: required perms', { requiredPerms, hasRequired })
    if (!hasRequired) {
      const missing = requiredPerms.filter(perm => !auth.hasPerm(perm))
      log('deny: missing required perms', { requiredPerms, missing })
      return goBack(t('error.messages.403'))
    }
  }

  // Check any-of
  if (anyPerms.length) {
    const hasAny = auth.hasAnyPerm(anyPerms)
    log('check: any perms', { anyPerms, hasAny })
    if (!hasAny) {
      log('deny: missing any perms', { anyPerms })
      return goBack(t('error.messages.403'))
    }
  }

  // Check all-of (explicit)
  if (allPerms.length) {
    const hasAll = auth.hasAllPerms(allPerms)
    log('check: all perms', { allPerms, hasAll })
    if (!hasAll) {
      const missing = allPerms.filter(perm => !auth.hasPerm(perm))
      log('deny: missing all perms', { allPerms, missing })
      return goBack(t('error.messages.403'))
    }
  }

  log('allow: perms granted', { requiredPerms, anyPerms, allPerms })
})
