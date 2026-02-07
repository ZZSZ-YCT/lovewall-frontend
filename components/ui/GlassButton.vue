<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : 'false'"
    v-bind="$attrs"
    :class="[
      'btn',
      variantClass,
      {
        'opacity-50 cursor-not-allowed': disabled,
        'w-full': fullWidth
      },
      $attrs.class
    ]"
    @click="$emit('click', $event)"
  >
    <div class="flex items-center justify-center gap-2">
      <div
        v-if="loading"
        :class="[
          'animate-spin w-4 h-4 border-2 rounded-full',
          variant === 'primary' || variant === 'danger'
            ? 'border-white/30 border-t-white'
            : 'border-gray-300 border-t-gray-600'
        ]"
      />
      <slot />
    </div>
  </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }
  return map[props.variant] || 'btn-primary'
})
</script>
