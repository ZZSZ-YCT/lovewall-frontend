<template>
  <div class="w-full">
    <div class="max-w-4xl mx-auto">
      <GlassCard class="p-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="page-title">{{ t('posts.publish.index') }}</h1>
          <p class="text-gray-600 text-center">
            {{ form.card_type === 'communication' ? t('posts.publish.description_social') : t('posts.publish.description_confessional') }}
          </p>
        </div>

        <!-- Form -->
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Card Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            {{ t('posts.publish.cardType' )}}
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              :class="[
                'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                form.card_type === 'confession'
                  ? 'border-brand-500 bg-brand-50/30'
                  : 'border-gray-200 hover:border-brand-300'
              ]"
            >
              <input
                v-model="form.card_type"
                type="radio"
                value="confession"
                class="w-5 h-5 text-brand-600"
              >
              <div>
                <div class="font-medium text-gray-900">{{ t('posts.publish.confessionCard') }}</div>
                <div class="text-sm text-gray-500">{{ t('posts.publish.description_confessional') }}</div>
              </div>
            </label>

            <label
              :class="[
                'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                form.card_type === 'communication'
                  ? 'border-brand-500 bg-brand-50/30'
                  : 'border-gray-200 hover:border-brand-300'
              ]"
            >
              <input
                v-model="form.card_type"
                type="radio"
                value="communication"
                class="w-5 h-5 text-brand-600"
              >
              <div>
                <div class="font-medium text-gray-900">{{ t('posts.publish.socialCard') }}</div>
                <div class="text-sm text-gray-500">{{ t('posts.publish.description_social') }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Confessor Mode Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            {{ t('posts.publish.chooseRole') }}
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              :class="[
                'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                form.confessor_mode === 'self' 
                  ? 'border-brand-500 bg-brand-50/30' 
                  : 'border-gray-200 hover:border-brand-300'
              ]"
            >
              <input
                v-model="form.confessor_mode"
                type="radio"
                value="self"
                class="w-5 h-5 text-brand-600"
              >
              <div>
                <div class="font-medium text-gray-900">{{ t('posts.publish.selfRole') }}</div>
                <div class="text-sm text-gray-500">
                  {{ auth.userDisplayName || auth.currentUser?.username || '-' }}
                </div>
              </div>
            </label>
            
            <label
              :class="[
                'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                form.confessor_mode === 'custom' 
                  ? 'border-brand-500 bg-brand-50/30' 
                  : 'border-gray-200 hover:border-brand-300'
              ]"
            >
              <input
                v-model="form.confessor_mode"
                type="radio"
                value="custom"
                class="w-5 h-5 text-brand-600"
              >
              <div>
                <div class="font-medium text-gray-900">{{ t('posts.publish.anonymousRole') }}</div>
                <div class="text-sm text-gray-500">{{ t('posts.publish.description_anonymousRole') }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Author Name (only show when custom mode) -->
        <div v-show="form.confessor_mode === 'custom'">
          <label for="authorName" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('common.nickname') }}
          </label>
          <GlassInput
            id="authorName"
            v-model="form.author_name"
            type="text"
            :placeholder="t('posts.publish.namePlaceholder')"
            autocomplete="nickname"
            :error="errors.author_name"
            :required="form.confessor_mode === 'custom'"
          />
        </div>

        <!-- Target Name (only show for confession card) -->
        <div v-show="form.card_type === 'confession'">
          <label for="targetName" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('posts.publish.targetName') }}
          </label>
          <GlassInput
            id="targetName"
            v-model="form.target_name"
            type="text"
            :placeholder="t('posts.publish.targetNamePlaceholder')"
            :error="errors.target_name"
            :required="form.card_type === 'confession'"
          />
        </div>

        <!-- Content -->
        <div>
          <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('common.content') }}
          </label>
          <GlassTextarea
            id="content"
            v-model="form.content"
            :rows="8"
            :max-length="2000"
            :placeholder="form.card_type === 'communication' ? t('posts.publish.description_social') : t('posts.publish.description_confessional')"
            :error="errors.content"
            required
          />
        </div>

        <!-- Image Upload -->
        <div>
          <label for="image" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('posts.publish.uploadImage') }}
          </label>
          
          <!-- Upload Area -->
          <div
            :class="[
              'relative border-2 border-dashed rounded-lg p-6 transition-all',
              dragover ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-300'
            ]"
            @drop.prevent="handleDrop"
            @dragover.prevent="dragover = true"
            @dragleave.prevent="dragover = false"
          >
            <!-- Preview Grid -->
            <div v-if="imagePreviews.length" class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="(preview, index) in imagePreviews"
                  :key="`preview-${index}`"
                  class="relative group"
                >
                  <NuxtImg
                    :src="preview"
                    :alt="t('common.preview')"
                    class="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    class="absolute -top-2 -right-2 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    @click="removeImage(index)"
                  >
                    <XIcon class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="text-sm text-gray-600 text-center space-y-1">
                <button
                  type="button"
                  class="text-brand-600 hover:text-brand-700 hover:underline font-medium"
                  @click="fileInput?.click()"
                >
                  {{ t('posts.publish.uploadMore') }}
                </button>
                <p class="text-xs text-gray-500">{{ t('posts.publish.imageTotal', { number: form.images.length }) }}</p>
              </div>
            </div>

            <!-- Upload Prompt -->
            <div v-else class="space-y-2 text-center">
              <ImageIcon class="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p class="text-sm text-gray-600">
                  {{ t('posts.publish.addPhoto0') }}
                  <button
                    type="button"
                    class="text-brand-600 hover:text-brand-700 hover:underline font-medium ml-1"
                    @click="fileInput?.click()"
                  >
                    {{ t('posts.publish.addPhoto1') }}
                  </button>
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ t('posts.publish.limits') }}
                </p>
              </div>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="hidden"
              multiple
              @change="handleFileSelect"
            >
          </div>
          
          <p v-if="errors.images" class="mt-1 text-sm text-red-500">
            {{ errors.images }}
          </p>
        </div>

        <!-- Submit Buttons -->
        <div class="flex gap-4 pt-4">
          <GlassButton
            type="button"
            variant="secondary"
            class="flex-1 h-11 text-base rounded-md inline-flex items-center justify-center gap-2"
            @click="$router.back()"
          >
            {{ t('common.cancel') }}
          </GlassButton>
          
          <GlassButton
            type="submit"
            variant="secondary"
            class="flex-1 h-11 text-base font-semibold rounded-md inline-flex items-center justify-center gap-2"
            :disabled="!isFormValid || loading"
            @click="handleSubmit"
          >
            <PlusIcon class="w-5 h-5" />
            {{ loading ? '发布中...' : t('posts.post') }}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
    </div>

    <!-- Tips Card -->
    <div class="max-w-4xl mx-auto">
      <GlassCard class="mt-6 p-6">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <LightbulbIcon class="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 class="font-medium text-gray-900 mb-2">{{ t('posts.publish.tip.index') }}</h3>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• {{ t('posts.publish.tip.0') }}</li>
              <li>• {{ t('posts.publish.tip.1') }}</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import { ImageIcon, XIcon, LightbulbIcon, PlusIcon } from 'lucide-vue-next'
