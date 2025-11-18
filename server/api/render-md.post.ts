import { render } from '~/server/utils/renderMd'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ markdown: string }>(event)
  const html = await render(body.markdown)
  return { html }
})
