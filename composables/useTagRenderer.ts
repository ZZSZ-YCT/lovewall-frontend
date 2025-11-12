import type { TagDto } from '~/types'
import type { ActiveTagDto } from '~/types/extra'

type TagType = 'personal' | 'collective'

/**
 * Tag渲染结果（遵循后端API v3.3规范）
 */
export interface TagRenderResult {
  className: string      // CSS类名 = tag.name
  title: string          // 显示文本
  useCssMode: boolean    // 是否使用CSS模式
  inlineStyles?: Record<string, string>  // 颜色模式的inline样式
}

type MinimalTag = Pick<TagDto, 'name' | 'title' | 'background_color' | 'text_color'> & Partial<TagDto>

type TagWithPresentation = (TagDto | ActiveTagDto | MinimalTag) & {
  css_styles?: string | null
  tag_type?: TagType
}

// CSS注入缓存（避免重复注入）
const injectedStyles = new Set<string>()
const injectedCSS = new Map<string, string>()

/**
 * Tag渲染工具函数（完全遵循后端API v3.3规范）
 *
 * - CSS模式：完整的类选择器定义（如 `.vip-gold { ... }`），动态注入到<head>
 * - 颜色模式：使用inline style的fallback模式
 */
export function useTagRenderer() {
  /**
   * 渲染Tag
   * @param tag - TagDto | ActiveTagDto | null
   * @returns TagRenderResult | null
   */
  const renderTag = (tag: TagDto | ActiveTagDto | MinimalTag | null | undefined): TagRenderResult | null => {
    if (!tag) return null

    const title = tag.title?.trim()
    if (!title) return null

    const tagWithPresentation = tag as TagWithPresentation
    const cssStyles = tagWithPresentation.css_styles?.trim()
    const normalizedName = tag.name?.trim()

    // 1. CSS模式（优先）
    if (cssStyles && normalizedName) {
      // 动态注入CSS到<head>
      if (import.meta.client) {
        injectTagCSS(normalizedName, cssStyles)
      }

      return {
        className: normalizedName,
        title,
        useCssMode: true,
      }
    }

    // 2. 颜色模式（fallback）
    const fallbackName = normalizedName || `tag-${Date.now()}`
    const backgroundColor = tag.background_color || '#CCCCCC'
    const textColor = tag.text_color || '#000000'

    return {
      className: fallbackName,
      title,
      useCssMode: false,
      inlineStyles: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        backgroundColor,
        color: textColor,
      },
    }
  }

  /**
   * 动态注入Tag CSS到<head>
   * @param tagName - tag.name（CSS类名）
   * @param css - 完整的CSS字符串（包含类选择器）
   */
  const injectTagCSS = (tagName: string, css: string) => {
    const normalizedName = tagName?.trim()
    if (!normalizedName) return

    const styleId = `tag-style-${normalizedName}`

    const existingStyle = document.getElementById(styleId) as HTMLStyleElement | null

    // CSS内容没变则跳过
    if (existingStyle && injectedCSS.get(normalizedName) === css) {
      return
    }

    const styleEl = existingStyle ?? document.createElement('style')
    if (!existingStyle) {
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css

    injectedCSS.set(normalizedName, css)
    injectedStyles.add(normalizedName)

    if (import.meta.dev) {
      const action = existingStyle ? 'Updated' : 'Injected'
      console.log(`[TagRenderer] ${action} CSS for tag: ${normalizedName}`)
    }
  }

  /**
   * 清除已注入的CSS（用于HMR或清理）
   */
  const clearInjectedCSS = (tagName: string) => {
    if (!import.meta.client) return

    const normalizedName = tagName?.trim()
    if (!normalizedName) return

    const styleId = `tag-style-${normalizedName}`
    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
      injectedStyles.delete(normalizedName)
      injectedCSS.delete(normalizedName)
    }
  }

  /**
   * 预加载多个Tag的CSS（用于SSR或批量渲染）
   */
  const preloadTags = (tags: (TagDto | ActiveTagDto | MinimalTag)[]) => {
    if (!import.meta.client) return

    for (const tag of tags) {
      const cssStyles = (tag as TagWithPresentation).css_styles?.trim()
      if (cssStyles) {
        injectTagCSS(tag.name, cssStyles)
      }
    }
  }

  return {
    renderTag,
    injectTagCSS,
    clearInjectedCSS,
    preloadTags,
  }
}