import { z } from 'zod'
import GlassInput from '~/components/ui/GlassInput.vue'
import GlassTextarea from '~/components/ui/GlassTextarea.vue'
import type { PostForm } from '~/types'
import GlassCard from "~/components/ui/GlassCard.vue";
import GlassButton from "~/components/ui/GlassButton.vue";
// DOM refs
const fileInput = ref<HTMLInputElement | null>(null)

// Form schema
const postSchema = z.object({
  author_name: z.string().optional(),
  target_name: z.string().optional(),
  content: z.string().min(1, t('posts.publish.cantEmpty')).max(2000, t('posts.publish.cantOversize')),
  card_type: z.enum(['confession', 'communication']).optional(),
  confessor_mode: z.enum(['self', 'custom']).default('custom'),
}).superRefine((data, ctx) => {
  // 当模式为 custom 时，author_name 是必需的
  if (data.confessor_mode === 'custom' && (!data.author_name || data.author_name.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('posts.publish.namePlaceholder'),
      path: ['author_name']
    })
  }
  // 验证长度
  if (data.confessor_mode === 'custom' && data.author_name && data.author_name.length > 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('posts.publish.nameOversize'),
      path: ['author_name']
    })
  }
  // 表白卡必须有表白对象
  if (data.card_type === 'confession' && (!data.target_name || data.target_name.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('posts.publish.cantEmpty'),
      path: ['target_name']
    })
  }
  // 验证表白对象长度
  if (data.card_type === 'confession' && data.target_name && data.target_name.length > 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('posts.publish.nameOversize'),
      path: ['target_name']
    })
  }
})

