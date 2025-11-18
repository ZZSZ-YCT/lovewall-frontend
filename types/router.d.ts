import 'vue-router'

export interface I18nTitle {
  k: string
  p?: Record<string, unknown> | unknown[]
}

export interface RawTitle {
  raw: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: I18nTitle | RawTitle | string
  }
}

export {}
