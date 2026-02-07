<template>
  <div class="max-w-2xl mx-auto">
    <GlassCard class="p-8">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="page-title">{{ t('auth.changePassword.index') }}</h1>
        <p class="text-gray-600 mt-2">
          {{ t('auth.changePassword.description') }}
        </p>
      </div>

      <!-- Form -->
      <form class="space-y-6" novalidate @submit.prevent="handleSubmit">
        <!-- Current Password -->
        <div>
          <label for="oldPassword" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('auth.changePassword.forms.currentPassword') }} *
          </label>
          <GlassInput
            id="oldPassword"
            v-model="form.old_password"
            type="password"
            :placeholder="t('auth.changePassword.forms.currentPasswordPlaceholder')"
            autocomplete="current-password"
            :error="errors.old_password"
            required
          />
        </div>

        <!-- New Password -->
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('auth.changePassword.forms.newPassword') }} *
          </label>
          <GlassInput
            id="newPassword"
            v-model="form.new_password"
            type="password"
            :placeholder="t('auth.changePassword.forms.newPasswordPlaceholder')"
            autocomplete="new-password"
            :error="errors.new_password"
            required
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ t('auth.changePassword.forms.newPasswordDescription') }}
          </p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('auth.changePassword.forms.confirmPassword') }} *
          </label>
          <GlassInput
            id="confirmPassword"
            v-model="form.confirm_password"
            type="password"
            :placeholder="t('auth.changePassword.forms.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            :error="errors.confirm_password"
            required
          />
        </div>

        <!-- Submit Buttons -->
        <div class="flex gap-4 pt-6">
          <GlassButton
            type="button"
            variant="secondary"
            class="flex-1"
            @click="$router.back()"
          >
            {{ t('common.cancel') }}
          </GlassButton>
          
          <GlassButton
            type="submit"
            class="flex-1"
            :disabled="!isFormValid || loading"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ t('common.save') }}
          </GlassButton>
        </div>
      </form>
    </GlassCard>

    <!-- Security Tips -->
    <GlassCard class="mt-6 p-6">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <ShieldIcon class="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div>
          <h3 class="font-medium text-gray-900 mb-2">{{ t('auth.changePassword.tips.index') }}</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• {{ t('auth.changePassword.tips.0') }}</li>
            <li>• {{ t('auth.changePassword.tips.1') }}</li>
            <li>• {{ t('auth.changePassword.tips.2') }}</li>
            <li>• {{ t('auth.changePassword.tips.3') }}</li>
          </ul>
        </div>
      </div>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

import { ShieldIcon } from 'lucide-vue-next'
import { z } from 'zod'
import GlassInput from '~/components/ui/GlassInput.vue'
import type { ChangePasswordForm } from '~/types'
import GlassCard from "~/components/ui/GlassCard.vue";
import GlassButton from "~/components/ui/GlassButton.vue";

definePageMeta({
  title: { k: 'auth.changePassword.title' },
  middleware: ['auth'],
  ssr: false
})

// Form schema
const passwordSchema = z.object({
  old_password: z.string().min(1, t('auth.changePassword.forms.currentPasswordPlaceholder')),
  new_password: z.string().min(6, t('auth.changePassword.forms.newPasswordPlaceholder')),
  confirm_password: z.string().min(1, t('auth.changePassword.forms.confirmPasswordPlaceholder')),
}).superRefine((data, ctx) => {
  if (data.new_password !== data.confirm_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('auth.changePassword.forms.repeatPasswordNotMatch'),
      path: ['confirm_password']
    })
  }
})

// State
const form = reactive<ChangePasswordForm>({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const errors = reactive<Partial<Record<keyof ChangePasswordForm, string>>>({})
const loading = ref(false)

// Stores
const api = useNuxtApp().$api
const toast = useToast()
const router = useRouter()

// Computed
const isFormValid = computed(() => {
  return form.old_password.trim() && 
         form.new_password.trim() && 
         form.confirm_password.trim() && 
         form.new_password.length >= 6 && 
         form.new_password === form.confirm_password &&
         form.old_password !== form.new_password
})

// Validate form
const validateForm = () => {
  try {
    passwordSchema.parse(form)
    // Clear errors
    Object.keys(errors).forEach(key => delete errors[key as keyof ChangePasswordForm])
    return true
  } catch (err: any) {
    // Set field errors
    Object.keys(errors).forEach(key => delete errors[key as keyof ChangePasswordForm])
    if (err.errors) {
      err.errors.forEach((error: any) => {
        errors[error.path[0] as keyof ChangePasswordForm] = error.message
      })
    }
    return false
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm() || loading.value) return
  
  loading.value = true
  
  try {
    await api.changePassword(form)
    
    toast.success(t('auth.changePassword.success'))
    
    // 清空表单
    form.old_password = ''
    form.new_password = ''
    form.confirm_password = ''
    
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/me')
    }, 2000)
    
  } catch (err: any) {
    console.error('Change password failed:', err)
    if (err.message?.includes('password')) {
      errors.old_password = t('auth.changePassword.forms.incorrectPassword')
    } else {
      toast.error(err.message || t('error.messages.unknown'))
    }
  } finally {
    loading.value = false
  }
}

// Real-time validation
watch(form, () => {
  // 实时清除错误，让用户能够立即看到按钮状态变化
  if (Object.keys(errors).length > 0) {
    validateForm()
  }
}, { deep: true })

</script>
