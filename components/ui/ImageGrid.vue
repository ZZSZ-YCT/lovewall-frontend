<template>
  <div>
    <div v-if="images?.length" class="space-y-3">
      <div ref="galleryRef" :class="gridWrapperClass">
        <a
          v-for="(image, index) in images.slice(0, maxThumbs)"
          :href="resolveOriginalImage(image)"
          :key="`${image}-${index}`"
          :data-pswp-width="2400"
          :data-pswp-height="2400"
          target="_blank"
          rel="noreferrer"
          @click.prevent.stop="openGallery(index)"
          class="relative overflow-hidden rounded-lg md:rounded-xl"
        >
          <NuxtPicture
            :src="resolveThumbnail(image)"
            :alt="`${altPrefix} ${index + 1}`"
            :class="imageClass"
            class="relative w-full h-full rounded-lg md:rounded-xl overflow-hidden"
            fit="inside"
            sizes="100vw sm:50vw md:400px"
            :modifiers="{width: 400,height: 400,fit: 'cover',quality: 70}"
            :imgAttrs="{ class: 'w-full h-full object-cover rounded-lg md:rounded-xl', fetchpriority: fetchPriority }"
            :loading="loadingMode"
            :preload="{ fetchPriority: fetchPriority }"
            decoding="async"
          />

          <!-- Last visible tile: overlay +N if there are more images -->
          <div
            v-if="hiddenCount > 0 && index === maxThumbs - 1"
            class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-semibold rounded-lg md:rounded-xl"
          >
            +{{ hiddenCount }}
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  images: string[]
  altPrefix?: string
  eager?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  altPrefix: 'Image'
})


const loadingMode = computed(() => (props.eager ? 'eager' : 'lazy'))
const fetchPriority = computed(() => (props.eager ? 'high' : 'auto'))

const maxThumbs = 4
const hiddenCount = computed(() => Math.max(props.images.length - maxThumbs, 0))

const {assetUrl} = useAssetUrl()
const galleryRef = ref<HTMLElement>()

const lightbox = ref<any>(null)

const ensureLightbox = async () => {
  if (lightbox.value) return lightbox.value

  if (import.meta.client) {
    await import('photoswipe/style.css')
  }

  const PhotoSwipeLightbox = (await import('photoswipe/lightbox')).default

  lightbox.value = new PhotoSwipeLightbox({
    gallery: galleryRef.value,
    children: 'a',
    pswpModule: () => import('photoswipe'),

    // 图片加载和显示
    preload: [1, 2], // 预加载前后各1-2张图片

    // 缩放配置
    zoom: true,
    maxZoomLevel: 4, // 最大放大4倍
    initialZoomLevel: 'fit', // 初始适应屏幕
    secondaryZoomLevel: 2, // 双击放大到2倍

    // 关闭手势
    pinchToClose: true,
    closeOnVerticalDrag: true,

    // 视觉效果
    bgOpacity: 0.98,
    showHideAnimationType: 'zoom',

    // 间距和布局
    padding: {
      top: 60,
      bottom: 60,
      left: 20,
      right: 20
    },

    // 鼠标滚轮缩放
    wheelToZoom: true,

    // 图片适配
    imageClickAction: 'zoom-or-close',
    tapAction: 'toggle-controls',
    doubleTapAction: 'zoom',

    // 启用计数器和控制栏
    counter: true,
    arrowKeys: true,
  })

  lightbox.value.init()

  return lightbox.value
}

const images = computed(() => props.images ?? [])

const gridWrapperClass = computed(() => {
  const count = images.value.length
  if (count <= 0) return ''
  if (count === 1) return 'grid gap-3 grid-cols-1'
  if (count === 2) return 'grid gap-3 grid-cols-2'
  if (count === 3) return 'grid gap-3 grid-cols-3'
  // 4+张图片：两排，每排两个 (2x2布局)
  return 'grid gap-3 grid-cols-2'
})

const imageClass = computed(() => {
  const base = 'w-full border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity rounded-lg md:rounded-xl'
  // 所有图片统一使用正方形宽高比 (aspect-square)
  return `${base} aspect-square object-cover`
})

// 统一使用assetUrl处理图片
const resolveImage = (image: string) => {
  if (!image) return ''
  return image.startsWith('http') ? image : assetUrl(image)
}

const resolveThumbnail = (image: string) => {
  return resolveImage(image)
}

const resolveOriginalImage = resolveImage

const openGallery = async (index: number) => {
  const lb = await ensureLightbox()
  lb.loadAndOpen(index)
}

onUnmounted(() => {
  if (lightbox.value) {
    lightbox.value.destroy()
    lightbox.value = null
  }
})
</script>

<style>
/* PhotoSwipe 自定义样式 */
.pswp {
  --pswp-bg: rgba(0, 0, 0, 0.98);
  --pswp-icon-color: #fff;
  --pswp-icon-color-secondary: #4a90e2;
  --pswp-placeholder-bg: rgba(79, 79, 79, 0.4);
  z-index: 9999;
}

/* 按钮样式 */
.pswp__button {
  background-color: rgba(0, 0, 0, 0.6) !important;
  border-radius: 50% !important;
  transition: all 0.2s ease;
  width: 44px !important;
  height: 44px !important;
}

.pswp__button:hover {
  background-color: rgba(0, 0, 0, 0.8) !important;
  transform: scale(1.1);
}

/* 图片样式 */
.pswp__img {
  border-radius: 4px;
  object-fit: contain;
}

/* 顶部工具栏 */
.pswp__top-bar {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
  padding: 16px 20px !important;
}

/* 计数器 */
.pswp__counter {
  font-size: 14px;
  font-weight: 500;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

/* 缩放指示器 */
.pswp__zoom-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载动画 */
.pswp__preloader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pswp__preloader__icn {
  width: 40px;
  height: 40px;
  opacity: 0.6;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .pswp__button {
    width: 40px !important;
    height: 40px !important;
  }

  .pswp__top-bar {
    padding: 12px 16px !important;
  }

  .pswp {
    --pswp-bg: rgba(0, 0, 0, 1); /* 移动端全黑背景 */
  }
}

/* 平滑的淡入淡出 */
.pswp--open {
  animation: pswpFadeIn 0.3s ease-in-out;
}

@keyframes pswpFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>


