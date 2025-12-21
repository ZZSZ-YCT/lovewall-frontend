<template>
  <div
    class="page-129-root relative transition-colors duration-300"
    :class="safeIsDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'
      : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900'"
  >
    <!-- 背景装饰（暗色模式） -->
    <div
      v-show="safeIsDark"
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.18),transparent_40%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_50%_82%,rgba(16,185,129,0.14),transparent_42%)]"
      aria-hidden="true"
    />

    <!-- 背景装饰（亮色模式） -->
    <div
      v-show="!safeIsDark"
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_46%_78%,rgba(52,211,153,0.12),transparent_40%)]"
      aria-hidden="true"
    />

    <!-- 超级视觉特效层 -->
    <!-- 动态极光背景 -->
    <div class="fx-aurora pointer-events-none" aria-hidden="true" />

    <!-- 粒子漂浮效果 -->
    <div class="fx-particles pointer-events-none" aria-hidden="true" />

    <!-- 主内容容器（玻璃框直接占满，性能优化） -->
    <div
      class="glass-shell relative mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-hidden rounded-3xl border p-6 transition-colors duration-300 sm:gap-8 sm:p-8 lg:gap-10 lg:p-10"
      :class="safeIsDark
        ? 'border-white/10 bg-white/5 shadow-xl shadow-emerald-950/30 backdrop-blur-lg'
        : 'border-slate-200/70 bg-white/70 shadow-lg shadow-slate-200/60 backdrop-blur-md'"
    >
      <!-- 页面头部 -->
      <header class="flex flex-col items-center gap-3 text-center sm:gap-4">
        <!-- 主标题 -->
        <h1 class="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {{ t('page129.pageTitle') }}
        </h1>

        <!-- 描述和视频提供者 -->
        <div class="flex flex-col gap-2">
          <p class="mx-auto max-w-3xl text-sm sm:text-base md:text-lg" :class="safeIsDark ? 'text-white/70' : 'text-slate-600'">
            {{ t('page129.pageDescription') }}
          </p>
          <p class="text-xs sm:text-sm" :class="safeIsDark ? 'text-white/60' : 'text-slate-500'">
            {{ t('page129.videoProvider') }}
            <a
              href="https://space.bilibili.com/509981213/lists/6902494"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium transition-colors hover:underline"
              :class="safeIsDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-blue-600 hover:text-blue-700'"
            >
              {{ t('page129.videoProviderName') }}</a>{{ t('page129.videoProviderSuffix') }}
          </p>
        </div>

        <!-- 快速导航 -->
        <nav class="flex flex-wrap justify-center gap-2 text-xs sm:gap-3 sm:text-sm" :aria-label="t('page129.quickNav')">
          <a
            v-for="anchor in sections"
            :key="anchor.id"
            class="whitespace-nowrap rounded-full px-3 py-1.5 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 sm:py-2"
            :class="safeIsDark
              ? 'border border-white/10 bg-white/5 text-white/80 shadow-lg shadow-emerald-900/30 hover:border-emerald-300/50 hover:text-white hover:shadow-emerald-700/40 focus-visible:outline-emerald-300'
              : 'border border-slate-200 bg-white text-slate-700 shadow-md hover:border-blue-300 hover:text-blue-600 hover:shadow-lg focus-visible:outline-blue-500'"
            :href="`#${anchor.id}`"
            :aria-label="t('page129.jumpTo', { title: t(`page129.sections.${anchor.id}.title`) })"
          >
            {{ t(`page129.sections.${anchor.id}.title`) }}
          </a>
        </nav>
      </header>

      <!-- 视频展示区域 -->
      <section
        v-for="(section, sectionIndex) in sections"
        :id="section.id"
        :key="section.id"
        class="scroll-mt-20 sm:scroll-mt-24"
      >
        <!-- 分区头部 -->
        <div class="mb-4 flex flex-col gap-2 sm:mb-6">
          <div>
            <h2 class="text-xl font-semibold sm:text-2xl lg:text-3xl">
              {{ t(`page129.sections.${section.id}.title`) }}
            </h2>
            <p class="text-sm" :class="safeIsDark ? 'text-white/60' : 'text-slate-500'">
              {{ t(`page129.sections.${section.id}.description`) }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-xs" :class="safeIsDark ? 'text-white/60' : 'text-slate-500'">
            <span class="h-2 w-2 rounded-full" :class="safeIsDark ? 'bg-emerald-400' : 'bg-blue-500'" aria-hidden="true" />
            <span class="whitespace-nowrap">{{ section.items.length }} {{ t('page129.videos') }}</span>
          </div>
        </div>

        <!-- 视频卡片网格 -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          <article
            v-for="(item, cardIndex) in section.items"
            :key="item.id"
            class="card-appear group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl"
            :class="safeIsDark
              ? 'border-white/10 bg-white/10 shadow-2xl shadow-emerald-900/40 backdrop-blur-xl hover:shadow-emerald-700/50'
              : 'border-slate-200 bg-white shadow-lg hover:shadow-2xl'"
            :style="{ animationDelay: `${(sectionIndex * 10 + cardIndex) * 60}ms` }"
            @click="openVideo(item)"
          >
            <!-- 视频封面 -->
            <div class="relative aspect-video overflow-hidden">
              <img
                :src="getVideoCover(item.bvid)"
                :alt="`${item.title} 封面`"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                @error="onCoverError($event, item.bvid)"
              />
              <!-- 播放按钮遮罩 -->
              <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-transform duration-300 group-hover:scale-110">
                  <svg class="h-8 w-8 translate-x-0.5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="p-3 sm:p-4">
              <h3 class="whitespace-nowrap text-base font-semibold leading-tight sm:text-lg">
                {{ item.title }}
              </h3>
            </div>
          </article>
        </div>
      </section>
    </div><!-- 玻璃容器结束 -->

    <!-- 视频弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedVideo"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          :class="safeIsDark ? 'bg-black/80' : 'bg-black/60'"
          @click.self="closeVideo"
        >
          <div
            class="relative w-full max-w-6xl overflow-hidden rounded-2xl shadow-2xl"
            :class="safeIsDark ? 'bg-slate-900' : 'bg-white'"
          >
            <!-- 关闭按钮 -->
            <button
              class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              :class="safeIsDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-slate-900 hover:bg-black/20'"
              @click="closeVideo"
              :aria-label="t('page129.closeVideo')"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- 视频播放器 -->
            <div class="aspect-video">
              <iframe
                v-if="selectedVideo"
                :title="`${selectedVideo.title} - Bilibili`"
                class="h-full w-full"
                :src="getBilibiliUrl(selectedVideo.bvid)"
                frameborder="0"
                allowfullscreen
                allow="fullscreen; picture-in-picture; clipboard-write; autoplay"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>

            <!-- 下载操作区域 -->
            <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <!-- 标题 -->
              <div>
                <h3 class="text-lg font-semibold sm:text-xl">{{ selectedVideo?.title }}</h3>
              </div>

              <!-- 下载按钮和二维码 -->
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <!-- 百度网盘下载按钮 -->
                <a
                  :href="selectedVideo?.pan"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:rounded-xl"
                  :class="safeIsDark
                    ? 'bg-gradient-to-r from-emerald-400/90 via-cyan-300/90 to-emerald-400/90 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-400/40 focus-visible:outline-emerald-200'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-400/40 focus-visible:outline-blue-500'"
                  :aria-label="t('page129.downloadVideo', { title: selectedVideo?.title })"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="h-4 w-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  {{ t('page129.baiduNetdisk') }}
                </a>

                <!-- 二维码（仅非移动端显示） -->
                <div v-if="!safeIsMobile" class="flex items-center justify-center gap-3 sm:justify-start">
                  <div class="text-xs" :class="safeIsDark ? 'text-white/60' : 'text-slate-500'">
                    {{ t('page129.scanToDownload') }}
                  </div>
                  <div
                    class="qr-code-container overflow-hidden rounded-lg border shadow-inner"
                    :class="safeIsDark
                      ? 'border-white/15 bg-white/5 shadow-black/40'
                      : 'border-slate-200 bg-slate-50 shadow-slate-200'"
                  >
                    <img
                      :src="getQRCodeUrl(selectedVideo.bvid)"
                      class="h-full w-full object-contain transition-transform duration-300"
                      :alt="t('page129.qrCodeAlt', { title: selectedVideo?.title })"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 郑州四中纪念129红歌比赛活动视频展示页面
 *
 * 功能特性：
 * - 响应式布局，支持所有设备（手机、平板、电脑）
 * - 暗色/亮色模式自动适配
 * - 点击播放视频（模态框弹出）
 * - 视频封面展示
 * - UA 检测（移动端隐藏二维码）
 * - 二维码悬停放大效果
 * - 国际化支持（中文、英文）
 * - SEO优化和无障碍访问支持
 */

// ==================== 页面元数据配置 ====================

definePageMeta({
  title: { k: 'page129.pageTitle' }
})

// ==================== 类型定义 ====================

/**
 * 视频项数据结构
 */
interface VideoItem {
  id: string
  title: string
  bvid: string
  pan: string
}

/**
 * 分区数据结构
 */
interface Section {
  id: string
  items: VideoItem[]
}

// ==================== 组合式函数 ====================

const { t, locale } = useI18n()
const colorMode = useColorMode()
const { isMobile: deviceIsMobile } = useDeviceSafe()

// ==================== 响应式状态 ====================

/** 当前选中的视频（用于弹窗） */
const selectedVideo = ref<VideoItem | null>(null)

/** 是否为暗色模式 */
const isDark = computed(() => colorMode.value === 'dark')

/** 是否已挂载（用于避免 SSR 水合不匹配） */
const isMounted = ref(false)

/**
 * 安全的暗色模式标志（SSR 兼容）
 * SSR 时始终返回 false，客户端挂载后才返回真实值
 */
const safeIsDark = computed(() => isMounted.value && isDark.value)

/**
 * 安全的移动端标志（SSR 兼容）
 * 使用 useDeviceSafe 提供的设备检测
 */
const safeIsMobile = computed(() => isMounted.value && deviceIsMobile.value)

// ==================== SEO元数据配置 ====================

useHead({
  title: computed(() => t('page129.pageTitle')),
  htmlAttrs: {
    lang: computed(() => {
      const code = locale.value
      if (code === 'zh_cn' || code === 'zh' || code === 'zh_tw') return 'zh-CN'
      return 'en'
    })
  },
  meta: [
    {
      name: 'description',
      content: computed(() => t('page129.meta.description'))
    },
    {
      name: 'keywords',
      content: computed(() => t('page129.meta.keywords'))
    },
    {
      property: 'og:title',
      content: computed(() => t('page129.pageTitle'))
    },
    {
      property: 'og:description',
      content: computed(() => t('page129.meta.description'))
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes'
    }
  ]
})

// ==================== 工具函数 ====================

/**
 * 根据BV号生成Bilibili播放器URL
 */
const getBilibiliUrl = (bvid: string): string => {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&as_wide=1&autoplay=1`
}

/**
 * 根据BV号生成视频封面URL
 * 优先使用本地封面，失败时回退到默认占位符
 */
const COVER_BASE = '/assets/129'

const getCoverCandidates = (bvid: string): string[] => [
  `${COVER_BASE}/cover-${bvid}.png`,
  `${COVER_BASE}/cover-${bvid}.jpg`,
  `${COVER_BASE}/default-cover.png`,
  `${COVER_BASE}/default-cover.jpg`
]

const getVideoCover = (bvid: string): string => getCoverCandidates(bvid)[0]

/**
 * 封面加载失败时的回退处理
 */
const onCoverError = (event: Event, bvid: string) => {
  const target = event.target as HTMLImageElement | null
  if (!target) return

  const nextIndex = Number(target.dataset.coverFallbackIndex || '0') + 1
  const nextSrc = getCoverCandidates(bvid)[nextIndex]
  if (nextSrc) {
    target.dataset.coverFallbackIndex = `${nextIndex}`
    target.src = nextSrc
  }
}

/**
 * 根据BV号生成二维码图片URL
 */
const getQRCodeUrl = (bvid: string): string => {
  return `/assets/129/qr-${bvid}.png`
}

/**
 * 打开视频弹窗
 */
const openVideo = (video: VideoItem) => {
  selectedVideo.value = video
  // 禁止背景滚动
  document.body.style.overflow = 'hidden'
}

/**
 * 关闭视频弹窗
 */
const closeVideo = () => {
  selectedVideo.value = null
  // 恢复背景滚动
  document.body.style.overflow = ''
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 标记为已挂载，允许客户端特定的渲染
  isMounted.value = true

  // 监听 Escape 键关闭弹窗
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedVideo.value) {
      closeVideo()
    }
  }
  window.addEventListener('keydown', handleKeydown)

  // 清理
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  })
})

// ==================== 视频数据配置 ====================

const sections: Section[] = [
  {
    "id": "regular",
    "items": [
      {
        "id": "class1",
        "title": "高一1班",
        "bvid": "BV1H82XBiEpT",
        "pan": "https://pan.baidu.com/s/1USgjLDZnvitpoOGSGRt7ZA?pwd=0000 "
      },
      {
        "id": "class2",
        "title": "高一2班",
        "bvid": "BV1ca2XBNEpo",
        "pan": "https://pan.baidu.com/s/13aE0B3RMfBwPq9OiITJbww?pwd=0000"
      },
      {
        "id": "class3",
        "title": "高一3班",
        "bvid": "BV1ZZ2QBtEAo",
        "pan": "https://pan.baidu.com/s/1gf_JSW7RFjUW6-d7kc_upQ?pwd=0000"
      },
      {
        "id": "class4",
        "title": "高一4班",
        "bvid": "BV1fi2XBhELC",
        "pan": "https://pan.baidu.com/s/1VeVAV-JJa0-WByP2kkIlvw?pwd=0000"
      },
      {
        "id": "class5",
        "title": "高一5班",
        "bvid": "BV1ic2XBxE7v",
        "pan": "https://pan.baidu.com/s/1sMgap0boBkQ5GBGPPZtArQ?pwd=0000"
      },
      {
        "id": "class6",
        "title": "高一6班",
        "bvid": "BV1zi2XBaEMQ",
        "pan": "https://pan.baidu.com/s/1RDIXixZAoea6e5AaqKkrlA?pwd=0000"
      },
      {
        "id": "class7",
        "title": "高一7班",
        "bvid": "BV1qp29BFEN1",
        "pan": "https://pan.baidu.com/s/1h6RaeRNs9bsKap6HUpfyLg?pwd=0000"
      },
      {
        "id": "class8",
        "title": "高一8班",
        "bvid": "BV1qZ2QBtEE1",
        "pan": "https://pan.baidu.com/s/1BV4TArM5icJdbsOIq5X6Mw?pwd=0000"
      },
      {
        "id": "class9",
        "title": "高一9班",
        "bvid": "BV1jf2QBoEh5",
        "pan": "https://pan.baidu.com/s/18mD34zJdHT4VwQRWaGubdg?pwd=0000"
      },
      {
        "id": "class10",
        "title": "高一10班",
        "bvid": "BV1qZ2QBtE6u",
        "pan": "https://pan.baidu.com/s/1rxRw2cIbHvGldSvRu2UV3Q?pwd=0000"
      },
      {
        "id": "class11",
        "title": "高一11班",
        "bvid": "BV1HD2QBAEwG",
        "pan": "https://pan.baidu.com/s/1Mq9tg4ceGoIvN35G1V1CPA?pwd=0000"
      },
      {
        "id": "class12",
        "title": "高一12班",
        "bvid": "BV1Ed2QBfEMZ",
        "pan": "https://pan.baidu.com/s/1vYUe4uKUXqwurD1iBTsWsw?pwd=0000"
      },
      {
        "id": "class13",
        "title": "高一13班",
        "bvid": "BV1cV29BTEk1",
        "pan": "https://pan.baidu.com/s/1X_G0X6FLrt-OnFCVx86g1g?pwd=0000"
      },
      {
        "id": "class14",
        "title": "高一14班",
        "bvid": "BV1ra2XBNEKV",
        "pan": "https://pan.baidu.com/s/1VZLlhXDAMJaIhRL972iMWQ?pwd=0000"
      },
      {
        "id": "class15",
        "title": "高一15班",
        "bvid": "BV1nD2QBAEQ2",
        "pan": "https://pan.baidu.com/s/1f0rBezGQHTiIo3WR9pkm4w?pwd=0000"
      }
    ]
  },
  {
    "id": "tibetan",
    "items": [
      {
        "id": "zang1",
        "title": "藏1班",
        "bvid": "BV1if2QBoEmd",
        "pan": "https://pan.baidu.com/s/1RWbkQolSMuKNSTQ7dpOkYw?pwd=0000"
      },
      {
        "id": "zang2",
        "title": "藏2班",
        "bvid": "BV1Bd2QBfEHi",
        "pan": "https://pan.baidu.com/s/1Fdto2Yf0zdpVegrLJLC0nQ?pwd=0000"
      },
      {
        "id": "zang3",
        "title": "藏3班",
        "bvid": "BV16Q2QBaEJx",
        "pan": "https://pan.baidu.com/s/1u2xMmx7tj3R9JZ5qzVj7sQ?pwd=0000"
      }
    ]
  },
  {
    "id": "demei",
    "items": [
      {
        "id": "demei1",
        "title": "德美1班",
        "bvid": "BV1Lc2XBxEUb",
        "pan": "https://pan.baidu.com/s/1jukiDqLJ7_YFwMOgIxQK5w?pwd=0000"
      },
      {
        "id": "demei2",
        "title": "德美2班",
        "bvid": "BV17d2QBfEZ1",
        "pan": "https://pan.baidu.com/s/1OpBJ5a-USnXuh92-6k-uMg?pwd=0000"
      }
    ]
  },
  {
    "id": "teacher",
    "items": [
      {
        "id": "teacher",
        "title": "教师合唱",
        "bvid": "BV1nQ2QBaEWu",
        "pan": "https://pan.baidu.com/s/TEACHER"
      }
    ]
  }
]
</script>

<style scoped>
/**
 * 🌈 超级视觉特效层
 */

/* 动态极光背景 */
.fx-aurora {
  position: absolute;
  inset: -8%;
  z-index: 1;
  background:
    radial-gradient(1200px 900px at 10% 20%, rgba(255, 92, 163, 0.35), transparent 55%),
    radial-gradient(1100px 820px at 85% 10%, rgba(99, 102, 241, 0.35), transparent 60%),
    radial-gradient(1400px 980px at 50% 90%, rgba(45, 212, 191, 0.32), transparent 60%);
  filter: blur(70px);
  opacity: 0.9;
  mix-blend-mode: screen;
  animation: auroraFlow 18s ease-in-out infinite alternate;
}

/* 粒子漂浮效果 */
.fx-particles {
  position: absolute;
  inset: -8%;
  z-index: 2;
  background-image:
    radial-gradient(circle at 12% 26%, rgba(255,255,255,0.7) 0, transparent 22%),
    radial-gradient(circle at 82% 22%, rgba(99,102,241,0.5) 0, transparent 24%),
    radial-gradient(circle at 34% 74%, rgba(255,92,163,0.5) 0, transparent 24%),
    radial-gradient(circle at 74% 68%, rgba(45,212,191,0.5) 0, transparent 22%),
    radial-gradient(circle at 50% 44%, rgba(255,255,255,0.45) 0, transparent 28%),
    radial-gradient(circle at 16% 78%, rgba(99,102,241,0.45) 0, transparent 20%);
  background-size: 140% 140%;
  opacity: 0.75;
  mix-blend-mode: screen;
  animation: particleDrift 18s ease-in-out infinite alternate;
}

/**
 * 根元素背景高光装饰
 */
.page-129-root::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.08), transparent 42%),
    radial-gradient(circle at 82% 82%, rgba(0, 0, 0, 0.08), transparent 48%);
  pointer-events: none;
}

/**
 * 玻璃容器装饰效果
 */
.glass-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  opacity: 0.7;
  pointer-events: none;
  z-index: 1;
}

.glass-shell > * {
  position: relative;
  z-index: 2;
}

@media (max-width: 640px) {
  .glass-shell {
    border-radius: 18px;
  }
}

/**
 * 💎 视频卡片 3D 悬浮效果
 */
.card-appear {
  transform-style: preserve-3d;
  will-change: transform, box-shadow;
}

/* 卡片透光高光层 */
.card-appear::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(120deg, rgba(255,255,255,0.32), transparent 55%),
    radial-gradient(500px 320px at 20% 20%, rgba(255,92,163,0.18), transparent 50%),
    radial-gradient(520px 360px at 80% 0%, rgba(99,102,241,0.2), transparent 52%);
  opacity: 0;
  transform: translate3d(0, 8px, 0);
  transition: opacity 0.5s ease, transform 0.5s ease;
  pointer-events: none;
  mix-blend-mode: screen;
}

/* 桌面端悬停 3D 效果 */
@media (min-width: 768px) {
  .card-appear:hover {
    transform: translateY(-8px) scale(1.015) rotateX(2deg) rotateY(-2deg);
    box-shadow:
      0 22px 60px -12px rgba(31, 38, 135, 0.24),
      0 12px 32px -10px rgba(255,92,163,0.28),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.26);
  }

  .card-appear:hover::after {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/**
 * 卡片渐入动画（性能优化：缩短时长）
 */
.card-appear {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
  animation: fadeUp 0.5s ease forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/**
 * 模态框过渡动画
 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}

/**
 * 二维码悬停放大效果
 */
.qr-code-container {
  width: 80px;
  height: 80px;
  transition: transform 0.3s ease;
}

.qr-code-container:hover {
  transform: scale(1.15);
}

.qr-code-container img {
  transition: transform 0.3s ease;
}

.qr-code-container:hover img {
  transform: scale(1.05);
}

/**
 * 🎬 动画关键帧定义
 */

/* 极光流动动画 */
@keyframes auroraFlow {
  0% {
    transform: translate3d(-2%, -2%, 0) scale(1);
  }
  50% {
    transform: translate3d(3%, 1%, 0) scale(1.02);
  }
  100% {
    transform: translate3d(-1%, 3%, 0) scale(1);
  }
}

/* 粒子漂浮动画 */
@keyframes particleDrift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 40% 60%;
  }
  100% {
    background-position: 80% 20%;
  }
}

/**
 * 支持 prefers-reduced-motion
 */
@media (prefers-reduced-motion: reduce) {
  /* 关闭所有特效动画 */
  .fx-aurora,
  .fx-particles {
    animation: none !important;
    opacity: 0.4;
  }

  .card-appear {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .card-appear::after {
    display: none;
  }

  .modal-enter-active,
  .modal-leave-active,
  .qr-code-container,
  .qr-code-container img {
    transition: none;
  }
}
</style>

<style>
/**
 * 全局样式：平滑滚动
 */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
</style>
