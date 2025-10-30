<template>
  <div class="space-y-4">
    <!-- Header: current/new avatar (click to pick) -->
    <div class="flex items-center gap-4">
      <button
        class="relative h-20 w-20 aspect-square rounded-full overflow-hidden ring-2 ring-neutral-700 hover:ring-emerald-500 transition"
        @click="triggerFile()"
      >
        <NuxtImg
          v-if="previewUrl"
          :src="previewUrl"
          alt="Avatar preview"
          class="h-full w-full object-cover"
          draggable="false"
        />
        <div v-else class="h-full w-full grid place-items-center bg-neutral-800 text-neutral-400 text-xs">
          Click to upload
        </div>
        <div class="absolute bottom-0 inset-x-0 text-[10px] bg-black/50 text-white text-center py-0.5">
          {{ isEditing ? 'Change' : 'Upload' }}
        </div>
      </button>

      <div class="text-sm text-neutral-300">
        <div class="font-medium">Avatar</div>
        <div class="opacity-70">
          Click the avatar to pick a photo.
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange"/>

    <div v-if="isEditing && imageLoaded" class="space-y-3">
      <div
        ref="cropperBox"
        class="relative mx-auto bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
        :style="{ width: cropperSize+'px', height: cropperSize+'px', touchAction: 'none' }"
        tabindex="0"
        @keydown.stop.prevent="onKeyDown"
      >
        <canvas
          ref="workCanvas"
          :width="cropperSize"
          :height="cropperSize"
          class="block select-none"
          style="touch-action:none; cursor: grab;"
          @pointerdown.stop.prevent="onPointerDown"
          @pointermove.stop.prevent="onPointerMove"
          @pointerup.stop="onPointerUp"
          @pointercancel.stop="onPointerUp"
          @wheel.stop.prevent="onWheel"
          @contextmenu.prevent
        />
        <!-- Dim/mask overlay (clicks pass through) -->
        <div class="pointer-events-none absolute inset-0">
          <svg class="w-full h-full block" :viewBox="`0 0 ${cropperSize} ${cropperSize}`" aria-hidden="true">
            <defs>
              <mask :id="maskId">
                <rect :width="cropperSize" :height="cropperSize" fill="white"/>
                <circle :cx="cropperSize/2" :cy="cropperSize/2" :r="(cropperSize/2) - 4" fill="black"/>
              </mask>
            </defs>
            <rect :width="cropperSize" :height="cropperSize" :mask="`url(#${maskId})`" fill="rgba(0,0,0,0.55)"/>
            <circle :cx="cropperSize/2" :cy="cropperSize/2" :r="(cropperSize/2) - 4"
                    fill="none" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-dasharray="2 3"/>
          </svg>
        </div>
      </div>

      <!-- Minimal controls: Rotate only -->
      <div class="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
        <span class="text-xs text-neutral-400">Rotate</span>
        <div class="flex gap-2">
          <button class="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700" @click="rotate(-90)"
                  title="Rotate left">⟲ 90°
          </button>
          <button class="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700" @click="rotate(90)"
                  title="Rotate right">⟳ 90°
          </button>
        </div>
      </div>

      <!-- Live circular previews -->
      <div class="flex items-center gap-4">
        <div class="text-xs text-neutral-400 w-28">Live preview</div>
        <div class="relative h-16 w-16 rounded-full overflow-hidden ring-1 ring-neutral-700">
          <canvas ref="previewCanvas" width="128" height="128" class="h-full w-full block"></canvas>
        </div>
        <div class="relative h-24 w-24 rounded-full overflow-hidden ring-1 ring-neutral-700">
          <canvas ref="previewCanvasLg" width="256" height="256" class="h-full w-full block"></canvas>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-neutral-800">
      <button class="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600" @click="onCancel">Cancel</button>
      <button class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50" :disabled="!imageLoaded"
              @click="confirm">Save
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onBeforeUnmount, ref, watch} from 'vue'

const props = withDefaults(defineProps<{
  currentUrl?: string
  outputSize?: number
  cropperSize?: number
  maxZoom?: number
}>(), {
  currentUrl: '',
  outputSize: 512,
  cropperSize: 360,
  maxZoom: 5
})

const emit = defineEmits<{
  (e: 'resolve', file: File): void
  (e: 'reject', err: any): void
  (e: 'close'): void
}>()

/* DOM refs */
const fileInput = ref<HTMLInputElement | null>(null)
const workCanvas = ref<HTMLCanvasElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const previewCanvasLg = ref<HTMLCanvasElement | null>(null)
const cropperBox = ref<HTMLDivElement | null>(null)

