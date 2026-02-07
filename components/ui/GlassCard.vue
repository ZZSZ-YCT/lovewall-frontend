<template>
  <div
    :class="[
      'card',
      {
        'card-hover cursor-pointer': interactive,
      }
    ]"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'subtle' | 'frosted'
  interactive?: boolean
  innerGlow?: boolean
  borderGlow?: boolean
  noBorder?: boolean
  blur?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  interactive: false,
  innerGlow: false,
  borderGlow: false,
  noBorder: false,
  blur: 'lg'
})

defineOptions({ inheritAttrs: false })
</script>
