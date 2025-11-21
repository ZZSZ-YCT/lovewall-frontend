/**
 * 权限管理工具类
 * 提供统一的权限检查和管理功能
 */

import type { PermissionType } from '~/types'

/**
 * 权限检查组合式函数
 */
export const usePermissions = () => {
  const { t } = useI18n()

  const auth = useAuthStore()

  const getPermissionDisplayName = (perm: string): string => {
    const permissionNames: Record<string, string> = {
      'MANAGE_USERS': t('permission.manage_users'),
      'MANAGE_POSTS': t('permission.manage_posts'),
      'MANAGE_FEATURED': t('permission.manage_featured'),
      'MANAGE_ANNOUNCEMENTS': t('permission.manage_announcements'),
      'MANAGE_TAGS': t('permission.manage_tags'),
    }
    return permissionNames[perm] || perm
  }

  /**
   * 权限分组
   */
  const getPermissionGroups = () => {
    return [
      {
        name: t('permission.manage_users'),
        permissions: ['MANAGE_USERS']
      },
      {
        name: t('permission.manage_content'),
        permissions: ['MANAGE_POSTS', 'MANAGE_FEATURED']
      },
      {
        name: t('permission.manage_announcements_group'),
        permissions: ['MANAGE_POSTS', 'MANAGE_ANNOUNCEMENTS']
      },
      {
        name: t('permission.manage_tags_group'),
        permissions: ['MANAGE_TAGS']
      }
    ]
  }

  return {
    // 基础权限检查
    hasPerm: (perm: PermissionType): boolean => auth.hasPerm(perm),
    hasAnyPerm: (perms: PermissionType[]): boolean => auth.hasAnyPerm(perms),
    hasAllPerms: (perms: PermissionType[]): boolean => auth.hasAllPerms(perms),
    isSuperadmin: computed(() => auth.isSuperadmin),

    // 具体功能权限检查
    canManageUsers: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_USERS')),
    // 后端已废弃 MANAGE_COMMENTS，统一由 MANAGE_POSTS 负责评论权限
    canManageComments: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')),
    canManageAnnouncements: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_ANNOUNCEMENTS')),
    canManageTags: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_TAGS')),
    canManagePosts: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_POSTS')),
    canManageFeatured: computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_FEATURED')),
    getPermissionDisplayName: getPermissionDisplayName,
    getPermissionGroups: getPermissionGroups,

    // 管理员权限检查 (拥有任一管理权限)
    isAdmin: computed(() => {
      const adminPerms: PermissionType[] = [
        'MANAGE_USERS',
        'MANAGE_ANNOUNCEMENTS', 
        'MANAGE_POSTS',
        'MANAGE_TAGS'
      ]
      return auth.isSuperadmin || auth.hasAnyPerm(adminPerms)
    }),

    // 内容管理权限检查
    isContentManager: computed(() => {
      const contentPerms: PermissionType[] = [
        'MANAGE_POSTS',
        'MANAGE_FEATURED'
      ]
      return auth.isSuperadmin || auth.hasAnyPerm(contentPerms)
    })
  }
}

/**
 * 检查用户是否为内容创建者（可以编辑自己的内容）
 */
export const isContentCreator = (creatorId: string, userId?: string): boolean => {
  if (!userId) return false
  return creatorId === userId
}

/**
 * 检查是否可以编辑内容（限时编辑或有权限）
 * 注意：后端已废弃编辑功能，此函数仅保留用于历史兼容
 */
export const canEditContent = (
  createdAt: string,
  creatorId: string,
  currentUserId?: string,
  editTimeLimit = 15 // 15分钟
): boolean => {
  // 编辑功能已废弃，始终返回 false
  return false
}

/**
 * 获取用户权限等级
 */
export const getUserPermissionLevel = (user: any): 'superadmin' | 'admin' | 'content_manager' | 'user' => {
  if (user?.is_superadmin) return 'superadmin'
  
  const permissions = user?.permissions || []
  const adminPerms = ['MANAGE_USERS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_POSTS', 'MANAGE_TAGS']
  const contentPerms = ['MANAGE_POSTS', 'MANAGE_FEATURED']
  
  if (permissions.some((p: string) => adminPerms.includes(p))) {
    return 'admin'
  }
  
  if (permissions.some((p: string) => contentPerms.includes(p))) {
    return 'content_manager'
  }
  
  return 'user'
}
