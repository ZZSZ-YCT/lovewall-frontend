// @vitest-environment node
// noinspection ES6PreferShortImport

import { describe, it, expect } from 'vitest'
import { useRenderMd } from '../../composables/useRenderMd'

describe('useRenderMd', () => {
  it('it works', async () => {
    const { render } = useRenderMd()

    const md = `
# Hello World

Some **bold** text.

\`\`\`js
console.log('hi')
\`\`\`
`.trim()

    const html = await render(md)

    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain('<h1')

    // rehype-slug: id should be based on heading text
    expect(html).toContain('id="hello-world"')

    // remark-gfm + remark-rehype: strong tag
    expect(html).toContain('<strong>bold</strong>')

    // rehype-highlight: language class on code block
    expect(html).toContain('<code')
    expect(html).toContain('language-js')
  })
})
