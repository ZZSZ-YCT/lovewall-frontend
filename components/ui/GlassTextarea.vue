<template>
  <div class="relative">
    <textarea
      :id="id"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :maxlength="maxLength"
      :value="modelValue"
      :class="[
        'input w-full px-3 py-2 text-sm resize-none',
        {
          'border-red-400 focus:ring-red-200 focus:border-red-400': hasError
        },
        inputClass
      ]"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />

    <!-- Character counter -->
    <div
      v-if="maxLength"
      class="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none"
    >
      {{ currentLength }}/{{ maxLength }}
    </div>
  </div>

  <!-- Error message -->
  <p v-if="error" class="mt-1 text-sm text-red-500">
    {{ error }}
  </p>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  modelValue?: string
  error?: string
  maxLength?: number
  inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: Event]
  focus: [event: Event]
}>()

const hasError = computed(() => !!props.error)
const inputClass = computed(() => props.inputClass)
const currentLength = computed(() => props.modelValue?.length || 0)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  let value = target.value

  if (props.maxLength && value.length > props.maxLength) {
    value = value.slice(0, props.maxLength)
    target.value = value
  }

  emit('update:modelValue', value)
}
</script>
