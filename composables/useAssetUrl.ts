// noinspection ThrowInsideFinallyBlockJS

export const useAssetUrl = () => {
  const config = useRuntimeConfig()

  const check = (url: string) => {
    try {
      if (url && /^https?:\/\//.test(url)) {
        const u = new URL(url)
        return u.origin
      } else {
        throw Error("fuck url could not be found")
      }
    } catch (e) {
      throw Error("fuck u retard configurator")
    }
  }

  // 获取后端基础地址（用于拼接静态资源）
  const getBackendBaseUrl = () => {
    const apiBase = config.public.apiBase as string
    return check(apiBase)
  }

  return {
    assetUrl: (path?: string | null) => {
      if (!path) return ''
      // 已是完整地址或受支持的方案，原样返回
      if (/^(https?:)?\/\//i.test(path)) return path
      if (/^data:/i.test(path)) return path
      if (/^blob:/i.test(path)) return path

      // 规范化路径并拼接后端地址
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      let urlBase = `${check(config.public.siteUrl)}/api/proxy`

      return `${urlBase}${normalizedPath}`
    },
    backendUrl: (path?: string | null) => {
      if (!path) return ''
      // 已是完整地址或受支持的方案，原样返回
      if (/^(https?:)?\/\//i.test(path)) return path
      if (/^data:/i.test(path)) return path
      if (/^blob:/i.test(path)) return path

      // 规范化路径并拼接后端地址
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      let urlBase = getBackendBaseUrl()
      return `${urlBase}${normalizedPath}`
    }
  }
}
