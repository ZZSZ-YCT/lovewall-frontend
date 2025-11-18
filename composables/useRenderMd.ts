// composables/useRenderMd.client.ts
export function useRenderMd() {
  const render = async (markdown: string) => {
    const { html } = await $fetch<{ html: string }>('/api/render-md', {
      method: 'POST',
      body: { markdown },
    })

    return html
  }

  return { render }
}
