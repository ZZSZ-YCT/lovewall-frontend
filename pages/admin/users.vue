<template>
  <div class="w-full space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <p class="text-gray-600 mt-2">管理用户账户和权限设置</p>
    </div>

    <!-- Controls -->
    <GlassCard class="p-4">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <GlassInput
            v-model="filters.q"
            placeholder="搜索用户名或邮箱..."
            class="flex-1 min-w-0"
            @keyup="applyFilters"
          >
            <template #prefix>
              <SearchIcon class="w-4 h-4 text-gray-400"/>
            </template>
          </GlassInput>

          <select
            v-model="filters.status"
            class="glass-input px-3 py-2"
            @change="applyFilters"
          >
            <option value="">全部状态</option>
            <option value="0">正常</option>
            <option value="1">已禁用</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <GlassButton
            :loading="loading"
            variant="secondary"
            @click="refresh"
          >
            <RefreshCwIcon class="w-4 h-4 mr-2"/>
            刷新
          </GlassButton>
        </div>
      </div>
    </GlassCard>

    <!-- Delete User Confirmation Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="deleteUserModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closeDeleteUser"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">确认删除用户</h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeDeleteUser"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div class="px-6 pb-6 space-y-3 text-gray-700">
              <p>此操作将软删除该用户并立即注销其所有会话，且不可恢复。用户的帖子与评论会保留。</p>
              <p class="text-sm text-gray-500">请谨慎操作，仅超级管理员可执行。</p>
              <div v-if="deleteUserModal.user" class="text-sm text-gray-600">
                目标用户：<strong>@{{ deleteUserModal.user.username }}</strong>
              </div>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closeDeleteUser"
              >
                取消
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="deletingUser"
                @click="deleteUser"
              >
                <span
                  v-if="deletingUser"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Users Table -->
    <GlassCard class="overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg"/>
      </div>

      <!-- Empty State -->
      <div v-else-if="!users.length" class="text-center py-12">
        <div
          class="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UsersIcon class="w-8 h-8 text-white"/>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">未找到用户</h3>
        <p class="text-gray-600">尝试调整搜索条件</p>
      </div>

      <!-- Users Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-white/10 border-b border-white/20">
          <tr>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">用户信息</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">状态</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">标签</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">权限</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">注册时间</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">最后登录</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-800">操作</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-white/5"
          >
            <!-- User Info -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="relative w-10 h-10 flex-shrink-0 transition-transform hover:scale-105"
                >
                  <!-- 管理员光圈效果 -->
                  <template v-if="user.is_admin">
                    <div
                      class="absolute -inset-[3px] rounded-full border-[3px] border-sky-400/95 pointer-events-none"
                    />
                    <div
                      class="absolute -inset-[7px] rounded-full bg-sky-300/40 blur-2xl pointer-events-none"
                    />
                  </template>

                  <!-- 头像容器 -->
                  <NuxtImg
                    v-if="user.avatar_url"
                    :src="assetUrl(user.avatar_url)"
                    :alt="user.username"
                    class="relative z-10 w-full h-full rounded-full object-cover"
                    :class="user.is_admin ? 'border-0' : 'border border-white/20'"
                  />
                  <div
                    v-else
                    class="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium"
                    :class="user.is_admin ? 'border-0' : 'border border-white/20'"
                  >
                    {{ user.username.slice(0, 2).toUpperCase() }}
                  </div>
                </div>
                <div>
                  <div class="font-medium text-gray-800">
                    {{ user.display_name || user.username }}
                  </div>
                  <div class="text-sm text-gray-600">
                    @{{ user.username }}
                  </div>
                  <div v-if="user.email" class="text-xs text-gray-500">
                    {{ user.email }}
                  </div>
                  <div
                    v-if="!canManageTags && user.active_tag"
                    class="mt-2 inline-flex items-center"
                  >
                    <span
                      class="px-2 py-0.5 text-xs rounded-full font-medium"
                      :style="{
                        backgroundColor: user.active_tag.background_color || '#6b7280',
                        color: user.active_tag.text_color || '#ffffff'
                      }"
                    >
                      {{ user.active_tag.title || user.active_tag.name }}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-2 flex-wrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': user.status === 0 && !user.is_banned,
                      'bg-red-100 text-red-800': user.status === 1,
                      'bg-gray-100 text-gray-800': user.status !== 0 && user.status !== 1
                    }"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ getStatusText(user.status) }}
                  </span>
                <span
                  v-if="user.is_banned"
                  class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full"
                  :title="user.ban_reason || '未提供原因'"
                >
                    已封禁
                  </span>
                <span
                  v-if="user.is_superadmin"
                  class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                >
                    超级管理员
                  </span>
              </div>
            </td>

            <!-- Tags -->
            <td class="px-6 py-4">
              <div v-if="canManageTags" class="flex flex-wrap gap-1">
                <template v-for="tag in getUserTags(user.id)" :key="tag.user_tag_id">
                  <span
                    v-if="renderTag(tag.tag)?.useCssMode"
                    :class="[renderTag(tag.tag)?.className, { 'ring-2 ring-blue-300': tag.is_active }]"
                  >
                    {{ renderTag(tag.tag)?.title }}
                  </span>
                  <span
                    v-else-if="renderTag(tag.tag)"
                    class="inline-block text-xs px-2 py-1 rounded font-medium"
                    :style="renderTag(tag.tag)?.inlineStyles"
                    :class="{ 'ring-2 ring-blue-300': tag.is_active }"
                  >
                    {{ renderTag(tag.tag)?.title }}
                  </span>
                </template>
                <span v-if="!getUserTags(user.id).length" class="text-xs text-gray-400">暂无标签</span>
              </div>
              <div v-else class="inline-flex items-center">
                <span
                  v-if="user.active_tag"
                  class="px-2 py-0.5 text-xs rounded-full font-medium"
                  :style="{
                    backgroundColor: user.active_tag.background_color || '#6b7280',
                    color: user.active_tag.text_color || '#ffffff'
                  }"
                >
                  {{ user.active_tag.title || user.active_tag.name }}
                </span>
                <span v-else class="text-xs text-gray-400">暂无标签</span>
              </div>
            </td>

            <!-- Permissions -->
            <td class="px-6 py-4">
              <div class="text-sm text-gray-600">
                <span v-if="user.is_superadmin">全部权限</span>
                <div v-else-if="getUserPermissions(user.id).length" class="space-y-1">
                  <div
                    v-for="perm in getUserPermissions(user.id).slice(0, 2)"
                    :key="perm"
                    class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded mr-1"
                  >
                    {{ getPermissionText(perm) }}
                  </div>
                  <div
                    v-if="getUserPermissions(user.id).length > 2"
                    class="text-xs text-gray-500"
                  >
                    +{{ getUserPermissions(user.id).length - 2 }} 更多
                  </div>
                </div>
                <span v-else class="text-gray-400">无权限</span>
              </div>
            </td>

            <!-- Registration Time -->
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Last Login -->
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ user.last_login_at ? formatDate(user.last_login_at) : '从未登录' }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <GlassButton
                  v-if="auth.isSuperadmin || auth.hasPerm('MANAGE_USERS')"
                  variant="secondary"
                  class="!p-2"
                  title="编辑用户"
                  @click="editUser(user)"
                >
                  <EditIcon class="w-4 h-4"/>
                </GlassButton>

                <GlassButton
                  v-if="!user.is_superadmin && auth.isSuperadmin"
                  variant="secondary"
                  class="!p-2"
                  title="编辑权限"
                  @click="editPermissions(user)"
                >
                  <ShieldIcon class="w-4 h-4"/>
                </GlassButton>

                <GlassButton
                  v-if="!user.is_superadmin && canManageTags"
                  variant="secondary"
                  class="!p-2"
                  title="管理标签"
                  @click="manageUserTags(user)"
                >
                  <TagIcon class="w-4 h-4"/>
                </GlassButton>

                <GlassButton
                  v-if="user.id !== auth.currentUser?.id && (auth.isSuperadmin || auth.hasPerm('MANAGE_USERS'))"
                  variant="secondary"
                  class="!p-2"
                  title="修改密码"
                  @click="changePassword(user)"
                >
                  <KeyIcon class="w-4 h-4"/>
                </GlassButton>


                <!-- Delete User (superadmin only) -->
                <GlassButton
                  v-if="auth.isSuperadmin && user.id !== auth.currentUser?.id && !user.is_superadmin"
                  variant="secondary"
                  class="!p-2 !text-red-600 hover:!bg-red-50"
                  title="删除用户"
                  @click="openDeleteUser(user)"
                >
                  <UserXIcon class="w-4 h-4"/>
                </GlassButton>

                <!-- Ban/Unban Button -->
                <GlassButton
                  v-if="user.id !== auth.currentUser?.id && !user.is_superadmin && (auth.isSuperadmin || auth.hasPerm('MANAGE_USERS'))"
                  variant="secondary"
                  :class="{
                      '!text-red-600 hover:!bg-red-50': !user.is_banned,
                      '!text-green-600 hover:!bg-green-50': user.is_banned
                    }"
                  class="!p-2"
                  :title="user.is_banned ? '解封用户' : '封禁用户'"
                  @click="user.is_banned ? confirmUnbanUser(user) : confirmBanUser(user)"
                >
                  <component :is="user.is_banned ? ShieldCheckIcon : BanIcon" class="w-4 h-4"/>
                </GlassButton>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="usersData && usersData.total > 0"
        class="px-6 py-4 border-t border-white/20"
      >
        <!-- Pagination Info and Page Size Selector -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div class="text-sm text-gray-600">
            显示 {{ (usersData.page - 1) * usersData.page_size + 1 }} -
            {{ Math.min(usersData.page * usersData.page_size, usersData.total) }}
            共 {{ usersData.total }} 条
          </div>

          <!-- Page Size Selector -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">每页显示:</span>
            <select
              v-model="pageSize"
              class="glass-input px-2 py-1 text-sm"
              @change="changePageSize"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span class="text-sm text-gray-600">条</span>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex flex-col lg:flex-row justify-between items-center gap-4">
          <!-- Previous/Next Buttons -->
          <div class="flex gap-2">
            <GlassButton
              :disabled="usersData.page <= 1"
              variant="secondary"
              class="px-3 py-1 text-sm"
              title="首页"
              @click="goToFirstPage"
            >
              <ChevronsLeftIcon class="w-4 h-4"/>
            </GlassButton>
            <GlassButton
              :disabled="usersData.page <= 1"
              variant="secondary"
              class="px-3 py-1 text-sm"
              @click="prevPage"
            >
              上一页
            </GlassButton>
          </div>

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <GlassButton
              v-for="pageNum in visiblePages"
              :key="pageNum"
              :variant="pageNum === usersData.page ? 'primary' : 'secondary'"
              :class="{
                '!bg-brand-500 !text-white': pageNum === usersData.page,
                '!bg-transparent': pageNum === '...'
              }"
              :disabled="pageNum === '...'"
              class="px-3 py-1 text-sm min-w-[36px]"
              @click="goToPage(pageNum)"
            >
              {{ pageNum }}
            </GlassButton>
          </div>

          <!-- Next/Last Buttons -->
          <div class="flex gap-2">
            <GlassButton
              :disabled="usersData.page * usersData.page_size >= usersData.total"
              variant="secondary"
              class="px-3 py-1 text-sm"
              @click="nextPage"
            >
              下一页
            </GlassButton>
            <GlassButton
              :disabled="usersData.page * usersData.page_size >= usersData.total"
              variant="secondary"
              class="px-3 py-1 text-sm"
              title="末页"
              @click="goToLastPage"
            >
              <ChevronsRightIcon class="w-4 h-4"/>
            </GlassButton>
          </div>
        </div>

        <!-- Quick Jump -->
        <div class="flex justify-center mt-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">跳转到第</span>
            <GlassInput
              v-model="jumpToPage"
              type="number"
              :min="1"
              :max="totalPages"
              class="w-16 text-center text-sm"
              @keyup.enter="handleJumpToPage"
            />
            <span class="text-sm text-gray-600">页 (共 {{ totalPages }} 页)</span>
            <GlassButton
              variant="secondary"
              class="px-3 py-1 text-sm"
              :disabled="!jumpToPage || jumpToPage < 1 || jumpToPage > totalPages"
              @click="handleJumpToPage"
            >
              跳转
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>

    <!-- Edit Permissions Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="permissionsModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closePermissionsModal"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">编辑用户权限</h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closePermissionsModal"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div v-if="permissionsModal.user" class="px-6 pb-6 space-y-6 overflow-y-auto">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
                  <NuxtImg
                    v-if="permissionsModal.user.avatar_url"
                    :src="assetUrl(permissionsModal.user.avatar_url)"
                    :alt="permissionsModal.user.username"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <span v-else>{{ permissionsModal.user.username.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900">
                    {{ permissionsModal.user.display_name || permissionsModal.user.username }}
                  </div>
                  <div class="text-sm text-gray-600">@{{ permissionsModal.user.username }}</div>
                </div>
              </div>

              <div class="space-y-3">
                <label
                  v-for="permission in availablePermissions"
                  :key="permission.key"
                  class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="permissionsForm.includes(permission.key)"
                    class="mt-1 w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                    @change="togglePermission(permission.key)"
                  >
                  <div>
                    <div class="font-medium text-sm text-gray-900">{{ permission.name }}</div>
                    <div class="text-xs text-gray-600 leading-relaxed">{{ permission.description }}</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closePermissionsModal"
              >
                取消
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="savingPermissions"
                @click="savePermissions"
              >
                <span
                  v-if="savingPermissions"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Change Password Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="passwordModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closePasswordModal"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">修改用户密码</h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closePasswordModal"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div v-if="passwordModal.user" class="px-6 pb-6 space-y-6 overflow-y-auto">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
                  <NuxtImg
                    v-if="passwordModal.user.avatar_url"
                    :src="assetUrl(passwordModal.user.avatar_url)"
                    :alt="passwordModal.user.username"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <span v-else>{{ passwordModal.user.username.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900">
                    {{ passwordModal.user.display_name || passwordModal.user.username }}
                  </div>
                  <div class="text-sm text-gray-600">@{{ passwordModal.user.username }}</div>
                </div>
              </div>

              <form class="space-y-4" @submit.prevent="submitPasswordChange">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    新密码 *
                  </label>
                  <GlassInput
                    v-model="passwordForm.new_password"
                    type="password"
                    placeholder="请输入新密码（至少6位）"
                    :error="passwordErrors.new_password"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    确认新密码 *
                  </label>
                  <GlassInput
                    v-model="passwordForm.confirm_password"
                    type="password"
                    placeholder="请再次输入新密码"
                    :error="passwordErrors.confirm_password"
                    required
                  />
                </div>
              </form>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closePasswordModal"
              >
                取消
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="!isPasswordFormValid || passwordSubmitting"
                @click="submitPasswordChange"
              >
                <span
                  v-if="passwordSubmitting"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                <span>{{ passwordSubmitting ? '修改中...' : '修改密码' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="editModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closeEditModal"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">编辑用户信息</h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeEditModal"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div v-if="editModal.user" class="px-6 pb-6 overflow-y-auto">
              <div class="space-y-6">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
                    <NuxtImg
                      v-if="editModal.user.avatar_url"
                      :src="assetUrl(editModal.user.avatar_url)"
                      :alt="editModal.user.username"
                      class="w-12 h-12 rounded-full object-cover"
                    />
                    <span v-else>{{ editModal.user.username.slice(0, 2).toUpperCase() }}</span>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">编辑用户信息</div>
                    <div class="text-sm text-gray-600">@{{ editModal.user.username }}</div>
                  </div>
                </div>

                <form class="space-y-6" @submit.prevent="submitUserEdit">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        用户名 *
                      </label>
                      <GlassInput
                        v-model="editForm.username"
                        placeholder="请输入用户名"
                        :error="editErrors.username"
                        required
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        显示名称
                      </label>
                      <GlassInput
                        v-model="editForm.display_name"
                        placeholder="请输入显示名称（可选）"
                        :error="editErrors.display_name"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        邮箱
                      </label>
                      <GlassInput
                        v-model="editForm.email"
                        type="email"
                        placeholder="请输入邮箱（可选）"
                        :error="editErrors.email"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        手机号
                      </label>
                      <GlassInput
                        v-model="editForm.phone"
                        placeholder="请输入手机号（可选）"
                        :error="editErrors.phone"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      个人简介
                    </label>
                    <textarea
                      v-model="editForm.bio"
                      placeholder="请输入个人简介（可选）"
                      rows="3"
                      class="w-full glass-input resize-none"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      头像
                    </label>
                    <div class="flex items-center gap-4">
                      <input
                        ref="avatarInput"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleAvatarChange"
                      >
                      <div
                        class="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        title="点击更换头像"
                        @click="avatarInput?.click()"
                      >
                        <NuxtImg
                          v-if="avatarPreview"
                          :src="avatarPreview"
                          alt="头像预览"
                          class="w-16 h-16 rounded-full object-cover"
                        />
                        <NuxtImg
                          v-else-if="editModal.user?.avatar_url"
                          :src="assetUrl(editModal.user.avatar_url)"
                          :alt="editModal.user.username"
                          class="w-16 h-16 rounded-full object-cover"
                        />
                        <span v-else>{{ (editForm.username || '').slice(0, 2).toUpperCase() }}</span>
                      </div>

                      <div class="flex-1">
                        <p class="text-sm text-gray-700 font-medium mb-1">
                          点击头像更换
                        </p>
                        <p class="text-xs text-gray-500">
                          支持 JPG、PNG、GIF 格式，大小不超过 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closeEditModal"
              >
                取消
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="!isEditFormValid || editSubmitting"
                @click="submitUserEdit"
              >
                <span
                  v-if="editSubmitting"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                <span>{{ editSubmitting ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- User Tags Management Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="userTagsModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closeUserTagsModal"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">管理用户标签</h3>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeUserTagsModal"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div v-if="userTagsModal.user" class="px-6 pb-6 space-y-6 overflow-y-auto">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
                  <NuxtImg
                    v-if="userTagsModal.user.avatar_url"
                    :src="assetUrl(userTagsModal.user.avatar_url)"
                    :alt="userTagsModal.user.username"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <span v-else>{{ userTagsModal.user.username.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900">
                    {{ userTagsModal.user.display_name || userTagsModal.user.username }}
                  </div>
                  <div class="text-sm text-gray-600">@{{ userTagsModal.user.username }}</div>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">当前标签</h4>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="userTag in getUserTags(userTagsModal.user.id)"
                      :key="userTag.user_tag_id"
                      class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
                    >
                      <span
                        v-if="renderTag(userTag.tag)?.useCssMode"
                        :class="[renderTag(userTag.tag)?.className, { 'ring-2 ring-blue-300': userTag.is_active }]"
                      >
                        {{ renderTag(userTag.tag)?.title }}
                      </span>
                      <span
                        v-else-if="renderTag(userTag.tag)"
                        class="inline-block text-xs px-2 py-1 rounded font-medium"
                        :style="renderTag(userTag.tag)?.inlineStyles"
                        :class="{ 'ring-2 ring-blue-300': userTag.is_active }"
                      >
                        {{ renderTag(userTag.tag)?.title }}
                      </span>
                      <button
                        v-if="userTag.tag?.id"
                        class="text-red-500 hover:text-red-700 text-sm"
                        title="删除标签"
                        @click="removeUserTag(userTagsModal.user!.id, userTag.tag.id)"
                      >
                        ×
                      </button>
                      <button
                        v-if="!userTag.is_active && userTag.tag?.id"
                        class="text-blue-500 hover:text-blue-700 text-xs"
                        title="设为活跃"
                        @click="setActiveUserTag(userTagsModal.user!.id, userTag.tag.id)"
                      >
                        激活
                      </button>
                      <span v-else class="text-xs text-blue-600">活跃</span>
                    </div>
                    <div v-if="!getUserTags(userTagsModal.user.id).length" class="text-sm text-gray-500">
                      暂无标签
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">添加标签</h4>
                  <div class="flex flex-wrap gap-2 items-center">
                    <select
                      v-model="selectedTagId"
                      class="flex-1 px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white transition-all"
                    >
                      <option value="">选择标签...</option>
                      <option
                        v-for="tag in availableTags"
                        :key="tag.id"
                        :value="tag.id"
                      >
                        {{ tag.title }}
                      </option>
                    </select>
                    <button
                      type="button"
                      class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="!selectedTagId || assigningTag"
                      @click="assignUserTag"
                    >
                      <span
                        v-if="assigningTag"
                        class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                      />
                      <span>添加</span>
                    </button>
                    <button
                      v-if="canManageTags && userTagsModal.user"
                      type="button"
                      class="px-5 py-2.5 text-sm font-medium text-brand-600 bg-white border-2 border-brand-100 hover:bg-brand-50 rounded-lg transition-colors shadow-sm"
                      @click="openCreatePersonalTagModal(userTagsModal.user)"
                    >
                      创建专属标签
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closeUserTagsModal"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create Personal Tag Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div
          v-if="createPersonalTagModal.show"
          class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closeCreatePersonalTagModal"/>

          <div
            class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in"
            @click.stop
          >
            <div class="relative p-6 pb-4 pr-12 border-b border-gray-100">
              <h3 class="text-xl font-semibold text-gray-900">
                为 {{ createPersonalTagModal.userName || '该用户' }} 创建专属标签
              </h3>
              <p class="text-sm text-gray-500 mt-1">标签仅对该用户可见，可自定义配色或CSS样式</p>
              <button
                type="button"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeCreatePersonalTagModal"
              >
                <XIcon class="w-5 h-5"/>
              </button>
            </div>

            <div class="px-6 pb-6 flex-1 overflow-y-auto">
              <form id="personal-tag-form" class="space-y-5" @submit.prevent="submitPersonalTag">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">标签标识 *</label>
                    <input
                      v-model="personalTagForm.name"
                      type="text"
                      placeholder="user-123-vip"
                      class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                      required
                    >
                    <p class="text-xs text-gray-500 mt-1">自动生成，可调整；仅限字母、数字、下划线或连字符</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">标签类型</label>
                    <input
                      value="personal（仅该用户可见）"
                      disabled
                      class="w-full px-4 py-2.5 border-2 border-dashed border-brand-200 rounded-lg bg-brand-50/30 text-brand-600 cursor-not-allowed"
                    >
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">显示名称 *</label>
                  <input
                    v-model="personalTagForm.title"
                    type="text"
                    placeholder="专属VIP"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea
                    v-model="personalTagForm.description"
                    rows="3"
                    placeholder="描述该专属标签的用途或含义..."
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">背景色</label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model="personalTagForm.background_color"
                        type="color"
                        class="w-10 h-10 rounded border border-gray-300"
                      >
                      <input
                        v-model="personalTagForm.background_color"
                        type="text"
                        placeholder="#FF5CA3"
                        class="flex-1 w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                      >
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">文字色</label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model="personalTagForm.text_color"
                        type="color"
                        class="w-10 h-10 rounded border border-gray-300"
                      >
                      <input
                        v-model="personalTagForm.text_color"
                        type="text"
                        placeholder="#FFFFFF"
                        class="flex-1 w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                      >
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2 gap-2">
                    <label class="block text-sm font-medium text-gray-700">CSS样式模板（可选）</label>
                    <div class="flex flex-wrap gap-1 justify-end">
                      <button
                        v-for="template in personalCssTemplates"
                        :key="template.name"
                        type="button"
                        class="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        :title="template.description"
                        @click="applyPersonalCssTemplate(template.css)"
                      >
                        {{ template.name }}
                      </button>
                    </div>
                  </div>
                  <textarea
                    v-model="personalTagForm.css_styles"
                    :placeholder="`完整CSS类定义，类名必须为 .${personalTagForm.name || 'user-tag'}`"
                    rows="7"
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none font-mono text-xs"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    模板会自动将 <code v-text="'.{{TAG_NAME}}'"></code> 替换为当前标识。CSS 最大 50KB，需包含类选择器
                    <code>.{{ personalTagForm.name || 'user-tag' }}</code>。
                  </p>
                </div>

                <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p class="text-sm text-gray-600 mb-2">预览</p>
                  <div>
                    <span
                      v-if="personalTagPreview?.useCssMode"
                      :class="personalTagPreview.className"
                    >
                      {{ personalTagPreview.title }}
                    </span>
                    <span
                      v-else-if="personalTagPreview"
                      :style="personalTagPreview.inlineStyles"
                    >
                      {{ personalTagPreview.title }}
                    </span>
                    <div v-else class="text-sm text-gray-400">请先填写标签标识和显示名称</div>
                  </div>
                </div>
              </form>
            </div>

            <div class="flex gap-3 justify-end px-6 pb-6 border-t border-gray-100">
              <button
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                @click="closeCreatePersonalTagModal"
              >
                取消
              </button>
              <button
                type="submit"
                form="personal-tag-form"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="creatingPersonalTag"
              >
                <span
                  v-if="creatingPersonalTag"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                <span>{{ creatingPersonalTag ? '创建中...' : '创建并分配' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  SearchIcon,
  RefreshCwIcon,
  UsersIcon,
  ShieldIcon,
  UserXIcon,
  KeyIcon,
  EditIcon,
  TagIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  BanIcon,
  ShieldCheckIcon,
  XIcon
} from 'lucide-vue-next'
import GlassInput from '~/components/ui/GlassInput.vue'
import TagBadge from '~/components/ui/TagBadge.vue'
import {PERMISSIONS} from '~/types'
import type {
  User,
  Pagination,
  AdminChangePasswordForm,
  AdminUpdateUserForm,
  TagDto,
  UserTagDto
} from '~/types'
import type { TagRenderResult } from '~/composables/useTagRenderer'
import GlassButton from "~/components/ui/GlassButton.vue";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import GlassCard from "~/components/ui/GlassCard.vue";

definePageMeta({
  middleware: ['admin', 'require-perms'],
  requiredPerms: ['MANAGE_USERS'],
  ssr: false
})

// Stores
const auth = useAuthStore()
const assetUrl = useAssetUrl()
const toast = useToast()
const { renderTag } = useTagRenderer()
const canManageTags = computed(() => auth.isSuperadmin || auth.hasPerm('MANAGE_TAGS'))

// State
const users = ref<User[]>([])
const usersData = ref<Pagination<User> | null>(null)
const loading = ref(true)
const savingPermissions = ref(false)

const filters = reactive({
  q: '',
  status: ''
})

const permissionsModal = reactive({
  show: false,
  user: null as User | null
})

const permissionsForm = ref<string[]>([])
const userPermissions = ref<Record<string, string[]>>({})

// Password change modal state
const passwordModal = reactive({
  show: false,
  user: null as User | null
})

const passwordForm = reactive<AdminChangePasswordForm>({
  new_password: '',
  confirm_password: ''
})
const passwordErrors = reactive<Partial<Record<keyof AdminChangePasswordForm, string>>>({})
const passwordSubmitting = ref(false)

// Edit user modal state
const editModal = reactive({
  show: false,
  user: null as User | null
})

const editForm = reactive<AdminUpdateUserForm>({
  username: '',
  display_name: '',
  email: '',
  phone: '',
  bio: '',
  avatar: null
})
const editErrors = reactive<Partial<Record<keyof AdminUpdateUserForm, string>>>({})
const editSubmitting = ref(false)
const avatarPreview = ref<string>('')
const avatarInput = ref<HTMLInputElement | null>(null)

// User tags management modal state
const userTagsModal = reactive({
  show: false,
  user: null as User | null
})

const allTags = ref<TagDto[]>([])
const userTags = ref<Record<string, UserTagDto[]>>({})
const selectedTagId = ref<string>('')
const assigningTag = ref(false)

// Personal tag creation state
const createPersonalTagModal = reactive({
  show: false,
  userId: '',
  userName: ''
})

const personalTagForm = reactive({
  name: '',
  title: '',
  description: '',
  background_color: '#FF5CA3',
  text_color: '#FFFFFF',
  css_styles: '',
  is_active: true
})

const personalCssTemplateSource = ref<string | null>(null)
const personalPreviewStyleEl = ref<HTMLStyleElement | null>(null)
const lastPersonalCssName = ref<string>('')
const creatingPersonalTag = ref(false)

// Pagination state
const pageSize = ref(20)
const jumpToPage = ref<number | null>(null)

// Computed for available tags (not already assigned)
const availableTags = computed(() => {
  if (!userTagsModal.user) return allTags.value
  const assignedTagIds = getUserTags(userTagsModal.user.id).map(ut => ut.tag?.id).filter(id => id)
  return allTags.value.filter(tag => !assignedTagIds.includes(tag.id))
})

const personalTagPreviewClassName = computed(() => personalTagForm.name?.trim() || 'personal-tag-preview')

const personalTagPreview = computed<TagRenderResult | null>(() => {
  const title = personalTagForm.title?.trim()
  if (!title) return null

  const cssStyles = personalTagForm.css_styles?.trim()
  const className = personalTagPreviewClassName.value

  if (cssStyles) {
    return {
      className,
      title,
      useCssMode: true
    }
  }

  return {
    className,
    title,
    useCssMode: false,
    inlineStyles: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      backgroundColor: personalTagForm.background_color || '#FF5CA3',
      color: personalTagForm.text_color || '#FFFFFF'
    }
  }
})

// CSS模板（与标签管理保持一致）
const personalCssTemplates = [
  {
    name: '渐变背景',
    description: '线性渐变背景',
    css: `.{{TAG_NAME}} { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 16px; font-weight: 500; }`
  },
  {
    name: '发光动画',
    description: '绿色发光脉冲动画',
    css: `.{{TAG_NAME}} { background: #1a1a1a; color: #00ff00; padding: 4px 12px; border-radius: 4px; font-weight: bold; text-shadow: 0 0 10px #00ff00; animation: glow-pulse 2s ease-in-out infinite; } @keyframes glow-pulse { 0%, 100% { text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00; } 50% { text-shadow: 0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00; } }`
  },
  {
    name: '彩虹滚动',
    description: '彩虹渐变滚动动画',
    css: `.{{TAG_NAME}} { background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); background-size: 200% 100%; animation: rainbow-slide 3s linear infinite; color: white; font-weight: bold; padding: 4px 10px; border-radius: 6px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); } @keyframes rainbow-slide { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`
  },
  {
    name: '悬浮效果',
    description: 'Hover上浮动画',
    css: `.{{TAG_NAME}} { background: #4a90e2; color: white; padding: 4px 12px; border-radius: 8px; transition: all 0.3s ease; cursor: pointer; } .{{TAG_NAME}}:hover { background: #357abd; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }`
  },
  {
    name: '脉冲缩放',
    description: '缩放脉冲动画',
    css: `.{{TAG_NAME}} { background: #e74c3c; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; animation: pulse-scale 1.5s ease-in-out infinite; } @keyframes pulse-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`
  },
  {
    name: '闪烁效果',
    description: '透明度闪烁动画',
    css: `.{{TAG_NAME}} { background: #f39c12; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600; animation: blink-opacity 2s step-start infinite; } @keyframes blink-opacity { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`
  }
]

const formatCSS = (css: string): string => {
  if (!css) return ''

  let formatted = css
    .replace(/\{/g, ' {\n  ')
    .replace(/;/g, ';\n  ')
    .replace(/\}/g, '\n}\n')
    .replace(/\s+/g, ' ')
    .trim()

  formatted = formatted
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim()

  return formatted
}

const ensurePersonalPreviewStyleElement = () => {
  if (!import.meta.client) return null
  if (personalPreviewStyleEl.value && document.head.contains(personalPreviewStyleEl.value)) {
    return personalPreviewStyleEl.value
  }

  const existing = document.getElementById('personal-tag-preview-style')
  if (existing instanceof HTMLStyleElement) {
    personalPreviewStyleEl.value = existing
    return personalPreviewStyleEl.value
  }

  const style = document.createElement('style')
  style.id = 'personal-tag-preview-style'
  document.head.appendChild(style)
  personalPreviewStyleEl.value = style
  return style
}

const cleanupPersonalPreviewStyleElement = () => {
  if (!import.meta.client) return
  if (personalPreviewStyleEl.value) {
    personalPreviewStyleEl.value.remove()
    personalPreviewStyleEl.value = null
  }
}

const updatePersonalPreviewCss = (css: string | null | undefined) => {
  if (!import.meta.client) return
  const content = css ?? ''

  if (!content.trim()) {
    if (personalPreviewStyleEl.value) {
      personalPreviewStyleEl.value.textContent = ''
    }
    return
  }

  const styleEl = ensurePersonalPreviewStyleElement()
  if (styleEl) {
    styleEl.textContent = content
  }
}

let isSettingPersonalCss = false

const setPersonalCssStyles = (value: string) => {
  isSettingPersonalCss = true
  personalTagForm.css_styles = value
  Promise.resolve().then(() => {
    isSettingPersonalCss = false
  })
}

const replaceCssClassName = (css: string, oldName: string | undefined, newName: string) => {
  if (!css || !oldName || !newName || oldName === newName) return css
  const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(\\.)${escapedOld}(?=[^a-zA-Z0-9_-]|$)`, 'g')
  return css.replace(pattern, `$1${newName}`)
}

watch(
  () => personalTagForm.css_styles,
  (css) => {
    updatePersonalPreviewCss(css)
    if (isSettingPersonalCss) return

    if (css && /\{\{TAG_NAME\}\}/.test(css)) {
      personalCssTemplateSource.value = css
      const tagName = personalTagForm.name?.trim() || 'user-tag'
      const replaced = formatCSS(css.replace(/\{\{TAG_NAME\}\}/g, tagName))
      if (replaced !== css) {
        setPersonalCssStyles(replaced)
      }
      lastPersonalCssName.value = tagName
      return
    }

    if (!css) {
      personalCssTemplateSource.value = null
      lastPersonalCssName.value = personalTagForm.name?.trim() || ''
      return
    }

    // 用户手动编辑CSS后，清空模板引用，避免覆盖自定义内容
    personalCssTemplateSource.value = null
  },
  { immediate: true }
)

watch(
  () => personalTagForm.name,
  (newName, oldName) => {
    const normalized = newName?.trim()
    const css = personalTagForm.css_styles
    if (!normalized) {
      lastPersonalCssName.value = ''
      return
    }

    if (!css) {
      lastPersonalCssName.value = normalized
      return
    }

    if (personalCssTemplateSource.value) {
      const fromTemplate = formatCSS(personalCssTemplateSource.value.replace(/\{\{TAG_NAME\}\}/g, normalized))
      if (fromTemplate !== css) {
        setPersonalCssStyles(fromTemplate)
      }
      lastPersonalCssName.value = normalized
      return
    }

    if (/\{\{TAG_NAME\}\}/.test(css)) {
      const replaced = formatCSS(css.replace(/\{\{TAG_NAME\}\}/g, normalized))
      if (replaced !== css) {
        setPersonalCssStyles(replaced)
      }
      lastPersonalCssName.value = normalized
      return
    }

    const previousName = oldName?.trim() || lastPersonalCssName.value
    const updatedCss = replaceCssClassName(css, previousName, normalized)
    if (updatedCss !== css) {
      setPersonalCssStyles(updatedCss)
    }
    lastPersonalCssName.value = normalized
  }
)

// Pagination computed properties
const totalPages = computed(() => {
  if (!usersData.value) return 0
  return Math.ceil(usersData.value.total / usersData.value.page_size)
})

const visiblePages = computed(() => {
  if (!usersData.value) return []

  const current = usersData.value.page
  const total = totalPages.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    // 如果总页数少于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第一页
    pages.push(1)

    if (current > 4) {
      pages.push('...')
    }

    // 显示当前页前后的页码
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i)
      }
    }

    if (current < total - 3) {
      pages.push('...')
    }

    // 总是显示最后一页
    if (total > 1) {
      pages.push(total)
    }
  }

  return pages
})

// 工具函数：将File转换为base64格式
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Available permissions (后端已将评论权限合并到 MANAGE_POSTS)
const availablePermissions = [
  {key: PERMISSIONS.MANAGE_USERS, name: '用户管理', description: '管理用户账户和基本信息'},
  {key: PERMISSIONS.MANAGE_POSTS, name: '帖子/评论管理', description: '审核、隐藏和删除用户帖子与评论'},
  {key: PERMISSIONS.MANAGE_FEATURED, name: '精华管理', description: '置顶、精华帖子'},
  {key: PERMISSIONS.MANAGE_ANNOUNCEMENTS, name: '公告管理', description: '创建、编辑和删除系统公告'},
  {key: PERMISSIONS.MANAGE_TAGS, name: '标签管理', description: '创建标签和生成兑换码'},
]

// Computed
const isPasswordFormValid = computed(() => {
  return passwordForm.new_password.trim() &&
    passwordForm.confirm_password.trim() &&
    passwordForm.new_password === passwordForm.confirm_password &&
    passwordForm.new_password.length >= 6
})

const isEditFormValid = computed(() => {
  return editForm.username &&
    editForm.username.length >= 3 &&
    Object.keys(editErrors).length === 0
})

// Methods
const loadUsers = async (page = 1) => {
  loading.value = true
  try {
    const api = useNuxtApp().$api
    const params: any = {
      page,
      page_size: pageSize.value
    }

    if (filters.q) params.q = filters.q
    if (filters.status) params.status = parseInt(filters.status)

    const data = await api.listUsers(params)
    users.value = data.items
    usersData.value = data

    // 从用户数据中提取权限信息
    userPermissions.value = {}
    data.items.forEach((user: User) => {
      if (user.permissions) {
        userPermissions.value[user.id] = user.permissions
      }
    })

    // 重置标签缓存，避免旧数据残留
    userTags.value = {}

    if (canManageTags.value) {
      // 预加载所有用户的标签信息（仅管理权限可用）
      await loadAllUsersTags(data.items)
    }

  } catch (error: any) {
    toast.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 预加载所有用户的标签信息
const loadAllUsersTags = async (usersList: User[]) => {
  if (!canManageTags.value) {
    usersList.forEach((user) => {
      userTags.value[user.id] = []
    })
    return
  }

  const api = useNuxtApp().$api

  // 并发加载所有用户的标签，提高加载效率
  const tagPromises = usersList.map(async (user) => {
    try {
      const data = await api.adminGetUserTags(user.id)
      userTags.value[user.id] = data.items.map(item => ({
        ...item,
        tag: item.tag ? {
          ...item.tag,
          css_styles: item.tag.css_styles ? formatCSS(item.tag.css_styles) : null
        } : item.tag
      }))
    } catch (error: any) {
      console.warn(`加载用户 ${user.username} 的标签失败:`, error)
      // 如果加载失败，设置为空数组，避免重复加载
      userTags.value[user.id] = []
    }
  })

  // 等待所有标签加载完成
  await Promise.allSettled(tagPromises)
}

const refresh = () => {
  loadUsers(1)
}

const applyFilters = () => {
  loadUsers(1)
}

const prevPage = () => {
  if (usersData.value && usersData.value.page > 1) {
    loadUsers(usersData.value.page - 1)
  }
}

const nextPage = () => {
  if (usersData.value && usersData.value.page * usersData.value.page_size < usersData.value.total) {
    loadUsers(usersData.value.page + 1)
  }
}

// New pagination methods
const goToFirstPage = () => {
  loadUsers(1)
}

const goToLastPage = () => {
  if (usersData.value) {
    const lastPage = Math.ceil(usersData.value.total / usersData.value.page_size)
    loadUsers(lastPage)
  }
}

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && usersData.value) {
    const maxPage = Math.ceil(usersData.value.total / usersData.value.page_size)
    if (page <= maxPage) {
      loadUsers(page)
    }
  }
}

const changePageSize = () => {
  // 重置到第一页并重新加载
  loadUsers(1)
}

const handleJumpToPage = () => {
  if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
    loadUsers(jumpToPage.value)
    jumpToPage.value = null // 清空输入框
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '正常'
    case 1:
      return '已禁用'
    default:
      return '未知'
  }
}

const getUserPermissions = (userId: string) => {
  return userPermissions.value[userId] || []
}

const getPermissionText = (permission: string) => {
  const perm = availablePermissions.find(p => p.key === permission)
  return perm ? perm.name : permission
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const editPermissions = (user: User) => {
  permissionsModal.user = user
  permissionsForm.value = [...getUserPermissions(user.id)]
  permissionsModal.show = true
}

const closePermissionsModal = () => {
  permissionsModal.show = false
  permissionsModal.user = null
  permissionsForm.value = []
}

const togglePermission = (permission: string) => {
  const index = permissionsForm.value.indexOf(permission)
  if (index >= 0) {
    permissionsForm.value.splice(index, 1)
  } else {
    permissionsForm.value.push(permission)
  }
}

const savePermissions = async () => {
  if (!permissionsModal.user) return

  const {confirm} = useAdminDialog()
  const confirmed = await confirm({
    title: '确认保存',
    message: `确定要保存用户"${permissionsModal.user.username}"的权限修改吗？`,
    confirmText: '确认保存',
    cancelText: '取消'
  })

  if (!confirmed) return

  // 保存用户引用，避免在异步操作过程中被清空
  const currentUser = permissionsModal.user

  savingPermissions.value = true
  try {
    const api = useNuxtApp().$api
    await api.setUserPerms(currentUser.id, {permissions: permissionsForm.value})

    // Update local state
    userPermissions.value[currentUser.id] = [...permissionsForm.value]

    toast.success('权限设置已保存')
    closePermissionsModal()
  } catch (error: any) {
    toast.error('保存权限失败')
  } finally {
    savingPermissions.value = false
  }
}

// Delete user (superadmin only)
const deleteUserModal = reactive<{ show: boolean; user: User | null }>({show: false, user: null})
const deletingUser = ref(false)

const isAnyModalOpen = computed(() => (
  deleteUserModal.show ||
  permissionsModal.show ||
  passwordModal.show ||
  editModal.show ||
  userTagsModal.show ||
  createPersonalTagModal.show
))

watch(isAnyModalOpen, (open) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
  cleanupPersonalPreviewStyleElement()
})

const openDeleteUser = (user: User) => {
  deleteUserModal.user = user
  deleteUserModal.show = true
}

const closeDeleteUser = () => {
  deleteUserModal.show = false
  deleteUserModal.user = null
}

const deleteUser = async () => {
  if (!deleteUserModal.user) return
  if (!auth.isSuperadmin) {
    toast.error('仅超级管理员可删除用户')
    return
  }
  deletingUser.value = true
  try {
    const api = useNuxtApp().$api
    await api.adminDeleteUser(deleteUserModal.user.id)
    // Remove from local list
    users.value = users.value.filter(u => u.id !== deleteUserModal.user!.id)
    if (usersData.value) {
      usersData.value.total = Math.max(0, usersData.value.total - 1)
    }
    toast.success('用户已删除')
    closeDeleteUser()
  } catch (error: any) {
    const msg = error?.message || '删除用户失败'
    toast.error(msg)
  } finally {
    deletingUser.value = false
  }
}

// Initialize
onMounted(() => {
  loadUsers()
  if (canManageTags.value) {
    loadTags()
  }
})

// User Tags Methods
const getUserTags = (userId: string): UserTagDto[] => {
  return userTags.value[userId] || []
}

const sanitizeTagName = (value: string) => {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+/, '')
    .replace(/[-_]+$/, '')
}

const generatePersonalTagName = (user?: User | null) => {
  const idPart = user?.id ? user.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : ''
  const base = idPart ? `user-${idPart}` : `user-${Date.now()}`
  const candidate = `${base}-vip`
  return sanitizeTagName(candidate) || `user-${Date.now()}`
}

const resetPersonalTagForm = (user?: User | null) => {
  const defaultName = generatePersonalTagName(user)
  personalTagForm.name = defaultName
  lastPersonalCssName.value = defaultName
  personalTagForm.title = user ? `${user.display_name || user.username}专属VIP` : ''
  personalTagForm.description = ''
  personalTagForm.background_color = '#FF5CA3'
  personalTagForm.text_color = '#FFFFFF'
  personalTagForm.css_styles = ''
  personalTagForm.is_active = true
  personalCssTemplateSource.value = null
}

const openCreatePersonalTagModal = (user: User) => {
  if (!canManageTags.value || !user) return
  createPersonalTagModal.userId = user.id
  createPersonalTagModal.userName = user.display_name || user.username
  resetPersonalTagForm(user)
  createPersonalTagModal.show = true
  ensurePersonalPreviewStyleElement()
  updatePersonalPreviewCss(personalTagForm.css_styles)
}

const closeCreatePersonalTagModal = () => {
  createPersonalTagModal.show = false
  createPersonalTagModal.userId = ''
  createPersonalTagModal.userName = ''
  resetPersonalTagForm()
  cleanupPersonalPreviewStyleElement()
}

const applyPersonalCssTemplate = (template: string) => {
  if (!template) return
  const tagName = personalTagForm.name?.trim() || 'user-tag'
  personalCssTemplateSource.value = template
  lastPersonalCssName.value = tagName
  setPersonalCssStyles(formatCSS(template.replace(/\{\{TAG_NAME\}\}/g, tagName)))
}

const appendUserTagToState = (userId: string, tag: TagDto) => {
  if (!userId || !tag?.id) return
  const newUserTag: UserTagDto = {
    user_tag_id: `temp-${Date.now()}`,
    is_active: false,
    obtained_at: new Date().toISOString(),
    status: 'active',
    tag: {
      ...tag
    }
  }
  userTags.value[userId] ??= []
  userTags.value[userId]!.push(newUserTag)
}

const submitPersonalTag = async () => {
  if (creatingPersonalTag.value) return
  if (!createPersonalTagModal.userId) {
    toast.error('请选择要分配的用户')
    return
  }

  const normalizedName = sanitizeTagName(personalTagForm.name) || generatePersonalTagName()
  if (normalizedName !== personalTagForm.name) {
    personalTagForm.name = normalizedName
  }

  const title = personalTagForm.title?.trim()
  if (!title) {
    toast.error('请填写显示名称')
    return
  }

  const cssInput = personalTagForm.css_styles?.trim()
  let formattedCss = ''

  if (cssInput) {
    formattedCss = formatCSS(cssInput)
    const byteLength = new TextEncoder().encode(formattedCss).length
    if (byteLength > 50000) {
      toast.error(`CSS超出大小限制: ${(byteLength / 1024).toFixed(1)}KB / 50KB`)
      return
    }

    const requiredSelector = `.${normalizedName}`
    if (!formattedCss.includes(requiredSelector)) {
      toast.error(`CSS必须包含类选择器 "${requiredSelector}"`)
      return
    }
  }

  creatingPersonalTag.value = true
  try {
    const api = useNuxtApp().$api
    const payload = {
      name: normalizedName,
      title,
      description: personalTagForm.description?.trim() || null,
      tagType: 'personal' as const,
      backgroundColor: personalTagForm.background_color || '#FF5CA3',
      textColor: personalTagForm.text_color || '#FFFFFF',
      cssStyles: cssInput ? formattedCss : null,
      isActive: true
    }

    const newTag = await api.createTag(payload)
    // 后端返回camelCase，需要转换为前端的snake_case
    const normalizedTag: TagDto = {
      id: newTag.id,
      name: newTag.name,
      title: newTag.title,
      tag_type: (newTag as any).tagType || 'personal',
      background_color: (newTag as any).backgroundColor || personalTagForm.background_color,
      text_color: (newTag as any).textColor || personalTagForm.text_color,
      css_styles: (newTag as any).cssStyles ? formatCSS((newTag as any).cssStyles) : null,
      is_active: (newTag as any).isActive !== undefined ? (newTag as any).isActive : true,
      description: newTag.description || null,
      created_at: newTag.created_at,
      updated_at: newTag.updated_at
    }

    allTags.value.unshift(normalizedTag)

    await api.adminAssignUserTag(createPersonalTagModal.userId, normalizedTag.id, {active: false})
    appendUserTagToState(createPersonalTagModal.userId, normalizedTag)

    toast.success('专属标签已创建并分配')
    closeCreatePersonalTagModal()
  } catch (error: any) {
    console.error('创建专属标签失败：', error)
    const message = error?.response?.data?.error?.message || error?.message || '创建专属标签失败'
    toast.error(message)
  } finally {
    creatingPersonalTag.value = false
  }
}

const loadTags = async () => {
  try {
    const api = useNuxtApp().$api
    // Load all tags (not just active ones) for admin management
    const data = await api.listTags()
    // 后端返回camelCase，需要转换为前端的snake_case
    allTags.value = data.items.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      title: tag.title,
      tag_type: tag.tagType || tag.tag_type || 'collective',
      background_color: tag.backgroundColor || tag.background_color || '#6b7280',
      text_color: tag.textColor || tag.text_color || '#ffffff',
      css_styles: tag.cssStyles || tag.css_styles ? formatCSS(tag.cssStyles || tag.css_styles) : null,
      is_active: tag.isActive !== undefined ? tag.isActive : (tag.is_active !== undefined ? tag.is_active : true),
      description: tag.description || null,
      created_at: tag.created_at,
      updated_at: tag.updated_at
    }))
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.warn('加载标签列表失败：权限不足')
      return
    }
    toast.error('加载标签列表失败')
  }
}

const manageUserTags = (user: User) => {
  userTagsModal.user = user
  userTagsModal.show = true
  selectedTagId.value = ''

  // 标签已经在用户列表加载时预加载，无需重复加载
  // 如果某种情况下数据未预加载，使用空数组
  if (!userTags.value[user.id]) {
    userTags.value[user.id] = []
  }
}

const closeUserTagsModal = () => {
  userTagsModal.show = false
  userTagsModal.user = null
  selectedTagId.value = ''
  if (createPersonalTagModal.show) {
    closeCreatePersonalTagModal()
  }
}

const assignUserTag = async () => {
  if (!selectedTagId.value || !userTagsModal.user) return

  assigningTag.value = true
  try {
    const api = useNuxtApp().$api

    // 确认选中的标签存在
    const selectedTag = allTags.value.find(t => t.id === selectedTagId.value)
    if (!selectedTag) {
      toast.error('选中的标签不存在')
      return
    }

    await api.adminAssignUserTag(userTagsModal.user.id, selectedTagId.value, {active: false})

    // Add new tag to local state
    const newUserTag: UserTagDto = {
      user_tag_id: `temp-${Date.now()}`,
      is_active: false,
      obtained_at: new Date().toISOString(),
      status: 'active',
      tag: {
        id: selectedTag.id,
        name: selectedTag.name,
        title: selectedTag.title,
        background_color: selectedTag.background_color,
        text_color: selectedTag.text_color,
        css_styles: selectedTag.css_styles,
        tag_type: selectedTag.tag_type,
        description: selectedTag.description,
        is_active: selectedTag.is_active,
        created_at: selectedTag.created_at,
        updated_at: selectedTag.updated_at
      }
    }

    userTags.value[userTagsModal.user.id] ??= []
    userTags.value[userTagsModal.user.id]!.push(newUserTag)

    selectedTagId.value = ''
    toast.success(`标签"${selectedTag.title}"分配成功`)
  } catch (error: any) {
    console.error('分配标签失败：', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '分配标签失败'
    toast.error(`分配标签失败: ${errorMessage}`)
  } finally {
    assigningTag.value = false
  }
}

const removeUserTag = async (userId: string, tagId: string) => {
  const {confirm} = useAdminDialog()
  const confirmed = await confirm({
    title: '确认删除',
    message: '确定要删除该用户标签吗？',
    confirmText: '确认删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    const api = useNuxtApp().$api
    await api.adminRemoveUserTag(userId, tagId)

    // Remove from local state
    if (userTags.value[userId]) {
      userTags.value[userId] = userTags.value[userId].filter(ut => ut.tag?.id !== tagId)
    }

    toast.success('标签已删除')
  } catch (error: any) {
    console.error('删除标签失败：', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '删除标签失败'
    toast.error(`删除标签失败: ${errorMessage}`)
  }
}

const setActiveUserTag = async (userId: string, tagId: string) => {
  try {
    const api = useNuxtApp().$api
    await api.adminAssignUserTag(userId, tagId, {active: true})

    // Update local state - only one tag can be active
    if (userTags.value[userId]) {
      userTags.value[userId].forEach(ut => {
        ut.is_active = (ut.tag?.id === tagId)
      })
    }

    toast.success('活跃标签已设置')
  } catch (error: any) {
    console.error('设置活跃标签失败：', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '设置活跃标签失败'
    toast.error(`设置活跃标签失败: ${errorMessage}`)
  }
}

// Password change methods
const changePassword = (user: User) => {
  passwordModal.user = user
  passwordModal.show = true
  // Reset form
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
  Object.keys(passwordErrors).forEach(key => delete passwordErrors[key as keyof AdminChangePasswordForm])
}

const closePasswordModal = () => {
  passwordModal.show = false
  passwordModal.user = null
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
  Object.keys(passwordErrors).forEach(key => delete passwordErrors[key as keyof AdminChangePasswordForm])
}

const validatePasswordForm = () => {
  Object.keys(passwordErrors).forEach(key => delete passwordErrors[key as keyof AdminChangePasswordForm])

  if (!passwordForm.new_password) {
    passwordErrors.new_password = '请输入新密码'
    return false
  }

  if (passwordForm.new_password.length < 6) {
    passwordErrors.new_password = '密码至少需要6位字符'
    return false
  }

  if (!passwordForm.confirm_password) {
    passwordErrors.confirm_password = '请确认新密码'
    return false
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordErrors.confirm_password = '两次输入的密码不一致'
    return false
  }

  return true
}

const submitPasswordChange = async () => {
  if (!validatePasswordForm() || !passwordModal.user) return

  // 保存用户引用，避免在异步操作过程中被清空
  const currentUser = passwordModal.user

  passwordSubmitting.value = true

  try {
    const api = useNuxtApp().$api
    await api.adminChangePassword(currentUser.id, passwordForm)

    toast.success(`已成功修改用户 ${currentUser.username} 的密码`)
    closePasswordModal()
  } catch (error: any) {
    console.error('Change password failed:', error)
    toast.error(error.message || '修改密码失败')
  } finally {
    passwordSubmitting.value = false
  }
}

// Watch password form for real-time validation
watch(() => [passwordForm.new_password, passwordForm.confirm_password], () => {
  // 实时清除错误，让用户能够立即看到按钮状态变化
  if (Object.keys(passwordErrors).length > 0) {
    validatePasswordForm()
  }
}, {deep: true})

// Watch edit form for real-time validation
watch(() => [editForm.username, editForm.email, editForm.phone], () => {
  if (Object.keys(editErrors).length > 0) {
    validateEditForm()
  }
})

// Edit user methods
const editUser = (user: User) => {
  editModal.user = user
  editModal.show = true
  // 填充表单数据
  editForm.username = user.username
  editForm.display_name = user.display_name || ''
  editForm.email = user.email || ''
  editForm.phone = user.phone || ''
  editForm.bio = user.bio || ''
  editForm.avatar = null
  avatarPreview.value = ''
  // 清空错误
  Object.keys(editErrors).forEach(key => delete editErrors[key as keyof AdminUpdateUserForm])
}

const closeEditModal = () => {
  editModal.show = false
  editModal.user = null
  // 重置表单
  editForm.username = ''
  editForm.display_name = ''
  editForm.email = ''
  editForm.phone = ''
  editForm.bio = ''
  editForm.avatar = null
  avatarPreview.value = ''
  // 清空错误
  Object.keys(editErrors).forEach(key => delete editErrors[key as keyof AdminUpdateUserForm])
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      editErrors.avatar = '请选择图片文件'
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      editErrors.avatar = '图片文件不能超过5MB'
      return
    }

    // 清除错误
    delete editErrors.avatar

    // 设置文件和预览
    editForm.avatar = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const validateEditForm = () => {
  Object.keys(editErrors).forEach(key => delete editErrors[key as keyof AdminUpdateUserForm])

  if (!editForm.username) {
    editErrors.username = '请输入用户名'
    return false
  }

  if (editForm.username.length < 3) {
    editErrors.username = '用户名至少需要3位字符'
    return false
  }

  if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
    editErrors.email = '请输入有效的邮箱地址'
    return false
  }

  if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone)) {
    editErrors.phone = '请输入有效的手机号'
    return false
  }

  return true
}

const submitUserEdit = async () => {
  if (!validateEditForm() || !editModal.user) return

  // 保存用户引用，避免在异步操作过程中被清空
  const currentUser = editModal.user

  editSubmitting.value = true

  try {
    const api = useNuxtApp().$api

    // 构建更新数据，只包含有变化的字段
    const updateData: AdminUpdateUserForm = {}
    if (editForm.username !== currentUser.username) updateData.username = editForm.username
    if (editForm.display_name !== (currentUser.display_name || '')) updateData.display_name = editForm.display_name || null
    if (editForm.email !== (currentUser.email || '')) updateData.email = editForm.email || null
    if (editForm.phone !== (currentUser.phone || '')) updateData.phone = editForm.phone || null
    if (editForm.bio !== (currentUser.bio || '')) updateData.bio = editForm.bio || null

    // 处理头像上传
    if (editForm.avatar) {
      updateData.avatar_base64 = await fileToBase64(editForm.avatar)
    }

    const updatedUser = await api.updateUser(currentUser.id, updateData)

    // 更新本地用户列表中的数据
    const index = users.value.findIndex(u => u.id === currentUser.id)
    if (index >= 0) {
      users.value[index] = updatedUser
    }

    toast.success(`用户 ${updatedUser.username} 信息已更新`)
    closeEditModal()
  } catch (error: any) {
    console.error('Update user failed:', error)
    if (error.message?.includes('username')) {
      editErrors.username = '用户名已被占用'
    } else if (error.message?.includes('email')) {
      editErrors.email = '邮箱已被占用'
    } else {
      toast.error(error.message || '更新用户信息失败')
    }
  } finally {
    editSubmitting.value = false
  }
}

// Ban user methods
const confirmBanUser = async (user: User) => {
  const {prompt} = useAdminDialog()
  const reason = await prompt({
    title: '封禁用户',
    message: `确定要封禁用户 "${user.username}" 吗?请输入封禁原因:`,
    confirmText: '确认封禁',
    cancelText: '取消',
    placeholder: '请输入封禁原因(至少5个字符)...'
  })

  if (!reason || reason.trim().length < 5) {
    if (reason !== null) {
      toast.error('封禁原因至少需要5个字符')
    }
    return
  }

  try {
    const api = useNuxtApp().$api
    const result = await api.banUser(user.id, {reason: reason.trim()})

    // Update local state
    const index = users.value.findIndex(u => u.id === user.id)
    if (index >= 0) {
      Object.assign(users.value[index]!, {
        is_banned: result.is_banned,
        ban_reason: result.ban_reason
      })
    }

    toast.success(`用户 ${user.username} 已被封禁`)
  } catch (error: any) {
    console.error('Ban user failed:', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '封禁用户失败'
    toast.error(`封禁用户失败: ${errorMessage}`)
  }
}

const confirmUnbanUser = async (user: User) => {
  const {confirm} = useAdminDialog()
  if (!await confirm({
    title: '确认解封',
    message: `确定要解封用户 "${user.username}" 吗？`,
    confirmText: '确认解封',
    cancelText: '取消'
  })) return

  try {
    const api = useNuxtApp().$api
    const result = await api.unbanUser(user.id)

    // Update local state
    const index = users.value.findIndex(u => u.id === user.id)
    if (index >= 0) {
      Object.assign(users.value[index]!, {
        is_banned: result.is_banned,
        ban_reason: null
      })
    }

    toast.success(`用户 ${user.username} 已被解封`)
  } catch (error: any) {
    console.error('Unban user failed:', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '解封用户失败'
    toast.error(`解封用户失败: ${errorMessage}`)
  }
}

// SEO
useHead({
  title: '用户管理 - 郑州四中表白墙',
  meta: [
    {name: 'description', content: '管理用户账户和权限设置'}
  ]
})
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-dialog-in {
  animation: dialog-in 0.2s ease-out;
}
</style>