// State
const cookies = useSessionCookies()
const form = reactive<PostForm & { confessor_mode: 'self' | 'custom' }>({
  author_name: '',
  target_name: '',
  content: '',
  card_type: 'confession', // 默认为表白卡
  images: [],
  confessor_mode: 'custom', // 默认为自定义模式
})

const errors = reactive<Partial<Record<keyof PostForm, string>>>({})
const loading = ref(false)
const dragover = ref(false)
const imagePreviews = ref<string[]>([])

// Stores
const auth = useAuthStore()
const api = useNuxtApp().$api
const toast = useToast()
const router = useRouter()

const showImageError = (message: string) => {
  errors.images = message
  toast.error(message)
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      if (errors.images === message) {
        delete errors.images
      }
    }, 3000)
  }
}

// Computed
const isFormValid = computed(() => {
  const blockingErrors = Object.entries(errors)
    .filter(([key, value]) => key !== 'images' && !!value)

  // 基础验证：内容不能为空
  let baseValid = form.content && blockingErrors.length === 0

  // 表白卡需要表白对象
  if (form.card_type === 'confession') {
    baseValid = baseValid && !!form.target_name
  }

  // 自定义模式需要昵称
  if (form.confessor_mode === 'custom') {
    return baseValid && !!form.author_name
  }

  return baseValid
})

// Validate form
const validateForm = () => {
  try {
    postSchema.parse(form)
    // Clear errors
    Object.keys(errors).forEach(key => delete errors[key as keyof PostForm])
    return true
  } catch (err: any) {
    // Set field errors
    Object.keys(errors).forEach(key => delete errors[key as keyof PostForm])
    if (err.errors) {
      err.errors.forEach((error: any) => {
        errors[error.path[0] as keyof PostForm] = error.message
      })
    }
    return false
  }
}

// Handle file selection
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxFileSize = 5 * 1024 * 1024
const maxImages = 9

const resetFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files?.length) {
    await processFiles(files)
  }
  resetFileInput()
}

// Handle drag and drop
const handleDrop = async (event: DragEvent) => {
  dragover.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    await processFiles(files)
  }
}

const processFiles = async (files: FileList | File[]) => {
  const incoming = Array.from(files)

  if (form.images.length >= maxImages) {
    showImageError(t('posts.publish.error.imageTooMany'))
    return
  }

  const availableSlots = maxImages - form.images.length
  const filesToProcess = incoming.slice(0, availableSlots)

  for (const file of filesToProcess) {
    if (!allowedTypes.includes(file.type)) {
      showImageError(t('posts.publish.error.unsupportedImageFormat'))
      continue
    }
    if (file.size > maxFileSize) {
      showImageError(t('posts.publish.error.imageOversize'))
      continue
    }

    form.images.push(file)
    delete errors.images
    imagePreviews.value.push(await fileToDataUrl(file))
  }

  if (incoming.length > filesToProcess.length) {
    showImageError(t('posts.publish.error.imageTooMany'))
  }
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error(t('error.messages.unknown')))
    reader.readAsDataURL(file)
  })
}

// Remove image
const removeImage = (index: number) => {
  form.images.splice(index, 1)
  imagePreviews.value.splice(index, 1)
  if (form.images.length === 0) {
    delete errors.images
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm() || loading.value) return
  
  loading.value = true
  
  try {
    // Create FormData
    const formData = new FormData()
    
    // 根据模式处理 author_name
    if (form.confessor_mode === 'custom') {
      formData.append('author_name', form.author_name)
    }

    // 只有表白卡才需要表白对象
    if (form.card_type === 'confession' && form.target_name) {
      formData.append('target_name', form.target_name)
    }

    formData.append('content', form.content)
    formData.append('confessor_mode', form.confessor_mode)

    // 添加卡片类型
    if (form.card_type) {
      // 若为交流卡，后端期望的值为 social
      formData.append('card_type', form.card_type === 'communication' ? 'social' : form.card_type)
    }

    form.images.forEach(image => {
      formData.append('images', image)
    })

    // Submit post
    const newPost = await api.createPost(formData)

    toast.success(t('posts.publish.toasts.sent'))

    // Redirect to home page
    await router.push('/')
  } catch (err: any) {
    console.error('Failed to create post:', err)
    toast.error(err.message || t('error.messages.unknown'))
  } finally {
    loading.value = false
  }
}

// Real-time validation
watch(form, () => {
  if (Object.keys(errors).length > 0) {
    validateForm()
  }
})

// Page meta
definePageMeta({
  title: { k: 'posts.publish.title' },
  middleware: ['auth'],
  ssr: false
})
</script>