const cropperSize = computed(() => props.cropperSize)
const maskId = `mask-${Math.random().toString(36).slice(2)}`

/* Image & state */
const img = new Image()
img.decoding = 'async'
img.crossOrigin = 'anonymous'

const isEditing = ref(false)      // only true after user selects a file
const imageLoaded = ref(false)
const sourceUrl = ref<string | null>(null)
const previewUrl = computed(() => sourceUrl.value || props.currentUrl || '')

/* Transform state */
const scale = ref(1)
const minScale = ref(1)
const maxScale = computed(() => props.maxZoom)
const offset = ref({x: 0, y: 0})
const rotation = ref(0)

/* rAF throttling */
let raf = 0

function scheduleDraw() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    draw()
  })
}

/* File flow */
function triggerFile() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  isEditing.value = true
  const url = URL.createObjectURL(file)
  loadSource(url)
}

function loadSource(url: string) {
  sourceUrl.value = url
  imageLoaded.value = false
  img.onload = () => {
    setupInitialTransform()
    imageLoaded.value = true
    scheduleDraw()
    // focus cropper so keyboard works immediately
    requestAnimationFrame(() => cropperBox.value?.focus())
  }
  img.onerror = () => emit('reject', new Error('Failed to load image'))
  img.src = url
}

function onCancel() {
  // reset editing state; keep current avatar preview
  isEditing.value = false
  sourceUrl.value = null
  imageLoaded.value = false
  emit('close')
}

/* Dragging with Pointer Events */
let dragging = false
let dragStart = {x: 0, y: 0}
let offsetStart = {x: 0, y: 0}

function onPointerDown(ev: PointerEvent) {
  if (!imageLoaded.value) return
  dragging = true;
  const el = ev.currentTarget as HTMLElement
  if (el && typeof el.setPointerCapture === 'function') {
    el.setPointerCapture(ev.pointerId)
  }
  dragStart = { x: ev.clientX, y: ev.clientY }
  offsetStart = { ...offset.value };
  (ev.currentTarget as HTMLElement).style.cursor = 'grabbing'
}

function onPointerMove(ev: PointerEvent) {
  if (!dragging) return
  ev.preventDefault()
  const dx = ev.clientX - dragStart.x
  const dy = ev.clientY - dragStart.y
  offset.value = clampOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy })
  scheduleDraw()
}

function onPointerUp(ev?: PointerEvent) {
  if (!dragging) return
  dragging = false
  workCanvas.value!.style.cursor = 'grab'
}

/* Wheel = zoom (also supports trackpads) */
function onWheel(ev: WheelEvent) {
  let dy = ev.deltaY
  if (ev.deltaMode === 1) dy *= 16     // lines -> px
  else if (ev.deltaMode === 2) dy *= workCanvas.value!.clientHeight // pages -> px

  const rect = workCanvas.value!.getBoundingClientRect()
  const cx = ev.clientX - rect.left - rect.width / 2
  const cy = ev.clientY - rect.top  - rect.height / 2

  // linear step: negative dy zooms in
  const proposed = scale.value + (-dy) * WHEEL_SENS
  setScaleLinear(proposed, { x: cx, y: cy })
}

/* Keyboard: arrows to move; Ctrl+Up/Down to zoom */
function onKeyDown(ev: KeyboardEvent) {
  if (!imageLoaded.value) return

  if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
    ev.preventDefault()
    const base = Math.max(minScale.value, 1)
    const delta = base * KEY_STEP_FACTOR * (ev.key === 'ArrowUp' ? +1 : -1)
    setScaleLinear(scale.value + delta, { x: 0, y: 0 })
    return
  }

  if (/Arrow(Up|Down|Left|Right)/.test(ev.key)) {
    ev.preventDefault()
    // movement in CSS px (feels linear). Shift = bigger step
    const step = ev.shiftKey ? 30 : 10
    const dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0
    const dy = ev.key === 'ArrowUp'   ? -step : ev.key === 'ArrowDown'  ? step : 0
    offset.value = clampOffset({ x: offset.value.x + dx, y: offset.value.y + dy })
    scheduleDraw()
  }
}

function setupInitialTransform() {
  const S = cropperSize.value
  const iw = (rotation.value % 180 === 0) ? img.width : img.height
  const ih = (rotation.value % 180 === 0) ? img.height : img.width
  const fit = Math.max(S / iw, S / ih)
  minScale.value = fit
  scale.value = Math.min(Math.max(fit * 1.02, fit), maxScale.value)
  offset.value = clampOffset({x: 0, y: 0})
}

