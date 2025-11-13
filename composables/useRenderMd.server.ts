import { render } from '~/server/utils/renderMd'

export function useRenderMd() {
  return {
    render: async (markdown: string) => {
      return await render(markdown)
    }
  }
}
