<template>
  <div class="content-container py-8 flex items-start justify-center overflow-auto relative z-30">
    <div class="w-full max-w-md">
      <div class="glass-card p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <div class="p-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600">
              <UserPlusIcon class="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ t('auth.register.index') }}</h1>
          <p class="text-gray-600">{{ t('auth.register.description') }}</p>
        </div>

        <!-- Registration Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.username') }} *</label>
            <GlassInput
              id="username"
              v-model="form.username"
              type="text"
              :placeholder="t('auth.login.usernamePlaceholder')"
              autocomplete="username"
              :error="errors.username"
              required
            />
            <p class="mt-1 text-xs text-gray-500">{{ t('auth.register.usernameLimit') }}</p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">{{ t('common.password') }} *</label>
            <GlassInput
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('auth.login.passwordPlaceholder')"
              autocomplete="new-password"
              :show-password-toggle="true"
              :error="errors.password"
              required
            />
            <p class="mt-1 text-xs text-gray-500">{{ t('auth.login.passwordTooShort') }}</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">{{ t('auth.changePassword.forms.confirmPassword') }} *</label>
            <GlassInput
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              :placeholder="t('auth.changePassword.forms.confirmPasswordPlaceholder')"
              autocomplete="new-password"
              :show-password-toggle="true"
              :error="errors.confirmPassword"
              required
            />
          </div>

          <!-- Terms -->
          <div class="flex items-start gap-3">
            <input
              id="acceptTerms"
              v-model="acceptTerms"
              type="checkbox"
              class="mt-1 w-4 h-4 text-brand-600 bg-white/30 border border-white/20 rounded focus:ring-brand-500 focus:ring-2"
            >
            <label for="acceptTerms" class="text-sm text-gray-600">
              {{ t('auth.register.agreeWithTerms') }}
              <a href="#" class="text-brand-600 hover:text-brand-700">{{ t('home.tos') }}</a>
              <a href="#" class="text-brand-600 hover:text-brand-700">{{ t('home.privacy') }}</a>
            </label>
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
            @click="handleSubmit"
          >
            {{ t('home.register') }}
          </GlassButton>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center space-y-4">
          <p class="text-sm text-gray-600">
            {{ t('auth.register.loginSuggestion') }}
            <NuxtLink 
              :to="localePath('/auth/login')"
              class="text-brand-600 hover:text-brand-700 hover:underline ml-1 font-medium"
            >
              {{ t('home.login') }}
            </NuxtLink>
          </p>
          
          <NuxtLink
            :to="localePath('/')"
            class="glass-button-secondary text-sm px-3 py-1 inline-flex items-center gap-1"
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

import { UserPlusIcon, ArrowLeftIcon } from 'lucide-vue-next'
import { z } from 'zod'
import GlassInput from '~/components/ui/GlassInput.vue'
import GlassButton from '~/components/ui/GlassButton.vue'
import type { RegisterForm } from '~/types'

// Form schema
const registerSchema = z.object({
  username: z.string()
    .min(3, t('auth.register.usernameTooShort'))
    .max(20, t('auth.register.usernameTooLong'))
    .regex(/^[a-zA-Z0-9_]+$/, t('auth.register.usernameCharset')),
  password: z.string()
    .min(6, t('auth.login.passwordTooShort'))
    .max(128, t('auth.register.passwordTooLong')),
})

// State
const form = reactive<RegisterForm>({
  username: '',
  password: '',
})

const confirmPassword = ref('')
const acceptTerms = ref(false)
const errors = reactive<Partial<Record<keyof RegisterForm | 'confirmPassword', string>>>({})
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
  form.password &&
  confirmPassword.value &&
  acceptTerms.value
))

// Validate form
const validateForm = () => {
  try {
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key as keyof typeof errors])
    error.value = ''

    // Validate basic fields
    registerSchema.parse(form)

    // Validate password confirmation
    if (form.password !== confirmPassword.value) {
      errors.confirmPassword = t('auth.changePassword.forms.repeatPasswordNotMatch')
      return false
    }

    return true
  } catch (err: any) {
    // Set field errors
    if (err.errors) {
      err.errors.forEach((error: any) => {
        errors[error.path[0] as keyof RegisterForm] = error.message
      })
    }
    return false
  }
}

// Handle form submission
const handleSubmit = async () => {
  console.log('[Register] submit clicked')
  if (!validateForm() || loading.value) return

  if (!acceptTerms.value) {
    error.value = t('auth.register.notAgreeWithTerms')
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('[Register] opening captcha dialog')

    // 打开验证码弹窗
    const captchaResult = await captchaDialog.open({ title: t('common.captcha') })

    // 用户取消了验证码
    if (!captchaResult) {
      console.log('[Register] captcha cancelled by user')
      loading.value = false
      return
    }

    console.log('[Register] sending register request', { username: form.username })

    // 提交注册请求,包含验证码数据
    await auth.register({
      ...form,
      captcha_id: captchaResult.captcha_id,
      captcha_data: captchaResult.captcha_data,
    })

    // Redirect to intended destination or home
    const redirect = route.query.redirect as string
    await router.push(redirect || '/')
  } catch (err: any) {
    console.error('[Register] error', err)
    error.value = err.message || t('error.messages.unknown')

    // Also show toast notification for registration errors
    const toast = useToast()
    toast.error(err.message || t('error.messages.unknown'))
  } finally {
    loading.value = false
  }
}

// Real-time validation
watch([() => form.username, () => form.password, confirmPassword], () => {
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
  title: { k: 'auth.register.title' },
  ssr: false
})
</script>
