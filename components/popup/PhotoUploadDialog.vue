<!-- PhotoUploadDialog.vue -->
<template>
  <div class="space-y-4 select-none" @paste="onPaste">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-medium">Add photos</h3>
        <p class="text-xs text-neutral-400">Up to {{ maxCount }} images • {{ prettyMaxSize }} each</p>
      </div>
      <div class="text-xs text-neutral-400">{{ files.length }}/{{ maxCount }}</div>
    </div>

    <!-- Dropzone -->
    <label
      class="block"
      @dragenter.prevent="dragActive = true"
      @dragover.prevent="dragActive = true"
      @dragleave.prevent="dragActive = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/*"
        :multiple="true"
        capture="environment"
        @change="onFileInput"
      />

      <div
        class="w-full rounded-2xl border border-dashed p-6 text-center transition
               border-neutral-700/70 bg-neutral-800/30 hover:bg-neutral-800/50
               focus-within:ring-2 focus-within:ring-emerald-600/60"
        :class="dragActive ? 'ring-2 ring-emerald-600/60 bg-neutral-800/60' : ''"
        tabindex="0"
        @keydown.enter.prevent="chooseFiles"
        @keydown.space.prevent="chooseFiles"
      >
        <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-1.586l-1.707-1.707A.997.997 0 0 0 15 5h-4a1 1 0 0 0-.707.293L8.586 7H5a2 2 0 0 0-2 2v7a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3V9a2 2 0 0 0-2-2Zm-7 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/>
          </svg>
        </div>
        <p class="text-sm">
          <button type="button" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2" @click="chooseFiles">
            Click to select
          </button>
          or drag & drop images here
        </p>
        <p class="mt-1 text-xs text-neutral-400">You can also paste from clipboard (⌘/Ctrl + V)</p>
      </div>
    </label>

    <!-- Errors -->
    <transition name="fade">
      <ul v-if="errors.length" class="space-y-1 rounded-lg bg-neutral-900/60 p-3 text-xs text-red-300">
        <li v-for="(err, i) in errors" :key="i">• {{ err }}</li>
      </ul>
    </transition>

    <!-- Previews -->
    <div v-if="files.length" class="grid grid-cols-3 gap-3">
      <div
        v-for="(item, idx) in previews"
        :key="item.id"
        class="group relative overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-900/40"
      >
        <NuxtImg :src="item.url" :alt="item.file.name" class="h-28 w-full object-cover" />
        <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-neutral-900/70 px-2 py-1.5">
          <div class="min-w-0">
            <p class="truncate text-[11px] text-neutral-200">{{ item.file.name }}</p>
            <p class="text-[10px] text-neutral-400">{{ prettyBytes(item.file.size) }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="rounded px-1.5 py-1 text-[10px] text-neutral-300 hover:bg-neutral-700/70"
              title="Preview"
              @click="openLightbox(idx)"
            >Preview</button>
            <button
              class="rounded px-1.5 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
              title="Remove"
              @click.stop="removeById(item.id)"
            >Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs text-neutral-400">
        <button
          class="rounded px-2 py-1 hover:bg-neutral-800/80"
          :disabled="!files.length"
          @click="clearAll"
        >Clear all</button>
        <span v-if="remaining < maxCount!!" class="hidden sm:inline">|</span>
        <span class="hidden sm:inline">{{ remaining }} slot(s) left</span>
      </div>
      <div class="flex justify-end gap-2">
        <button class="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600" @click="$emit('close')">Cancel</button>
        <button
          class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!files.length || files.length > maxCount!!"
          @click="confirm"
        >
          Upload
        </button>
      </div>
    </div>

    <!-- Simple Lightbox -->
    <transition name="fade">
      <div
        v-if="lightboxIdx !== null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        @click.self="lightboxIdx = null"
      >
        <div class="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900">
          <NuxtImg :src="previews[lightboxIdx!]?.url" class="max-h-[85vh] max-w-[90vw] object-contain" />
          <button
            class="absolute right-2 top-2 rounded bg-neutral-800/80 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
            @click="lightboxIdx = null"
          >Close</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

type Emits = {
  (e: 'resolve', files: File[]): void
  (e: 'reject', err: any): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<{
  /** Max number of photos */
  maxCount?: number
  /** Max size in MB per file */
  maxSizeMB?: number
  /** Allowed MIME prefix, defaults to image/* */
  accept?: string
}>(), {
  maxCount: 9,
  maxSizeMB: 10,
  accept: 'image/*',
})

const files = ref<File[]>([])
const errors = ref<string[]>([])
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const lightboxIdx = ref<number | null>(null)

type Preview = { id: string; file: File; url: string }
const previews = reactive<Preview[]>([])

const remaining = computed(() => Math.max(0, props.maxCount - files.value.length))
const prettyMaxSize = computed(() => `${props.maxSizeMB} MB`)

/** Helpers */
function prettyBytes(n: number) {
  const units = ['B','KB','MB','GB']
  let i = 0; let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
function chooseFiles() {
  fileInput.value?.click()
}
function openLightbox(idx: number) {
  lightboxIdx.value = idx
}
function clearAll() {
  files.value = []
}

/** Generate stable id for dedupe */
function fileKey(f: File) {
  return `${f.name}::${f.size}::${f.lastModified}`
}

function validateAndAdd(incoming: File[]) {
  const nextErrors: string[] = []
  const currentKeys = new Set(files.value.map(fileKey))
  const accepted: File[] = []

  for (const f of incoming) {
    if (!f.type.startsWith('image/')) {
      nextErrors.push(`"${f.name}" is not an image.`)
      continue
    }
    if (f.size > props.maxSizeMB * 1024 * 1024) {
      nextErrors.push(`"${f.name}" exceeds ${props.maxSizeMB} MB.`)
      continue
    }
    const key = fileKey(f)
    if (currentKeys.has(key) || accepted.some(x => fileKey(x) === key)) {
      nextErrors.push(`Duplicate ignored: "${f.name}".`)
      continue
    }
    if (files.value.length + accepted.length >= props.maxCount) {
      nextErrors.push(`Reached the limit of ${props.maxCount} photos.`)
      break
    }
    accepted.push(f)
  }

  if (accepted.length) {
    files.value = files.value.concat(accepted)
  }
  if (nextErrors.length) {
    errors.value = nextErrors
    // Auto-clear errors after a short delay
    setTimeout(() => { if (errors.value === nextErrors) errors.value = [] }, 4000)
  }
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const list = input.files ? Array.from(input.files) : []
  validateAndAdd(list)
  // reset so same file can be selected again later
  if (fileInput.value) fileInput.value.value = ''
}

function onDrop(e: DragEvent) {
  dragActive.value = false
  const dt = e.dataTransfer
  if (!dt) return
  const list = Array.from(dt.files ?? [])
  validateAndAdd(list)
}

function onPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items ?? [])
  const files = items
    .filter(i => i.kind === 'file')
    .map(i => i.getAsFile())
    .filter((f): f is File => !!f)
  if (files.length) validateAndAdd(files)
}

/** Build & maintain previews */
watch(files, (now, prev) => {
  // Revoke previews for removed files
  const prevKeys = new Set((prev ?? []).map(fileKey))
  const nowKeys = new Set(now.map(fileKey))
  for (const p of [...previews]) {
    if (!nowKeys.has(fileKey(p.file))) {
      URL.revokeObjectURL(p.url)
    }
  }
  // Rebuild in order
  previews.splice(0, previews.length, ...now.map(f => ({
    id: fileKey(f),
    file: f,
    url: URL.createObjectURL(f),
  })))
})

function removeById(id: string) {
  const keyToRemove = id
  // Rebuild files without the removed one (avoids in-place index surprises)
  files.value = files.value.filter(f => fileKey(f) !== keyToRemove)
}

function confirm() {
  // safety: enforce max on confirm too
  if (!files.value.length) return
  if (files.value.length > props.maxCount) {
    errors.value = [`Please select at most ${props.maxCount} photos (currently ${files.value.length}).`]
    return
  }
  emit('resolve', files.value)
}

onBeforeUnmount(() => {
  for (const p of previews) URL.revokeObjectURL(p.url)
})

defineExpose({
  /** optional programmatic focus for parent if desired */
  focus: () => fileInput.value?.focus(),
})

</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