function rotate(deg: number) {
  rotation.value = ((rotation.value + deg) % 360 + 360) % 360
  setupInitialTransform()
  scheduleDraw()
  requestAnimationFrame(() => cropperBox.value?.focus())
}

/* Bounds helpers */
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

const EPS = 0.5
const WHEEL_SENS = 1 / 900; // scale units per pixel scrolled (smaller = softer)
const KEY_STEP_FACTOR = 0.06; // 6% of minScale per Ctrl+Arrow

function setScaleLinear(newScale: number, focus?: {x:number;y:number}) {
  const prev = scale.value
  let next = Math.min(maxScale.value, Math.max(minScale.value, newScale))
  if (next < minScale.value + 1e-4) next = minScale.value

  const fx = focus?.x ?? 0
  const fy = focus?.y ?? 0
  const k = next / prev

  const nx = fx - k * (fx - offset.value.x)
  const ny = fy - k * (fy - offset.value.y)

  scale.value = next
  offset.value = clampOffset({ x: nx, y: ny })
  scheduleDraw()
}

function clampOffset(o: {x:number;y:number}) {
  const S = cropperSize.value
  const rot90 = (rotation.value % 180) !== 0
  const w = (rot90 ? img.height : img.width) * scale.value
  const h = (rot90 ? img.width  : img.height) * scale.value
  const hx = w / 2, hy = h / 2

  // Bounds to keep the image fully covering the square crop
  const minX = Math.min(0, S/2 - hx) + EPS
  const maxX = Math.max(0, hx - S/2) - EPS
  const minY = Math.min(0, S/2 - hy) + EPS
  const maxY = Math.max(0, hy - S/2) - EPS

  // If the image is barely larger than the crop, snap to edges
  const x = Math.min(maxX, Math.max(minX, o.x))
  const y = Math.min(maxY, Math.max(minY, o.y))
  return { x, y }
}

function ensureHiDPI(canvas: HTMLCanvasElement, cssSize: number) {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(cssSize * dpr)
  canvas.height = Math.round(cssSize * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // 1 unit == 1 CSS px
  return ctx
}


/* Drawing */
function draw() {
  const S = cropperSize.value
  const ctx = ensureHiDPI(workCanvas.value!, S)
  if (!ctx) return

  // the ensureHiDPI transform already maps CSS px → device px
  ctx.clearRect(0, 0, S, S)
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, S, S)
  ctx.imageSmoothingEnabled = true
  ;(ctx as any).imageSmoothingQuality = 'high'

  ctx.translate(S / 2 + offset.value.x, S / 2 + offset.value.y)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.scale(scale.value, scale.value)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)

  renderCirclePreview(previewCanvas.value, 128)
  renderCirclePreview(previewCanvasLg.value, 256)
}

function renderCirclePreview(canvas: HTMLCanvasElement | null, size: number) {
  if (!canvas) return
  const S = cropperSize.value
  const ctx = canvas.getContext('2d')!
  canvas.width = size
  canvas.height = size
  ctx.clearRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  ;(ctx as any).imageSmoothingQuality = 'high'
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(workCanvas.value!, 0, 0, S, S, 0, 0, size, size)
  ctx.restore()
}

/* Export */
async function confirm() {
  try {
    const outSize = props.outputSize
    const out = document.createElement('canvas')
    out.width = outSize
    out.height = outSize
    const octx = out.getContext('2d')!
    octx.imageSmoothingEnabled = true
    ;(octx as any).imageSmoothingQuality = 'high'
    octx.drawImage(workCanvas.value!, 0, 0, cropperSize.value, cropperSize.value, 0, 0, outSize, outSize)

    const blob: Blob = await new Promise((res) => out.toBlob((b) => res(b!), 'image/png', 0.95))
    const file = new File([blob], 'avatar.png', {type: 'image/png'})
    emit('resolve', file)
  } catch (e) {
    emit('reject', e)
  }
}

/* Clean up drag if pointer released outside window */
function onWindowPointerUp() {
  if (dragging) onPointerUp()
}

onMounted(() => {
  window.addEventListener('pointerup', onWindowPointerUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', onWindowPointerUp)
})

/* redraw on transform changes */
watch([scale, offset, rotation], () => {
  if (imageLoaded.value) scheduleDraw()
})
</script>
