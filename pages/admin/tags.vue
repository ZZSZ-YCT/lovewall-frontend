<template>
  <div class="w-full space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">标签管理</h1>
      <p class="text-gray-600 mt-2">创建标签和生成兑换码</p>
    </div>

    <!-- Controls -->
    <GlassCard class="p-4">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <select
            v-model="filters.active"
            class="input px-3 py-2"
            @change="applyFilters"
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已停用</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 items-center">
          <GlassButton
            class="toolbar-button"
            @click="openTagModal"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            新建标签
          </GlassButton>
          
          <GlassButton
            class="toolbar-button"
            variant="secondary"
            @click="openCodesListModal"
          >
            <TicketIcon class="w-4 h-4 mr-2" />
            兑换码列表
          </GlassButton>
          
          <GlassButton
            :loading="loading"
            variant="secondary"
            class="toolbar-button"
            @click="refresh"
          >
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            刷新
          </GlassButton>
        </div>
      </div>
    </GlassCard>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-purple-600 mb-1">{{ tagsData?.total || 0 }}</div>
        <div class="text-sm text-gray-600">总标签数</div>
      </GlassCard>
      
      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{{ activeCount }}</div>
        <div class="text-sm text-gray-600">已启用</div>
      </GlassCard>
      
      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">{{ totalCodes }}</div>
        <div class="text-sm text-gray-600">兑换码总数</div>
      </GlassCard>
      
      <GlassCard class="p-4 text-center">
        <div class="text-2xl font-bold text-orange-600 mb-1">{{ usedCodes }}</div>
        <div class="text-sm text-gray-600">已使用</div>
      </GlassCard>
    </div>

    <!-- Tags List -->
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!tags.length" class="text-center py-12">
        <GlassCard class="p-12">
          <div class="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TagIcon class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">暂无标签</h3>
          <p class="text-gray-600">点击"新建标签"来创建第一个标签</p>
        </GlassCard>
      </div>

      <!-- Tags -->
      <div v-else>
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="group"
        >
          <GlassCard class="p-6 hover:shadow-md transition-all">
            <div class="flex justify-between items-start">
              <div class="flex-1 pr-4">
                <div class="flex items-center gap-3 mb-3">
                  <span
                    v-if="renderTag(tag)?.useCssMode"
                    :class="renderTag(tag)?.className"
                  >
                    {{ renderTag(tag)?.title }}
                  </span>
                  <span
                    v-else-if="renderTag(tag)"
                    class="inline-block text-xs px-2 py-1 rounded font-medium"
                    :style="renderTag(tag)?.inlineStyles"
                  >
                    {{ renderTag(tag)?.title }}
                  </span>
                  <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ tag.name }}</code>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': tag.is_active,
                      'bg-gray-100 text-gray-800': !tag.is_active
                    }"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ tag.is_active ? '已启用' : '已停用' }}
                  </span>
                </div>

                <p v-if="tag.description" class="text-gray-700 mb-4">{{ tag.description }}</p>

                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <CalendarIcon class="w-4 h-4" />
                    <span>创建：{{ formatDate(tag.created_at) }}</span>
                  </div>
                  <div v-if="tag.updated_at && tag.updated_at !== tag.created_at" class="flex items-center gap-1">
                    <EditIcon class="w-4 h-4" />
                    <span>更新：{{ formatDate(tag.updated_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  title="生成兑换码"
                  @click="openCodesModal(tag)"
                >
                  <TicketIcon class="w-4 h-4" />
                </GlassButton>
                
                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  title="编辑标签"
                  @click="editTag(tag)"
                >
                  <EditIcon class="w-4 h-4" />
                </GlassButton>
                
                <GlassButton
                  variant="secondary"
                  class="!p-2"
                  :title="tag.is_active ? '停用标签' : '启用标签'"
                  @click="toggleStatus(tag)"
                >
                  <component :is="tag.is_active ? PauseIcon : PlayIcon" class="w-4 h-4" />
                </GlassButton>
                
                <GlassButton
                  variant="secondary"
                  class="!p-2 !text-red-600 hover:!bg-red-50"
                  title="删除标签"
                  @click="confirmDelete(tag)"
                >
                  <TrashIcon class="w-4 h-4" />
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>

        <!-- Pagination -->
        <div
          v-if="tagsData && tagsData.total > tagsData.page_size"
          class="flex justify-center pt-6"
        >
          <div class="flex gap-2">
            <GlassButton
              :disabled="tagsData.page <= 1"
              variant="secondary"
              class="px-4 py-2 text-sm"
              @click="prevPage"
            >
              上一页
            </GlassButton>
            
            <div class="flex items-center px-4 py-2 text-sm text-gray-600">
              第 {{ tagsData.page }} 页，共 {{ Math.ceil(tagsData.total / tagsData.page_size) }} 页
            </div>
            
            <GlassButton
              :disabled="tagsData.page * tagsData.page_size >= tagsData.total"
              variant="secondary"
              class="px-4 py-2 text-sm"
              @click="nextPage"
            >
              下一页
            </GlassButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Tag Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="tagModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeTagModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">{{ tagModal.tag ? '编辑标签' : '新建标签' }}</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeTagModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto">
              <form id="tag-form" class="space-y-4" @submit.prevent="saveTag">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">标识名 *</label>
                  <input
                    v-model="tagForm.name"
                    type="text"
                    placeholder="英文标识名，如：vip"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                  <p class="text-xs text-gray-500 mt-1">用于程序识别，只能包含字母、数字和下划线</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">显示名称 *</label>
                  <input
                    v-model="tagForm.title"
                    type="text"
                    placeholder="显示给用户的名称，如：VIP用户"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea
                    v-model="tagForm.description"
                    placeholder="标签的描述信息..."
                    rows="3"
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700">CSS样式（高级）</label>
                    <div class="flex gap-1 flex-wrap">
                      <button
                        v-for="template in cssTemplates"
                        :key="template.name"
                        type="button"
                        class="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        :title="template.description"
                        @click="applyCssTemplate(template.css)"
                      >
                        {{ template.name }}
                      </button>
                    </div>
                  </div>
                  <textarea
                    v-model="tagForm.css_styles"
                    placeholder='完整CSS类定义，类名必须为标签name。示例：&#10;.vip-gold { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 4px; font-weight: 500; animation: glow 2s infinite; } @keyframes glow { 0%, 100% { box-shadow: 0 0 5px #667eea; } 50% { box-shadow: 0 0 20px #764ba2; } }'
                    rows="6"
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none font-mono text-xs"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    留空使用简单颜色模式；填写CSS则优先使用（支持@keyframes、animation、渐变等，最大50KB）
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">背景色</label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model="tagForm.background_color"
                        type="color"
                        class="w-10 h-10 rounded border border-gray-300"
                      >
                      <input
                        v-model="tagForm.background_color"
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
                        v-model="tagForm.text_color"
                        type="color"
                        class="w-10 h-10 rounded border border-gray-300"
                      >
                      <input
                        v-model="tagForm.text_color"
                        type="text"
                        placeholder="#FFFFFF"
                        class="flex-1 w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                      >
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-600 mb-2">预览：</p>
                  <span
                    v-if="tagPreviewStyle?.useCssMode"
                    :class="previewClassName"
                  >
                    {{ tagPreviewStyle.title }}
                  </span>
                  <span
                    v-else-if="tagPreviewStyle"
                    :style="tagPreviewStyle.inlineStyles"
                  >
                    {{ tagPreviewStyle.title }}
                  </span>
                  <div v-else class="text-sm text-gray-400">请填写标签信息</div>
                </div>

                <div>
                  <label class="flex items-center gap-2">
                    <input
                      v-model="tagForm.is_active"
                      type="checkbox"
                      class="rounded"
                    >
                    <span class="text-sm font-medium text-gray-700">启用标签</span>
                  </label>
                </div>
              </form>
            </div>
            <div class="flex gap-3 justify-end px-6 pb-6">
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" @click="closeTagModal">取消</button>
              <button type="submit" form="tag-form" class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="saving">
                <span v-if="saving" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                <span>{{ tagModal.tag ? '保存' : '创建' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Generate Codes Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="codesModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeCodesModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">生成兑换码</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeCodesModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto">
              <div v-if="codesModal.tag" class="mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600 mb-2">为标签生成兑换码：</p>
                <span
                  v-if="renderTag(codesModal.tag)?.useCssMode"
                  :class="renderTag(codesModal.tag)?.className"
                >
                  {{ renderTag(codesModal.tag)?.title }}
                </span>
                <span
                  v-else-if="renderTag(codesModal.tag)"
                  class="inline-block text-xs px-2 py-1 rounded font-medium"
                  :style="renderTag(codesModal.tag)?.inlineStyles"
                >
                  {{ renderTag(codesModal.tag)?.title }}
                </span>
              </div>

              <form id="codes-form" class="space-y-4" @submit.prevent="generateCodes">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">生成数量 *</label>
                  <input
                    v-model="codesForm.count"
                    type="number"
                    placeholder="100"
                    min="1"
                    max="1000"
                    required
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                  <p class="text-xs text-gray-500 mt-1">最多一次生成1000个</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">过期时间</label>
                  <input
                    v-model="codesForm.expires_at"
                    type="datetime-local"
                    placeholder="留空表示永不过期"
                    class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                </div>
              </form>
            </div>
            <div class="flex gap-3 justify-end px-6 pb-6">
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" @click="closeCodesModal">取消</button>
              <button type="submit" form="codes-form" class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="generating">
                <span v-if="generating" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                <span>生成兑换码</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Generated Codes Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="generatedModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeGeneratedModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">兑换码生成成功</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeGeneratedModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto space-y-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-gray-600">
                  已为标签"{{ generatedModal.tag?.title }}"生成 {{ generatedModal.codes?.length }} 个兑换码
                </p>
                <GlassButton
                  variant="secondary"
                  class="text-sm"
                  @click="downloadCodes"
                >
                  <DownloadIcon class="w-4 h-4 mr-1" />
                  下载
                </GlassButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                <code
                  v-for="code in generatedModal.codes"
                  :key="code.id"
                  class="text-xs bg-white px-2 py-1 rounded border font-mono"
                >
                  {{ code.code }}
                </code>
              </div>
            </div>
            <div class="flex gap-3 justify-end px-6 pb-6">
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm" @click="closeGeneratedModal">
                关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="deleteModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeDeleteModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">确认删除</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeDeleteModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto">
              <p class="text-gray-600">
                确定要删除标签"{{ deleteModal.tag?.title }}"吗？删除后无法恢复，相关的兑换码也会失效。
              </p>
            </div>
            <div class="flex gap-3 justify-end px-6 pb-6">
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" @click="closeDeleteModal">取消</button>
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleting" @click="deleteTag">
                <span v-if="deleting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Codes List Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="codesListModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeCodesListModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">兑换码列表</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeCodesListModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto space-y-6">
              <div class="flex flex-col sm:flex-row sm:flex-nowrap gap-3 items-center">
                <input
                  v-model="codesFilter.code"
                  type="text"
                  placeholder="搜索兑换码..."
                  class="flex-1 w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                >

                <select
                  v-model="codesFilter.tag_id"
                  class="input px-3 py-2 min-w-32"
                >
                  <option value="">全部标签</option>
                  <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                    {{ tag.title }}
                  </option>
                </select>

                <select
                  v-model="codesFilter.used"
                  class="input px-3 py-2 min-w-24"
                >
                  <option value="">全部状态</option>
                  <option value="false">未使用</option>
                  <option value="true">已使用</option>
                </select>

                <GlassButton
                  :loading="loadingCodes"
                  variant="secondary"
                  class="toolbar-button"
                  @click="loadCodes(1)"
                >
                  搜索
                </GlassButton>

                <GlassButton
                  :disabled="!selectedIds.length"
                  variant="secondary"
                  class="toolbar-button !text-red-600 hover:!bg-red-50"
                  title="批量删除未使用的兑换码（仅删除未使用，已使用会跳过）"
                  @click="bulkDeleteSelected"
                >
                  批量删除
                </GlassButton>

                <div class="ml-auto flex items-center gap-2 text-sm text-gray-600">
                  <span>每页显示:</span>
                  <select
                    v-model.number="codesPageSize"
                    class="input px-2 py-1 text-sm"
                    @change="changeCodesPageSize"
                  >
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                    <option :value="500">500</option>
                  </select>
                  <span>条</span>
                </div>
              </div>

              <div v-if="loadingCodes" class="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>

              <div v-else-if="!codes.length" class="text-center py-12">
                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TicketIcon class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">暂无兑换码</h3>
                <p class="text-gray-600">点击"生成兑换码"来创建第一个兑换码</p>
              </div>

              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          :checked="allSelectableSelected"
                          @change="toggleSelectAll($event)"
                        >
                      </th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">兑换码</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">标签</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">状态</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">使用者</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">过期时间</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">创建时间</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="code in codes" :key="code.id" class="hover:bg-gray-50">
                      <td class="px-4 py-3">
                        <input v-model="selectedIds" type="checkbox" :value="code.id" :disabled="code.is_used">
                      </td>
                      <td class="px-4 py-3">
                        <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{{ code.code }}</code>
                      </td>
                      <td class="px-4 py-3">
                        <template v-if="code.tag">
                          <span
                            v-if="renderTag(code.tag)?.useCssMode"
                            :class="renderTag(code.tag)?.className"
                          >
                            {{ renderTag(code.tag)?.title }}
                          </span>
                          <span
                            v-else-if="renderTag(code.tag)"
                            class="inline-block text-xs px-2 py-1 rounded font-medium"
                            :style="renderTag(code.tag)?.inlineStyles"
                          >
                            {{ renderTag(code.tag)?.title }}
                          </span>
                        </template>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <span
                          :class="{
                            'bg-green-100 text-green-800': !code.is_used,
                            'bg-gray-100 text-gray-800': code.is_used
                          }"
                          class="px-2 py-1 text-xs rounded-full"
                        >
                          {{ code.is_used ? '已使用' : '未使用' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600">
                        <span class="block truncate max-w-[220px]">{{ codeUserLabel(code) }}</span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {{ code.expires_at ? formatDate(code.expires_at) : '永不过期' }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {{ formatDate(code.created_at) }}
                      </td>
                      <td class="px-4 py-3">
                        <GlassButton
                          class="!p-1 text-xs"
                          variant="secondary"
                          @click="viewCodeDetails(code)"
                        >
                          查看详情
                        </GlassButton>
                        <GlassButton
                          v-if="!code.is_used"
                          class="!p-1 text-xs !text-red-600 hover:!bg-red-50"
                          variant="secondary"
                          @click="confirmDeleteCode(code)"
                        >
                          删除
                        </GlassButton>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  v-if="codesData && codesData.total > codesData.page_size"
                  class="flex justify-center pt-6"
                >
                  <div class="flex gap-2">
                    <GlassButton
                      :disabled="codesData.page <= 1"
                      variant="secondary"
                      class="px-4 py-2 text-sm"
                      @click="prevCodesPage"
                    >
                      上一页
                    </GlassButton>

                    <div class="flex items-center px-4 py-2 text-sm text-gray-600">
                      第 {{ codesData.page }} 页，共 {{ Math.ceil(codesData.total / codesData.page_size) }} 页
                    </div>

                    <GlassButton
                      :disabled="codesData.page * codesData.page_size >= codesData.total"
                      variant="secondary"
                      class="px-4 py-2 text-sm"
                      @click="nextCodesPage"
                    >
                      下一页
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-3 justify-end px-6 pb-6">
              <button type="button" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" @click="closeCodesListModal">关闭</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Code Details Modal -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="codeDetailsModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="closeCodeDetailsModal" />
          <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-dialog-in" @click.stop>
            <div class="relative p-6 pb-4 pr-12">
              <h3 class="text-xl font-semibold text-gray-900">兑换码详情</h3>
              <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" @click="closeCodeDetailsModal">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 pb-6 flex-1 overflow-y-auto">
              <div v-if="codeDetailsModal.code" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">兑换码</label>
                  <code class="block text-sm bg-gray-100 px-3 py-2 rounded font-mono">{{ codeDetailsModal.code.code }}</code>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">使用者</label>
                  <div class="text-sm text-gray-600">
                    <template v-if="codeDetailsModal.code.used_by">
                      <NuxtLink
                        :to="`/users/id/${codeDetailsModal.code.used_by}`"
                        class="text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        {{ codeUserLabel(codeDetailsModal.code) }}
                      </NuxtLink>
                    </template>
                    <span v-else>-</span>
                  </div>
                </div>

                <div v-if="codeDetailsModal.code.tag">
                  <label class="block text-sm font-medium text-gray-700 mb-1">关联标签</label>
                  <span
                    v-if="renderTag(codeDetailsModal.code.tag)?.useCssMode"
                    :class="renderTag(codeDetailsModal.code.tag)?.className"
                  >
                    {{ renderTag(codeDetailsModal.code.tag)?.title }}
                  </span>
                  <span
                    v-else-if="renderTag(codeDetailsModal.code.tag)"
                    class="inline-block text-xs px-2 py-1 rounded font-medium"
                    :style="renderTag(codeDetailsModal.code.tag)?.inlineStyles"
                  >
                    {{ renderTag(codeDetailsModal.code.tag)?.title }}
                  </span>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': !codeDetailsModal.code.is_used,
                      'bg-gray-100 text-gray-800': codeDetailsModal.code.is_used
                    }"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ codeDetailsModal.code.is_used ? '已使用' : '未使用' }}
                  </span>
                </div>

                <div v-if="codeDetailsModal.code.used_by">
                  <label class="block text-sm font-medium text-gray-700 mb-1">使用者</label>
                  <p class="text-sm text-gray-600">用户 {{ codeDetailsModal.code.used_by }}</p>
                </div>

                <div v-if="codeDetailsModal.code.used_at">
                  <label class="block text-sm font-medium text-gray-700 mb-1">使用时间</label>
                  <p class="text-sm text-gray-600">{{ formatDate(codeDetailsModal.code.used_at) }}</p>
                </div>

                <div v-if="codeDetailsModal.code.expires_at">
                  <label class="block text-sm font-medium text-gray-700 mb-1">过期时间</label>
                  <p class="text-sm text-gray-600">{{ formatDate(codeDetailsModal.code.expires_at) }}</p>
                </div>

                <div v-if="codeDetailsModal.code.batch_id">
                  <label class="block text-sm font-medium text-gray-700 mb-1">批次ID</label>
                  <code class="text-xs bg-gray-100 px-2 py-1 rounded">{{ codeDetailsModal.code.batch_id }}</code>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                  <p class="text-sm text-gray-600">{{ formatDate(codeDetailsModal.code.created_at) }}</p>
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pb-6">
              <button
                v-if="codeDetailsModal.code && !codeDetailsModal.code.is_used"
                type="button"
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm"
                @click="confirmDeleteCode(codeDetailsModal.code)"
              >
                删除兑换码
              </button>
              <div class="sm:ml-auto">
                <button type="button" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" @click="closeCodeDetailsModal">
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  CalendarIcon,
  DownloadIcon,
  EditIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  TagIcon,
  TicketIcon,
  TrashIcon,
  XIcon
} from 'lucide-vue-next'
import TagBadge from '~/components/ui/TagBadge.vue'
import type {Pagination, RedemptionCodeDto, TagDto, User} from '~/types'
import type { TagRenderResult } from '~/composables/useTagRenderer'
import GlassButton from "~/components/ui/GlassButton.vue";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import GlassCard from "~/components/ui/GlassCard.vue";

definePageMeta({
  middleware: ['admin', 'require-perms'],
  requiredPerms: ['MANAGE_TAGS'],
  ssr: false
})

// Stores
const auth = useAuthStore()
const toast = useToast()
const { renderTag } = useTagRenderer()

// State
const tags = ref<TagDto[]>([])
const tagsData = ref<Pagination<TagDto> | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const generating = ref(false)

const filters = reactive({
  active: ''
})

const tagModal = reactive({
  show: false,
  tag: null as TagDto | null
})

const codesModal = reactive({
  show: false,
  tag: null as TagDto | null
})

const generatedModal = reactive({
  show: false,
  tag: null as TagDto | null,
  codes: null as RedemptionCodeDto[] | null
})

const deleteModal = reactive({
  show: false,
  tag: null as TagDto | null
})

const codesListModal = reactive({
  show: false
})

const codeDetailsModal = reactive({
  show: false,
  code: null as RedemptionCodeDto | null
})

const isAnyModalOpen = computed(() =>
  tagModal.show ||
  codesModal.show ||
  generatedModal.show ||
  deleteModal.show ||
  codesListModal.show ||
  codeDetailsModal.show
)

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (tagModal.show) {
      closeTagModal()
    } else if (codesModal.show) {
      closeCodesModal()
    } else if (generatedModal.show) {
      closeGeneratedModal()
    } else if (deleteModal.show) {
      closeDeleteModal()
    } else if (codesListModal.show) {
      closeCodesListModal()
    } else if (codeDetailsModal.show) {
      closeCodeDetailsModal()
    }
  }
}

// Codes related state
const codes = ref<RedemptionCodeDto[]>([])
const codesData = ref<Pagination<RedemptionCodeDto> | null>(null)
const loadingCodes = ref(false)
// Cache user info by id for display
const userCache = ref<Record<string, User | null>>({})
// Selection for bulk delete
const selectedIds = ref<string[]>([])
// Page size for codes list
const codesPageSize = ref<number>(20)

const codesFilter = reactive({
  code: '',
  tag_id: '',
  used: ''
})

const previewStyleEl = ref<HTMLStyleElement | null>(null)

const tagForm = reactive({
  name: '',
  title: '',
  description: '',
  tag_type: 'personal' as 'personal' | 'collective',
  background_color: '#FF5CA3',
  text_color: '#FFFFFF',
  css_styles: '',
  is_active: true
})

const lastTagName = ref<string>('')

const codesForm = reactive({
  count: 100,
  expires_at: ''
})

// Mock data for stats (these would come from API)
const totalCodes = ref(0)
const usedCodes = ref(0)

// Computed
const activeCount = computed(() => {
  return tags.value.filter(tag => tag.is_active).length
})

const previewClassName = computed(() => tagForm.name?.trim() || 'tag-preview-temp')

const tagPreviewStyle = computed<TagRenderResult | null>(() => {
  const title = tagForm.title?.trim()
  if (!title) return null

  const className = previewClassName.value
  const cssStyles = tagForm.css_styles?.trim()

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
      backgroundColor: tagForm.background_color || '#CCCCCC',
      color: tagForm.text_color || '#000000'
    }
  }
})

const ensurePreviewStyleElement = () => {
  if (!import.meta.client) return null
  if (previewStyleEl.value && document.head.contains(previewStyleEl.value)) {
    return previewStyleEl.value
  }

  const existing = document.getElementById('tag-preview-style')
  if (existing instanceof HTMLStyleElement) {
    previewStyleEl.value = existing
    return previewStyleEl.value
  }

  const style = document.createElement('style')
  style.id = 'tag-preview-style'
  document.head.appendChild(style)
  previewStyleEl.value = style
  return style
}

const cleanupPreviewStyleElement = () => {
  if (!import.meta.client) return
  if (previewStyleEl.value) {
    previewStyleEl.value.remove()
    previewStyleEl.value = null
  }
}

const updatePreviewCss = (css: string | null | undefined) => {
  if (!import.meta.client) return
  const content = css ?? ''

  if (!content.trim()) {
    if (previewStyleEl.value) {
      previewStyleEl.value.textContent = ''
    }
    return
  }

  const styleEl = ensurePreviewStyleElement()
  if (styleEl) {
    styleEl.textContent = content
  }
}

const formatCSS = (css: string | null | undefined): string => {
  if (!css?.trim()) return ''

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

  formatted = formatted.replace(/@keyframes([^{]+)\{/g, (_match, name: string) => {
    const keyframeName = name.trim()
    return keyframeName ? `@keyframes ${keyframeName} {\n  ` : '@keyframes {\n  '
  })

  return formatted
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

watch(
  () => tagForm.css_styles,
  (css) => updatePreviewCss(css),
  { immediate: true }
)

watch(
  () => tagForm.name,
  (newName, oldName) => {
    const cssContent = tagForm.css_styles
    if (!cssContent?.trim()) return

    const previousName = oldName?.trim() || lastTagName.value.trim()
    const nextName = newName?.trim() || ''

    if (!previousName) return

    const oldClass = `.${previousName}`
    const targetClassName = nextName || 'my-tag'
    const newClass = `.${targetClassName}`

    if (oldClass === newClass) {
      lastTagName.value = targetClassName
      return
    }

    tagForm.css_styles = cssContent.replace(
      new RegExp(escapeRegex(oldClass), 'g'),
      newClass
    )

    lastTagName.value = targetClassName
  }
)

// CSS快捷模板（来自后端API文档）
const cssTemplates = [
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

// Methods
const applyCssTemplate = (template: string) => {
  // 替换{{TAG_NAME}}为实际的tag name
  const normalizedName = tagForm.name?.trim()
  const tagName = normalizedName || 'my-tag'
  const css = template.replace(/\{\{TAG_NAME\}\}/g, tagName)
  tagForm.css_styles = formatCSS(css)
  lastTagName.value = tagName
}
const loadTags = async (page = 1) => {
  loading.value = true
  try {
    const api = useNuxtApp().$api
    const params: any = {
      page,
      page_size: 20
    }
    
    if (filters.active) {
      params.active = filters.active === 'true'
    }
    
    const data = await api.listTags(params)
    // 后端返回camelCase，需要转换为前端的snake_case
    tags.value = data.items.map((tag: any) => ({
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
    tagsData.value = {
      ...data,
      items: tags.value
    }
  } catch (error: any) {
    toast.error('加载标签列表失败')
  } finally {
    loading.value = false
  }
}

// Refresh global codes stats (totals across all)
const refreshCodesStats = async () => {
  try {
    const api = useNuxtApp().$api
    const [allResp, usedResp] = await Promise.all([
      api.listCodes({ page: 1, page_size: 1 }),
      api.listCodes({ used: true as any, page: 1, page_size: 1 })
    ])
    totalCodes.value = allResp.total
    usedCodes.value = usedResp.total
  } catch {}
}

const refresh = () => {
  loadTags(1)
}

const applyFilters = () => {
  loadTags(1)
}

const prevPage = () => {
  if (tagsData.value && tagsData.value.page > 1) {
    loadTags(tagsData.value.page - 1)
  }
}

const nextPage = () => {
  if (tagsData.value && tagsData.value.page * tagsData.value.page_size < tagsData.value.total) {
    loadTags(tagsData.value.page + 1)
  }
}

const openTagModal = () => {
  tagForm.name = ''
  tagForm.title = ''
  tagForm.description = ''
  tagForm.tag_type = 'personal'
  tagForm.background_color = '#FF5CA3'
  tagForm.text_color = '#FFFFFF'
  tagForm.css_styles = ''
  tagForm.is_active = true
  tagModal.tag = null
  lastTagName.value = tagForm.name.trim()
  tagModal.show = true
}

const editTag = (tag: TagDto) => {
  tagForm.name = tag.name
  tagForm.title = tag.title
  tagForm.description = tag.description || ''
  tagForm.tag_type = tag.tag_type || 'personal'
  tagForm.background_color = tag.background_color
  tagForm.text_color = tag.text_color
  tagForm.css_styles = formatCSS(tag.css_styles || '')
  tagForm.is_active = tag.is_active
  lastTagName.value = tagForm.name?.trim() || ''
  tagModal.tag = tag
  tagModal.show = true
}

const closeTagModal = () => {
  tagModal.show = false
  tagModal.tag = null
  cleanupPreviewStyleElement()
}

const saveTag = async () => {
  const cssContent = tagForm.css_styles?.trim()
  if (cssContent) {
    const byteLength = new TextEncoder().encode(cssContent).length
    if (byteLength > 50000) {
      toast.error(`CSS超出大小限制: ${(byteLength / 1000).toFixed(1)}KB / 50KB`)
      return
    }

    const normalizedName = tagForm.name?.trim()
    if (!normalizedName) {
      toast.error('使用CSS模式前请先填写标签标识')
      return
    }

    const requiredSelector = `.${normalizedName}`
    if (!cssContent.includes(requiredSelector)) {
      toast.error(`CSS必须包含类选择器 "${requiredSelector}"`)
      return
    }
  }

  saving.value = true
  try {
    const api = useNuxtApp().$api
    const cssPayload = cssContent || null

    if (tagModal.tag) {
      // Update existing
      await api.updateTag(tagModal.tag.id, {
        name: tagForm.name,
        title: tagForm.title,
        description: tagForm.description,
        tagType: tagForm.tag_type,
        backgroundColor: tagForm.background_color,
        textColor: tagForm.text_color,
        cssStyles: cssPayload,
        isActive: tagForm.is_active
      })

      // Update local state
      Object.assign(tagModal.tag, {
        name: tagForm.name,
        title: tagForm.title,
        description: tagForm.description,
        tag_type: tagForm.tag_type,
        background_color: tagForm.background_color,
        text_color: tagForm.text_color,
        css_styles: cssPayload,
        is_active: tagForm.is_active,
        updated_at: new Date().toISOString()
      })

      toast.success('标签已更新')
    } else {
      // Create new
      const newTag = await api.createTag({
        name: tagForm.name,
        title: tagForm.title,
        description: tagForm.description,
        tagType: tagForm.tag_type,
        backgroundColor: tagForm.background_color,
        textColor: tagForm.text_color,
        cssStyles: cssPayload,
        isActive: tagForm.is_active
      })

      // 后端返回camelCase，需要转换为前端的snake_case
      const normalizedTag: TagDto = {
        id: newTag.id,
        name: newTag.name,
        title: newTag.title,
        tag_type: (newTag as any).tagType || tagForm.tag_type,
        background_color: (newTag as any).backgroundColor || tagForm.background_color,
        text_color: (newTag as any).textColor || tagForm.text_color,
        css_styles: (newTag as any).cssStyles ? formatCSS((newTag as any).cssStyles) : null,
        is_active: (newTag as any).isActive !== undefined ? (newTag as any).isActive : tagForm.is_active,
        description: newTag.description || null,
        created_at: newTag.created_at,
        updated_at: newTag.updated_at
      }

      tags.value.unshift(normalizedTag)
      if (tagsData.value) {
        tagsData.value.total += 1
      }

      toast.success('标签已创建')
    }
    
    closeTagModal()
  } catch (error: any) {
    toast.error('保存标签失败')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (tag: TagDto) => {
  const { confirm } = useAdminDialog()
  const nextState = !tag.is_active
  const confirmed = await confirm({
    title: nextState ? '确认启用' : '确认停用',
    message: `确定要${nextState ? '启用' : '停用'}标签"${tag.title}"吗?`,
    confirmText: nextState ? '确认启用' : '确认停用',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    const api = useNuxtApp().$api
    await api.updateTag(tag.id, {
      name: tag.name,
      title: tag.title,
      description: tag.description,
      backgroundColor: tag.background_color,
      textColor: tag.text_color,
      isActive: nextState
    })

    tag.is_active = nextState
    tag.updated_at = new Date().toISOString()

    toast.success(tag.is_active ? '标签已启用' : '标签已停用')
  } catch (error) {
    toast.error('操作失败')
  }
}

const openCodesModal = (tag: TagDto) => {
  codesModal.tag = tag
  codesForm.count = 100
  codesForm.expires_at = ''
  codesModal.show = true
}

const closeCodesModal = () => {
  codesModal.show = false
  codesModal.tag = null
}

const generateCodes = async () => {
  if (!codesModal.tag) return
  
  generating.value = true
  try {
    const api = useNuxtApp().$api
    const params: any = {
      tag_id: codesModal.tag.id,
      count: parseInt(codesForm.count.toString())
    }
    
    if (codesForm.expires_at) {
      params.expires_at = new Date(codesForm.expires_at).toISOString()
    }
    
    const result = await api.generateCodes(params)
    
    generatedModal.tag = codesModal.tag
    generatedModal.codes = result.codes
    generatedModal.show = true
    
    closeCodesModal()
    toast.success(`成功生成 ${result.count} 个兑换码`)
  } catch (error: any) {
    toast.error('生成兑换码失败')
  } finally {
    generating.value = false
  }
}

const closeGeneratedModal = () => {
  generatedModal.show = false
  generatedModal.tag = null
  generatedModal.codes = null
}

const downloadCodes = () => {
  if (!generatedModal.codes) return
  
  const content = generatedModal.codes.map(code => code.code).join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `兑换码_${generatedModal.tag?.name}_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const confirmDelete = (tag: TagDto) => {
  deleteModal.tag = tag
  deleteModal.show = true
}

const closeDeleteModal = () => {
  deleteModal.show = false
  deleteModal.tag = null
}

const deleteTag = async () => {
  if (!deleteModal.tag) return
  
  deleting.value = true
  try {
    const api = useNuxtApp().$api
    await api.deleteTag(deleteModal.tag.id)
    
    // Remove from local list
    tags.value = tags.value.filter(t => t.id !== deleteModal.tag!.id)
    if (tagsData.value) {
      tagsData.value.total -= 1
    }
    
    toast.success('标签已删除')
    closeDeleteModal()
  } catch (error) {
    toast.error('删除失败')
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// Codes methods
const openCodesListModal = async () => {
  codesListModal.show = true
  await Promise.all([loadCodes(1), refreshCodesStats()])
}

const closeCodesListModal = () => {
  codesListModal.show = false
  codes.value = []
  codesData.value = null
  codesFilter.code = ''
  codesFilter.tag_id = ''
  codesFilter.used = ''
}

const loadCodes = async (page = 1) => {
  loadingCodes.value = true
  try {
    const api = useNuxtApp().$api
    // 公共过滤参数
    const base: any = {}
    if (codesFilter.code) base.code = codesFilter.code
    if (codesFilter.tag_id) base.tag_id = codesFilter.tag_id
    if (codesFilter.used) base.used = codesFilter.used === 'true'

    const desired = codesPageSize.value
    const serverMax = 100 // 后端单页上限（经验值）。超过则前端拼接多页

    let total: number
    let pageItems: RedemptionCodeDto[]

    if (desired <= serverMax) {
      const data = await api.listCodes({ ...base, page, page_size: desired })
      pageItems = data.items
      codesData.value = { ...data, page_size: desired }
    } else {
      // 聚合多页: 计算起始位置
      // 0-based
      const startIndex = (page - 1) * desired
      const startServerPage = Math.floor(startIndex / serverMax) + 1
      const offsetInFirst = startIndex % serverMax

      // 先查起始页，拿到总数
      const first = await api.listCodes({ ...base, page: startServerPage, page_size: serverMax })
      total = first.total
      let items = first.items.slice(offsetInFirst)

      // 继续拉取后续页直到够 desired 或没有更多
      let current = startServerPage + 1
      while (items.length < desired && (current - 1) * serverMax < total) {
        const next = await api.listCodes({ ...base, page: current, page_size: serverMax })
        if (!next.items.length) break
        items = items.concat(next.items)
        current++
      }
      pageItems = items.slice(0, desired)
      codesData.value = {
        total,
        items: pageItems,
        page,
        page_size: desired,
      }
    }

    // 合并标签并预加载用户
    const tagMap = new Map(tags.value.map((t: TagDto) => [t.id, t]))
    codes.value = pageItems.map((c: RedemptionCodeDto) => ({ ...c, tag: c.tag || tagMap.get(c.tag_id) }))
    await preloadUsersForCodes(codes.value)

    // 更新全局统计
    await refreshCodesStats()
  } catch (error: any) {
    toast.error('加载兑换码列表失败')
  } finally {
    loadingCodes.value = false
  }
}

// 预加载 codes 列表中出现的使用者用户名
const preloadUsersForCodes = async (list: RedemptionCodeDto[]) => {
  const ids = Array.from(new Set(list.map(c => c.used_by).filter(Boolean))) as string[]
  const remain = ids.filter(id => !(id in userCache.value))
  if (!remain.length) return
  const api = useNuxtApp().$api
  await Promise.all(remain.map(async (id) => {
    try {
      userCache.value[id] = await api.getUser(id)
    } catch {
      userCache.value[id] = null
    }
  }))
}

const codeUserLabel = (code: RedemptionCodeDto) => {
  if (!code.used_by) return '-'
  const u = userCache.value[code.used_by]
  if (u === undefined) return '加载中...'
  if (!u) return `用户 ${code.used_by.slice(0, 8)}`
  return u.display_name || u.username || `用户 ${u.id.slice(0, 8)}`
}

const prevCodesPage = () => {
  if (codesData.value && codesData.value.page > 1) {
    loadCodes(codesData.value.page - 1)
  }
}

const nextCodesPage = () => {
  if (codesData.value && codesData.value.page * codesData.value.page_size < codesData.value.total) {
    loadCodes(codesData.value.page + 1)
  }
}

const changeCodesPageSize = () => {
  selectedIds.value = []
  loadCodes(1)
}

const allSelectableSelected = computed(() => {
  const selectable = codes.value.filter(c => !c.is_used).map(c => c.id)
  return selectable.length > 0 && selectable.every(id => selectedIds.value.includes(id))
})

const toggleSelectAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    const selectable = codes.value.filter(c => !c.is_used).map(c => c.id)
    // 合并去重，仅当前页
    const set = new Set(selectedIds.value)
    selectable.forEach(id => set.add(id))
    selectedIds.value = Array.from(set)
  } else {
    // 移除当前页的可选项
    const current = new Set(codes.value.filter(c => !c.is_used).map(c => c.id))
    selectedIds.value = selectedIds.value.filter(id => !current.has(id))
  }
}

const bulkDeleteSelected = async () => {
  if (!selectedIds.value.length) return
  const { confirm } = useAdminDialog()
  if (!await confirm({
    title: '确认删除',
    message: `确定删除选中的 ${selectedIds.value.length} 个兑换码？仅未使用的会被删除。`,
    confirmText: '确认删除',
    cancelText: '取消'
  })) return
  try {
    const api = useNuxtApp().$api
    const res = await api.deleteRedemptionCodes({ ids: selectedIds.value })
    if (res.deleted > 0) {
      toast.success(`已删除 ${res.deleted} 个兑换码`)
    } else {
      toast.info('没有可删除的兑换码（可能均已使用）')
    }
    selectedIds.value = []
    await Promise.all([loadCodes(codesData.value?.page || 1), refreshCodesStats()])
  } catch (e) {
    toast.error('批量删除失败')
  }
}

const viewCodeDetails = async (code: RedemptionCodeDto) => {
  try {
    const api = useNuxtApp().$api
    // 获取完整的兑换码详情
    const detailCode = await api.getCodeByCode(code.code)
    // 合并本地标签信息，启用 TagBadge 预览
    const tag = tags.value.find(t => t.id === detailCode.tag_id)
    codeDetailsModal.code = { ...detailCode, tag }
    // 预加载详情使用者
    if (detailCode.used_by && !(detailCode.used_by in userCache.value)) {
      try { userCache.value[detailCode.used_by] = await api.getUser(detailCode.used_by) } catch { userCache.value[detailCode.used_by] = null }
    }
    codeDetailsModal.show = true
  } catch (error: any) {
    toast.error('获取兑换码详情失败')
  }
}

const closeCodeDetailsModal = () => {
  codeDetailsModal.show = false
  codeDetailsModal.code = null
}

// Delete a single redemption code (unused only)
const confirmDeleteCode = async (code: RedemptionCodeDto) => {
  if (code.is_used) return
  const { confirm } = useAdminDialog()
  if (!await confirm({
    title: '确认删除',
    message: '确定要删除该兑换码吗？仅未使用的兑换码可删除',
    confirmText: '确认删除',
    cancelText: '取消'
  })) return
  try {
    const api = useNuxtApp().$api
    const res = await api.deleteRedemptionCodes({ ids: [code.id] })
    if (res.deleted > 0) {
      toast.success('兑换码已删除')
      await loadCodes(codesData.value?.page || 1)
    } else {
      toast.info('兑换码未删除（可能已被使用）')
    }
  } catch (e) {
    toast.error('删除兑换码失败')
  }
}

watch(isAnyModalOpen, (open) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      window.addEventListener('keydown', handleEscape)
    } else {
      window.removeEventListener('keydown', handleEscape)
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleEscape)
  }
  cleanupPreviewStyleElement()
})

// Initialize
onMounted(() => {
  ensurePreviewStyleElement()
  loadTags()
  refreshCodesStats()
})

// SEO
useHead({
  title: '标签管理 - 郑州四中校园墙',
  meta: [
    { name: 'description', content: '创建标签和生成兑换码' }
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
