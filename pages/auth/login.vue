<template>
  <div class="py-8 flex items-start justify-center">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <div class="p-3 rounded-full bg-brand-600">
              <HeartIcon class="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ t('auth.login.welcome') }}</h1>
          <p class="text-gray-600">{{ t('auth.login.description') }}</p>
        </div>

        <!-- Login Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.username') }}</label>
            <GlassInput
              id="username"
              v-model="form.username"
              type="text"
              :placeholder="t('auth.login.usernamePlaceholder')"
              autocomplete="username"
              :error="errors.username"
              required
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.password') }}</label>
            <GlassInput
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('auth.login.passwordPlaceholder')"
              autocomplete="current-password"
              :show-password-toggle="true"
              :error="errors.password"
              required
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 rounded-lg bg-red-50/50 border border-red-200">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Submit Button (outlined) -->
          <GlassButton
            type="submit"
            variant="secondary"
            class="w-full"
            :disabled="!isFormValid || loading"
          >
            {{ t('home.login') }}
          </GlassButton>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center space-y-4">
          <p class="text-sm text-gray-600">
            {{ t('auth.login.registerSuggestion') }}
            <NuxtLink
              :to="localePath('/auth/register')"
              class="text-brand-600 hover:text-brand-700 hover:underline ml-1 font-medium"
            >
              {{ t('auth.login.registerNow') }}
            </NuxtLink>
          </p>

          <NuxtLink
            :to="localePath('/')"
            class="btn-secondary text-sm px-3 py-1 inline-flex items-center gap-1 rounded-md"
          >
            <ArrowLeftIcon class="w-4 h-4" />
            {{ t('home.backHome') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <CaptchaDialog />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

import { HeartIcon, ArrowLeftIcon } from 'lucide-vue-next'
import GlassButton from '~/components/ui/GlassButton.vue'
import { z } from 'zod'
import GlassInput from '~/components/ui/GlassInput.vue'
import type { LoginForm } from '~/types'
import CaptchaDialog from '~/components/popup/CaptchaDialog.vue'

// Form schema
const loginSchema = z.object({
  username: z.string().min(1, t('auth.login.usernamePlaceholder')).max(50, t('posts.publish.nameOversize')),
  password: z.string().min(1, t('auth.login.passwordPlaceholder')).min(6, t('auth.login.passwordTooShort')),
})

// State
const form = reactive<LoginForm>({
  username: '',
  password: '',
})

const errors = reactive<Partial<Record<keyof LoginForm, string>>>({})
const loading = ref(false)
const error = ref('')

// Stores
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const captchaDialog = useCaptchaDialog()

// Computed
const isFormValid = computed(() => !!(
  form.username &&
  form.password
))

// Validate form
const validateForm = () => {
  try {
    loginSchema.parse(form)
    // Clear errors
    Object.keys(errors).forEach(key => delete errors[key as keyof LoginForm])
    error.value = ''
    return true
  } catch (err: any) {
    // Set field errors
    Object.keys(errors).forEach(key => delete errors[key as keyof LoginForm])
    if (err.errors) {
      err.errors.forEach((error: any) => {
        errors[error.path[0] as keyof LoginForm] = error.message
      })
    }
    return false
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm() || loading.value) return

  loading.value = true
  error.value = ''

  try {
    console.log('Opening captcha dialog...')

    // 打开验证码弹窗
    const captchaResult = await captchaDialog.open({ title: t('common.captcha') })

    // 用户取消了验证码
    if (!captchaResult) {
      console.log('Captcha cancelled by user')
      loading.value = false
      return
    }

    console.log('Captcha completed, attempting login with:', { username: form.username })

    // 提交登录请求,包含验证码数据
    await auth.login({
      ...form,
      captcha_id: captchaResult.captcha_id,
      captcha_data: captchaResult.captcha_data,
    })

    console.log('Login successful, user:', auth.currentUser)

    // Redirect to intended destination or home
    const redirect = route.query.redirect as string
    console.log('Redirecting to:', redirect || '/')
    await router.push(redirect || '/')
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || t('auth.login.invalidCredentials')

    // Also show toast notification for login errors
    const toast = useToast()
    toast.error(err.message || t('auth.login.invalidCredentials'))
  } finally {
    loading.value = false
  }
}

// Real-time validation
watch(form, () => {
  if (Object.keys(errors).length > 0 || error.value) {
    validateForm()
  }
})

// Redirect if already logged in
watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    }
  },
  { immediate: true }
)

// Page meta
definePageMeta({
  title: { k: 'auth.login.title' },
  ssr: false
})
</script>
